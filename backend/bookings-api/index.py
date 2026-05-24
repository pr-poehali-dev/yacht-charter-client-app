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

        return json_response(404, {"error": "Маршрут не найден"})

    except Exception as e:
        if conn:
            conn.rollback()
        return json_response(500, {"error": f"Внутренняя ошибка сервера: {str(e)}"})
    finally:
        if conn:
            conn.close()