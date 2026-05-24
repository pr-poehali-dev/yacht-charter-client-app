"""
API для управления бронированиями яхт.
Поддерживает просмотр бронирований (для клиента — только свои, для менеджера — все)
и создание новых бронирований (только для менеджера).
"""

import json
import os
from datetime import datetime, timezone

import psycopg2

DATABASE_URL = os.environ["DATABASE_URL"]
MAIN_DB_SCHEMA = os.environ["MAIN_DB_SCHEMA"]

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
    "Content-Type": "application/json",
}


def get_connection():
    conn = psycopg2.connect(
        DATABASE_URL,
        options=f"-c search_path={MAIN_DB_SCHEMA}",
    )
    return conn


def json_response(status: int, body) -> dict:
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, ensure_ascii=False, default=str),
    }


def resolve_session(token: str, conn) -> dict | None:
    """
    Проверяет токен сессии в таблице sessions.
    Возвращает словарь с полями role, user_id или None если сессия не действительна.
    """
    cur = conn.cursor()
    cur.execute(
        """
        SELECT role, user_id, expires_at FROM sessions WHERE token = %s
        """,
        [token],
    )
    row = cur.fetchone()
    cur.close()

    if row is None:
        return None

    role, user_id, expires_at = row

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if datetime.now(timezone.utc) > expires_at:
        return None

    return {"role": role, "user_id": user_id}


def handle_get_bookings(session: dict, conn) -> dict:
    """
    Возвращает список бронирований.
    Клиент получает только свои бронирования.
    Менеджер-администратор видит все, обычный менеджер — только созданные им.
    """
    cur = conn.cursor()

    base_query = """
        SELECT
            b.id, b.yacht_name, b.yacht_type, b.marina, b.country, b.flag,
            b.date_from, b.date_to, b.status,
            b.captain, b.cabins, b.berths, b.length, b.engine, b.notes,
            b.marina_address, b.marina_vhf, b.marina_phone, b.marina_email,
            b.marina_checkin, b.marina_checkout, b.marina_coordinates,
            b.client_id, c.name AS client_name, c.email AS client_email, c.phone AS client_phone
        FROM bookings b
        LEFT JOIN clients c ON c.id = b.client_id
    """

    role = session["role"]
    user_id = session["user_id"]

    if role == "client":
        cur.execute(base_query + " WHERE b.client_id = %s ORDER BY b.date_from DESC", [user_id])
    else:
        # Проверяем is_admin у менеджера
        cur.execute("SELECT is_admin FROM managers WHERE id = %s", [user_id])
        manager_row = cur.fetchone()
        is_admin = manager_row[0] if manager_row else False

        if is_admin:
            cur.execute(base_query + " ORDER BY b.date_from DESC")
        else:
            cur.execute(base_query + " WHERE b.created_by = %s ORDER BY b.date_from DESC", [user_id])

    rows = cur.fetchall()
    columns = [desc[0] for desc in cur.description]
    cur.close()

    bookings = [dict(zip(columns, row)) for row in rows]
    return json_response(200, bookings)


def handle_create_booking(body: dict, session: dict, conn) -> dict:
    """
    Создаёт новое бронирование яхты.
    Доступно только менеджерам. Возвращает созданную запись.
    Если передан client_name/client_email — создаёт клиента автоматически.
    """
    if not body.get("yacht_name") or not body.get("date_from") or not body.get("date_to"):
        return json_response(400, {"error": "Поля yacht_name, date_from, date_to обязательны"})

    cur = conn.cursor()

    # Автосоздание клиента по имени/email
    client_id = body.get("client_id")
    client_name_in = (body.get("client_name") or "").strip()
    client_email_in = (body.get("client_email") or "").strip().lower()

    if not client_id:
        if client_email_in:
            cur.execute("SELECT id FROM clients WHERE email = %s", [client_email_in])
            row = cur.fetchone()
            if row:
                client_id = row[0]
            else:
                cur.execute(
                    "INSERT INTO clients (email, name) VALUES (%s, %s) RETURNING id",
                    [client_email_in, client_name_in or client_email_in]
                )
                client_id = cur.fetchone()[0]
        elif client_name_in:
            cur.execute(
                "INSERT INTO clients (email, name) VALUES (%s, %s) RETURNING id",
                [f"noemail_{session.get('user_id')}_{client_name_in.lower().replace(' ', '_')}@placeholder.local", client_name_in]
            )
            client_id = cur.fetchone()[0]

    yacht_name = body.get("yacht_name")
    yacht_type = body.get("yacht_type")
    marina = body.get("marina")
    country = body.get("country")
    flag = body.get("flag")
    date_from = body.get("date_from")
    date_to = body.get("date_to")
    status = body.get("status", "pending")
    captain = body.get("captain")
    cabins = body.get("cabins")
    berths = body.get("berths")
    length = body.get("length")
    engine = body.get("engine")
    notes = body.get("notes")
    marina_address = body.get("marina_address")
    marina_vhf = body.get("marina_vhf")
    marina_phone = body.get("marina_phone")
    marina_email = body.get("marina_email")
    marina_checkin = body.get("marina_checkin")
    marina_checkout = body.get("marina_checkout")
    marina_coordinates = body.get("marina_coordinates")
    created_by = body.get("manager_id") or session.get("user_id")

    # Обновляем телефон клиента если передан
    client_phone = body.get("client_phone") or (body.get("client_email") and "")
    if client_phone and client_id:
        cur.execute("UPDATE clients SET phone = %s WHERE id = %s AND (phone IS NULL OR phone = '')", [client_phone, client_id])

    cur.execute(
        """
        INSERT INTO bookings (
            client_id, yacht_name, yacht_type, marina, country, flag,
            date_from, date_to, status, captain, cabins, berths,
            length, engine, notes, created_by,
            marina_address, marina_vhf, marina_phone, marina_email,
            marina_checkin, marina_checkout, marina_coordinates
        ) VALUES (
            %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s, %s, %s
        )
        RETURNING
            id, yacht_name, yacht_type, marina, country, flag,
            date_from, date_to, status, captain, cabins, berths,
            length, engine, notes, client_id, created_by
        """,
        [
            client_id, yacht_name, yacht_type, marina, country, flag,
            date_from, date_to, status, captain, cabins, berths,
            length, engine, notes, created_by,
            marina_address, marina_vhf, marina_phone, marina_email,
            marina_checkin, marina_checkout, marina_coordinates,
        ],
    )
    row = cur.fetchone()
    columns = [desc[0] for desc in cur.description]
    conn.commit()

    # Получаем имя клиента
    cur.execute("SELECT name FROM clients WHERE id = %s", [client_id])
    client_row = cur.fetchone()
    cur.close()

    booking = dict(zip(columns, row))
    booking["client_name"] = client_row[0] if client_row else None

    return json_response(201, booking)


def handler(event, context):
    """
    Главный обработчик API бронирований яхт.
    Маршруты:
      GET  / — список бронирований (клиент видит свои, менеджер видит все)
      POST / — создание бронирования (только менеджер)
    Требует заголовок X-Auth-Token с действующим токеном сессии.
    """
    method = (event.get("httpMethod") or event.get("method") or "GET").upper()
    path = event.get("path", "/").rstrip("/") or "/"
    headers = event.get("headers") or {}

    headers_lower = {k.lower(): v for k, v in headers.items()}

    if method == "OPTIONS":
        return {
            "statusCode": 204,
            "headers": CORS_HEADERS,
            "body": "",
        }

    # Токен из заголовка, query string или тела запроса
    token = (headers_lower.get("x-auth-token") or "").strip()
    if not token:
        query = event.get("queryStringParameters") or {}
        token = (query.get("token") or "").strip()
    if not token:
        # Попробуем прочитать из тела (если тело уже распарсено ниже)
        pass

    if not token:
        return json_response(401, {"error": "Токен не передан"})

    conn = None
    try:
        conn = get_connection()
        session = resolve_session(token, conn)

        if session is None:
            return json_response(401, {"error": "Сессия не найдена или истекла"})

        if method == "GET" and path == "/":
            return handle_get_bookings(session, conn)

        if method == "POST" and path == "/":
            if session["role"] != "manager":
                return json_response(403, {"error": "Доступ запрещён: требуется роль менеджера"})

            raw_body = event.get("body") or "{}"
            is_base64 = event.get("isBase64Encoded", False)
            if isinstance(raw_body, str):
                try:
                    if is_base64:
                        import base64
                        raw_body = base64.b64decode(raw_body).decode("utf-8")
                    body = json.loads(raw_body) if raw_body.strip() else {}
                except Exception:
                    try:
                        import base64
                        decoded = base64.b64decode(raw_body + "==").decode("utf-8")
                        body = json.loads(decoded)
                    except Exception:
                        body = {}
            else:
                body = raw_body or {}

            return handle_create_booking(body, session, conn)

        # PUT — обновление бронирования
        if method == "PUT" or (method == "POST" and body.get("_method") == "PUT"):
            if session["role"] != "manager":
                return json_response(403, {"error": "Доступ запрещён"})
            booking_id = body.get("id")
            if not booking_id:
                return json_response(400, {"error": "Не передан id бронирования"})

            fields = [
                ("yacht_name", body.get("yacht_name")),
                ("yacht_type", body.get("yacht_type")),
                ("captain", body.get("captain")),
                ("length", body.get("length")),
                ("engine", body.get("engine")),
                ("flag", body.get("flag")),
                ("cabins", body.get("cabins")),
                ("berths", body.get("berths")),
                ("marina", body.get("marina")),
                ("country", body.get("country")),
                ("marina_address", body.get("marina_address")),
                ("marina_vhf", body.get("marina_vhf")),
                ("marina_phone", body.get("marina_phone")),
                ("marina_email", body.get("marina_email")),
                ("marina_checkin", body.get("marina_checkin")),
                ("marina_checkout", body.get("marina_checkout")),
                ("marina_coordinates", body.get("marina_coordinates")),
                ("date_from", body.get("date_from")),
                ("date_to", body.get("date_to")),
                ("status", body.get("status")),
                ("notes", body.get("notes")),
            ]
            updates = [(k, v) for k, v in fields if v is not None]
            if not updates:
                return json_response(400, {"error": "Нет полей для обновления"})

            set_clause = ", ".join([f"{k} = %s" for k, _ in updates])
            values = [v for _, v in updates] + [booking_id]
            cur = conn.cursor()
            cur.execute(f"UPDATE bookings SET {set_clause} WHERE id = %s", values)

            # Обновляем клиента если переданы данные
            client_name = body.get("client_name")
            client_phone = body.get("client_phone")
            client_email = body.get("client_email")
            if any([client_name, client_phone, client_email]):
                cur.execute("SELECT client_id FROM bookings WHERE id = %s", [booking_id])
                cid_row = cur.fetchone()
                if cid_row and cid_row[0]:
                    cid = cid_row[0]
                    client_updates = []
                    client_vals = []
                    if client_name: client_updates.append("name = %s"); client_vals.append(client_name)
                    if client_phone: client_updates.append("phone = %s"); client_vals.append(client_phone)
                    if client_email: client_updates.append("email = %s"); client_vals.append(client_email)
                    if client_updates:
                        cur.execute(f"UPDATE clients SET {', '.join(client_updates)} WHERE id = %s", client_vals + [cid])

            conn.commit()
            cur.close()
            return json_response(200, {"ok": True})

        # DELETE бронирования
        if method == "DELETE" or (method == "POST" and body.get("_method") == "DELETE" and body.get("_target") == "booking"):
            if session["role"] != "manager":
                return json_response(403, {"error": "Доступ запрещён"})
            booking_id = body.get("id")
            if not booking_id:
                return json_response(400, {"error": "Не передан id"})
            cur = conn.cursor()
            cur.execute("DELETE FROM reminders WHERE booking_id = %s", [booking_id])
            cur.execute("DELETE FROM crew_members WHERE booking_id = %s", [booking_id])
            cur.execute("DELETE FROM payments WHERE booking_id = %s", [booking_id])
            cur.execute("DELETE FROM bookings WHERE id = %s", [booking_id])
            conn.commit()
            cur.close()
            return json_response(200, {"ok": True})

        # GET /clients — список клиентов
        if path == "/clients" or (method == "GET" and body.get("_action") == "list-clients"):
            if session["role"] != "manager":
                return json_response(403, {"error": "Доступ запрещён"})
            cur = conn.cursor()
            cur.execute("""
                SELECT c.id, c.name, c.email, c.phone, c.created_at,
                       COUNT(b.id) AS booking_count
                FROM clients c
                LEFT JOIN bookings b ON b.client_id = c.id
                GROUP BY c.id ORDER BY c.created_at DESC
            """)
            rows = cur.fetchall()
            cols = [d[0] for d in cur.description]
            cur.close()
            return json_response(200, {"clients": [dict(zip(cols, r)) for r in rows]})

        # POST /clients — создать клиента
        if path == "/clients" and method == "POST" or (method == "POST" and body.get("_action") == "create-client"):
            if session["role"] != "manager":
                return json_response(403, {"error": "Доступ запрещён"})
            name = (body.get("name") or "").strip()
            email = (body.get("email") or "").strip().lower()
            phone = (body.get("phone") or "").strip()
            notes = (body.get("notes") or "").strip()
            if not name:
                return json_response(400, {"error": "Имя обязательно"})
            if not email:
                return json_response(400, {"error": "Email обязателен"})
            cur = conn.cursor()
            cur.execute("SELECT id FROM clients WHERE email = %s", [email])
            if cur.fetchone():
                return json_response(400, {"error": "Клиент с таким email уже существует"})
            cur.execute(
                "INSERT INTO clients (name, email, phone) VALUES (%s, %s, %s) RETURNING id, name, email, phone, created_at",
                [name, email, phone or None]
            )
            row = cur.fetchone()
            cols = [d[0] for d in cur.description]
            conn.commit()
            cur.close()
            return json_response(201, dict(zip(cols, row)))

        # PUT /clients — обновить клиента
        if method == "POST" and body.get("_action") == "update-client":
            if session["role"] != "manager":
                return json_response(403, {"error": "Доступ запрещён"})
            client_id = body.get("id")
            if not client_id:
                return json_response(400, {"error": "Не передан id клиента"})
            fields = [("name", body.get("name")), ("email", body.get("email")), ("phone", body.get("phone"))]
            updates = [(k, v) for k, v in fields if v is not None]
            if not updates:
                return json_response(400, {"error": "Нет данных для обновления"})
            set_clause = ", ".join([f"{k} = %s" for k, _ in updates])
            values = [v for _, v in updates] + [client_id]
            cur = conn.cursor()
            cur.execute(f"UPDATE clients SET {set_clause} WHERE id = %s RETURNING id, name, email, phone", values)
            row = cur.fetchone()
            cols = [d[0] for d in cur.description]
            conn.commit()
            cur.close()
            return json_response(200, dict(zip(cols, row)))

        # DELETE /clients — удалить клиента и все его бронирования
        if method == "POST" and body.get("_action") == "delete-client":
            if session["role"] != "manager":
                return json_response(403, {"error": "Доступ запрещён"})
            client_id = body.get("id")
            if not client_id:
                return json_response(400, {"error": "Не передан id клиента"})
            cur = conn.cursor()
            # Удаляем все связанные записи бронирований клиента
            cur.execute("SELECT id FROM bookings WHERE client_id = %s", [client_id])
            bids = [r[0] for r in cur.fetchall()]
            for bid in bids:
                cur.execute("DELETE FROM reminders WHERE booking_id = %s", [bid])
                cur.execute("DELETE FROM crew_members WHERE booking_id = %s", [bid])
                cur.execute("DELETE FROM payments WHERE booking_id = %s", [bid])
            if bids:
                cur.execute("DELETE FROM bookings WHERE client_id = %s", [client_id])
            cur.execute("DELETE FROM sessions WHERE role = 'client' AND user_id = %s", [client_id])
            cur.execute("DELETE FROM clients WHERE id = %s", [client_id])
            conn.commit()
            cur.close()
            return json_response(200, {"ok": True})

        return json_response(404, {"error": "Маршрут не найден"})

    except Exception as e:
        if conn:
            conn.rollback()
        return json_response(500, {"error": f"Внутренняя ошибка сервера: {str(e)}"})
    finally:
        if conn:
            conn.close()