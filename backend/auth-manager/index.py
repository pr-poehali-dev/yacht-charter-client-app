"""
Менеджер аутентификации для яхтенного чартер-приложения.
Обрабатывает вход менеджеров по email/паролю и проверку текущей сессии.
"""

import json
import os
import secrets
import smtplib
import ssl
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import bcrypt
import psycopg2

DATABASE_URL = os.environ["DATABASE_URL"]
MAIN_DB_SCHEMA = os.environ["MAIN_DB_SCHEMA"]

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token, Authorization, X-Requested-With",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json",
}


def get_connection():
    conn = psycopg2.connect(
        DATABASE_URL,
        options=f"-c search_path={MAIN_DB_SCHEMA}",
    )
    return conn


def json_response(status: int, body: dict) -> dict:
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, ensure_ascii=False, default=str),
    }


def handle_login(body: dict) -> dict:
    """Обрабатывает вход менеджера: проверяет email и пароль, создаёт сессию."""
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""

    if not email or not password:
        return json_response(400, {"error": "Необходимо указать email и пароль"})

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT id, name, email, password_hash, is_admin FROM managers WHERE email = %s AND is_active = TRUE",
            [email],
        )
        row = cur.fetchone()

        if row is None:
            return json_response(401, {"error": "Неверный email или пароль"})

        manager_id, name, manager_email, password_hash, is_admin = row

        stored_hash = password_hash
        if isinstance(stored_hash, str):
            stored_hash = stored_hash.encode("utf-8")

        if not bcrypt.checkpw(password.encode("utf-8"), stored_hash):
            return json_response(401, {"error": "Неверный email или пароль"})

        token = secrets.token_hex(32)
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)

        cur.execute(
            """
            INSERT INTO sessions (token, user_id, email, role, expires_at)
            VALUES (%s, %s, %s, %s, %s)
            """,
            [token, manager_id, manager_email, "manager", expires_at],
        )
        conn.commit()
        cur.close()

        return json_response(200, {"token": token, "name": name, "email": manager_email, "is_admin": bool(is_admin)})

    except Exception as e:
        if conn:
            conn.rollback()
        return json_response(500, {"error": f"Внутренняя ошибка сервера: {str(e)}"})
    finally:
        if conn:
            conn.close()


def handle_me(headers: dict) -> dict:
    """Возвращает информацию о текущем менеджере по токену из заголовка X-Auth-Token."""
    token = headers.get("x-auth-token") or headers.get("X-Auth-Token") or ""
    token = token.strip()

    if not token:
        return json_response(401, {"error": "Токен не передан"})

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT s.role, s.expires_at, m.id, m.name, m.email, m.is_admin
            FROM sessions s
            JOIN managers m ON m.id = s.user_id
            WHERE s.token = %s AND s.role = 'manager'
            """,
            [token],
        )
        row = cur.fetchone()
        cur.close()

        if row is None:
            return json_response(401, {"error": "Сессия не найдена"})

        role, expires_at, manager_id, name, email, is_admin = row

        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if datetime.now(timezone.utc) > expires_at:
            return json_response(401, {"error": "Сессия истекла"})

        return json_response(200, {"id": manager_id, "name": name, "email": email, "role": role, "is_admin": bool(is_admin)})

    except Exception as e:
        return json_response(500, {"error": f"Внутренняя ошибка сервера: {str(e)}"})
    finally:
        if conn:
            conn.close()


def send_email(to_email: str, subject: str, html_body: str):
    """Отправляет email через SMTP — поддерживает SSL (465) и STARTTLS (587)."""
    smtp_host = os.environ.get("SMTP_HOST", "")
    smtp_port = int(os.environ.get("SMTP_PORT", "465"))
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_pass = os.environ.get("SMTP_PASSWORD", "")

    print(f"[SMTP] host={smtp_host} port={smtp_port} user={smtp_user} to={to_email}")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = smtp_user
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    context = ssl.create_default_context()
    if smtp_port == 587:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.ehlo()
            server.starttls(context=context)
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, to_email, msg.as_string())
    else:
        with smtplib.SMTP_SSL(smtp_host, smtp_port, context=context) as server:
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, to_email, msg.as_string())
    print(f"[SMTP] Email sent successfully to {to_email}")


def handle_forgot_password(body: dict) -> dict:
    """Отправляет ссылку для сброса пароля на email менеджера."""
    email = (body.get("email") or "").strip().lower()
    if not email:
        return json_response(400, {"error": "Укажите email"})

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, name FROM managers WHERE email = %s AND is_active = TRUE", [email])
        row = cur.fetchone()

        # Всегда возвращаем 200 — не раскрываем существование email
        if row is None:
            cur.close()
            return json_response(200, {"sent": True})

        manager_id, name = row
        reset_token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=2)

        cur.execute(
            "INSERT INTO password_reset_tokens (email, token, expires_at) VALUES (%s, %s, %s)",
            [email, reset_token, expires_at]
        )
        conn.commit()
        cur.close()

        # Ссылка для сброса (фронтенд должен обработать параметр reset_token)
        app_url = "https://poehali.dev"  # будет заменено фронтендом
        reset_link = f"?reset_token={reset_token}"

        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <img src="https://cdn.poehali.dev/projects/cfd2a8a4-eb7e-4847-9fbc-3fbbbec5963a/bucket/be2eb5ba-e2db-4c10-993e-8afc42049268.png"
               alt="Abeona Club" style="height: 64px; margin-bottom: 24px;" />
          <h2 style="color: #0d2d5e; font-size: 22px; margin-bottom: 8px;">Сброс пароля</h2>
          <p style="color: #555; font-size: 15px;">Здравствуйте, {name}!</p>
          <p style="color: #555; font-size: 15px;">Вы запросили сброс пароля для входа в панель менеджера Abeona Club.</p>
          <p style="color: #555; font-size: 15px;">Ваш код сброса:</p>
          <div style="background: #f0f6ff; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0d2d5e;">{reset_token[:8].upper()}</span>
          </div>
          <p style="color: #888; font-size: 13px;">Код действителен 2 часа. Если вы не запрашивали сброс — просто проигнорируйте это письмо.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #bbb; font-size: 12px;">Abeona Club — яхтенный чартер</p>
        </div>
        """

        send_email(email, "Сброс пароля — Abeona Club", html)
        return json_response(200, {"sent": True})

    except Exception as e:
        import traceback
        print(f"[forgot-password ERROR] {str(e)}\n{traceback.format_exc()}")
        if conn: conn.rollback()
        return json_response(500, {"error": str(e)})
    finally:
        if conn: conn.close()


def handle_reset_password(body: dict) -> dict:
    """Устанавливает новый пароль по коду из письма."""
    email = (body.get("email") or "").strip().lower()
    code = (body.get("code") or "").strip().upper()
    new_password = body.get("new_password") or ""

    if not email or not code or not new_password:
        return json_response(400, {"error": "Заполните все поля"})
    if len(new_password) < 8:
        return json_response(400, {"error": "Пароль должен быть минимум 8 символов"})

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        # Ищем токен: сравниваем первые 8 символов (uppercased) с кодом
        cur.execute(
            """SELECT id, token, expires_at FROM password_reset_tokens
               WHERE email = %s AND used = FALSE
               ORDER BY created_at DESC LIMIT 1""",
            [email]
        )
        row = cur.fetchone()

        if row is None:
            return json_response(400, {"error": "Код не найден или уже использован"})

        token_id, token, expires_at = row
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires_at:
            return json_response(400, {"error": "Код истёк. Запросите новый."})
        if token[:8].upper() != code:
            return json_response(400, {"error": "Неверный код"})

        # Хэшируем новый пароль и обновляем
        new_hash = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt(12)).decode("utf-8")
        cur.execute("UPDATE managers SET password_hash = %s WHERE email = %s", [new_hash, email])
        cur.execute("UPDATE password_reset_tokens SET used = TRUE WHERE id = %s", [token_id])
        conn.commit()
        cur.close()

        return json_response(200, {"ok": True})

    except Exception as e:
        if conn: conn.rollback()
        return json_response(500, {"error": str(e)})
    finally:
        if conn: conn.close()


def handle_set_password(body: dict) -> dict:
    """Временный эндпоинт для установки пароля менеджера (только при наличии setup_key)."""
    setup_key = body.get("setup_key", "")
    if setup_key != "abeona_setup_2025":
        return json_response(403, {"error": "Forbidden"})

    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    if not email or not password:
        return json_response(400, {"error": "email и password обязательны"})

    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(12)).decode("utf-8")
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("UPDATE managers SET password_hash = %s WHERE email = %s", [hashed, email])
        conn.commit()
        cur.close()
        return json_response(200, {"ok": True, "hash": hashed})
    except Exception as e:
        if conn: conn.rollback()
        return json_response(500, {"error": str(e)})
    finally:
        if conn: conn.close()


def get_admin_manager(token: str, conn):
    """Возвращает менеджера если токен валидный и is_admin=True, иначе None"""
    cur = conn.cursor()
    cur.execute("""
        SELECT m.id, m.name, m.email, m.is_admin
        FROM sessions s JOIN managers m ON m.id = s.user_id
        WHERE s.token = %s AND s.role = 'manager'
        AND s.expires_at > NOW()
    """, [token])
    row = cur.fetchone()
    cur.close()
    if row is None: return None
    manager_id, name, email, is_admin = row
    if not is_admin: return None
    return {"id": manager_id, "name": name, "email": email}


def handle_invite_manager(body: dict, headers_lower: dict) -> dict:
    """Приглашает нового менеджера по email. Только для администраторов."""
    token = (headers_lower.get("x-auth-token") or "").strip()
    if not token:
        return json_response(401, {"error": "Токен не передан"})

    email = (body.get("email") or "").strip().lower()
    name = (body.get("name") or "").strip()

    if not email or not name:
        return json_response(400, {"error": "Необходимо указать email и name"})

    conn = None
    try:
        conn = get_connection()

        admin = get_admin_manager(token, conn)
        if admin is None:
            return json_response(403, {"error": "Доступ запрещён: требуются права администратора"})

        cur = conn.cursor()

        # Проверяем, что email ещё не зарегистрирован
        cur.execute("SELECT id FROM managers WHERE email = %s", [email])
        if cur.fetchone() is not None:
            cur.close()
            return json_response(409, {"error": "Менеджер с таким email уже существует"})

        invite_token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=72)

        cur.execute(
            """INSERT INTO invite_tokens (email, name, token, expires_at, invited_by)
               VALUES (%s, %s, %s, %s, %s)""",
            [email, name, invite_token, expires_at, admin["id"]]
        )
        conn.commit()
        cur.close()

        code = invite_token[:12].upper()
        html = f"""
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <img src="https://cdn.poehali.dev/projects/cfd2a8a4-eb7e-4847-9fbc-3fbbbec5963a/bucket/be2eb5ba-e2db-4c10-993e-8afc42049268.png"
               alt="Abeona Club" style="height: 64px; margin-bottom: 24px;" />
          <h2 style="color: #0d2d5e; font-size: 22px; margin-bottom: 8px;">Приглашение в Abeona Club</h2>
          <p style="color: #555; font-size: 15px;">Здравствуйте, {name}!</p>
          <p style="color: #555; font-size: 15px;">Вас пригласили в Abeona Club как менеджера.</p>
          <p style="color: #555; font-size: 15px;">Ваш код приглашения:</p>
          <div style="background: #f0f6ff; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
            <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #0d2d5e;">{code}</span>
          </div>
          <p style="color: #555; font-size: 15px;">Код действителен 72 часа. Перейдите на сайт и выберите «Принять приглашение».</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #bbb; font-size: 12px;">Abeona Club — яхтенный чартер</p>
        </div>
        """

        send_email(email, "Приглашение в Abeona Club", html)
        return json_response(200, {"sent": True, "email": email})

    except Exception as e:
        import traceback
        print(f"[invite-manager ERROR] {str(e)}\n{traceback.format_exc()}")
        if conn: conn.rollback()
        return json_response(500, {"error": str(e)})
    finally:
        if conn: conn.close()


def handle_accept_invite(body: dict) -> dict:
    """Принимает приглашение, создаёт менеджера и возвращает сессию."""
    email = (body.get("email") or "").strip().lower()
    code = (body.get("code") or "").strip().upper()
    name = (body.get("name") or "").strip()
    password = body.get("password") or ""

    if not email or not code or not name or not password:
        return json_response(400, {"error": "Необходимо указать email, code, name и password"})
    if len(password) < 8:
        return json_response(400, {"error": "Пароль должен быть минимум 8 символов"})

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            """SELECT id, token, expires_at FROM invite_tokens
               WHERE email = %s AND used = FALSE
               ORDER BY created_at DESC LIMIT 1""",
            [email]
        )
        row = cur.fetchone()

        if row is None:
            return json_response(400, {"error": "Приглашение не найдено или уже использовано"})

        invite_id, invite_token, expires_at = row
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires_at:
            return json_response(400, {"error": "Приглашение истекло"})
        if invite_token[:12].upper() != code:
            return json_response(400, {"error": "Неверный код приглашения"})

        password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(12)).decode("utf-8")

        cur.execute(
            """INSERT INTO managers (email, name, password_hash, is_admin)
               VALUES (%s, %s, %s, FALSE)
               RETURNING id""",
            [email, name, password_hash]
        )
        manager_id = cur.fetchone()[0]

        cur.execute("UPDATE invite_tokens SET used = TRUE WHERE id = %s", [invite_id])

        session_token = secrets.token_hex(32)
        session_expires = datetime.now(timezone.utc) + timedelta(days=7)
        cur.execute(
            """INSERT INTO sessions (token, user_id, email, role, expires_at)
               VALUES (%s, %s, %s, %s, %s)""",
            [session_token, manager_id, email, "manager", session_expires]
        )
        conn.commit()
        cur.close()

        return json_response(200, {
            "token": session_token,
            "name": name,
            "email": email,
            "is_admin": False,
        })

    except Exception as e:
        import traceback
        print(f"[accept-invite ERROR] {str(e)}\n{traceback.format_exc()}")
        if conn: conn.rollback()
        return json_response(500, {"error": str(e)})
    finally:
        if conn: conn.close()


def handle_list_managers(headers_lower: dict) -> dict:
    """Возвращает список всех менеджеров. Только для администраторов."""
    token = (headers_lower.get("x-auth-token") or "").strip()
    if not token:
        return json_response(401, {"error": "Токен не передан"})

    conn = None
    try:
        conn = get_connection()

        admin = get_admin_manager(token, conn)
        if admin is None:
            return json_response(403, {"error": "Доступ запрещён: требуются права администратора"})

        cur = conn.cursor()
        cur.execute(
            """SELECT id, name, email, is_admin, is_active, created_at
               FROM managers
               ORDER BY created_at"""
        )
        rows = cur.fetchall()
        columns = [desc[0] for desc in cur.description]
        cur.close()

        managers = [dict(zip(columns, row)) for row in rows]
        return json_response(200, {"managers": managers})

    except Exception as e:
        import traceback
        print(f"[list-managers ERROR] {str(e)}\n{traceback.format_exc()}")
        return json_response(500, {"error": str(e)})
    finally:
        if conn: conn.close()


def handle_toggle_manager(body: dict, headers_lower: dict) -> dict:
    """Переключает активность менеджера. Только для администраторов."""
    token = (headers_lower.get("x-auth-token") or "").strip()
    if not token:
        return json_response(401, {"error": "Токен не передан"})

    target_id = body.get("manager_id")
    if not target_id:
        return json_response(400, {"error": "Необходимо указать manager_id"})

    conn = None
    try:
        conn = get_connection()

        admin = get_admin_manager(token, conn)
        if admin is None:
            return json_response(403, {"error": "Доступ запрещён: требуются права администратора"})

        if int(target_id) == int(admin["id"]):
            return json_response(400, {"error": "Нельзя деактивировать самого себя"})

        cur = conn.cursor()
        cur.execute(
            """UPDATE managers SET is_active = NOT is_active
               WHERE id = %s AND is_admin = FALSE""",
            [target_id]
        )
        conn.commit()
        cur.close()

        return json_response(200, {"ok": True})

    except Exception as e:
        import traceback
        print(f"[toggle-manager ERROR] {str(e)}\n{traceback.format_exc()}")
        if conn: conn.rollback()
        return json_response(500, {"error": str(e)})
    finally:
        if conn: conn.close()


def handler(event, context):
    """
    Главный обработчик функции аутентификации менеджеров.
    Маршрутизация по пути или по полю action в теле запроса:
      POST /login   | action=login — вход по email и паролю, возвращает токен сессии
      GET  /me      | action=me    — получение данных текущего менеджера по токену
    """
    method = (event.get("httpMethod") or event.get("method") or "POST").upper()
    path = (event.get("path") or "/").rstrip("/") or "/"
    headers = event.get("headers") or {}

    # Нормализуем заголовки к нижнему регистру для единообразия
    headers_lower = {k.lower(): v for k, v in headers.items()}

    if method == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": "{}",
        }

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

    # Диагностика
    if body.get("action") == "debug":
        return json_response(200, {
            "method": method,
            "path": path,
            "is_base64": is_base64,
            "body": body,
            "event_keys": list(event.keys()),
        })

    # Определяем действие: по полю action в теле запроса
    action = body.get("action", "")

    # Маршрутизация: по пути или по полю action в теле
    if path == "/login" or (path == "/" and action == "login"):
        return handle_login(body)

    if path == "/me" or (action == "me"):
        return handle_me(headers_lower)

    if path == "/set-password" or (action == "set-password"):
        return handle_set_password(body)

    if path == "/forgot-password" or (action == "forgot-password"):
        return handle_forgot_password(body)

    if path == "/test-smtp" or (action == "test-smtp"):
        try:
            smtp_host = os.environ.get("SMTP_HOST", "NOT SET")
            smtp_port = int(os.environ.get("SMTP_PORT", "0"))
            smtp_user = os.environ.get("SMTP_USER", "NOT SET")
            smtp_pass_set = bool(os.environ.get("SMTP_PASSWORD", ""))
            import smtplib, ssl as ssl_mod
            context = ssl_mod.create_default_context()
            if smtp_port == 587:
                s = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
                s.ehlo(); s.starttls(context=context); s.login(smtp_user, os.environ.get("SMTP_PASSWORD", "")); s.quit()
            else:
                s = smtplib.SMTP_SSL(smtp_host, smtp_port, context=context, timeout=10)
                s.login(smtp_user, os.environ.get("SMTP_PASSWORD", "")); s.quit()
            return json_response(200, {"ok": True, "host": smtp_host, "port": smtp_port, "user": smtp_user, "pass_set": smtp_pass_set})
        except Exception as e:
            import traceback
            return json_response(200, {"ok": False, "error": str(e), "trace": traceback.format_exc(), "host": os.environ.get("SMTP_HOST",""), "port": os.environ.get("SMTP_PORT",""), "user": os.environ.get("SMTP_USER","")})

    if path == "/reset-password" or (action == "reset-password"):
        return handle_reset_password(body)

    if path == "/invite-manager" or (action == "invite-manager"):
        return handle_invite_manager(body, headers_lower)

    if path == "/accept-invite" or (action == "accept-invite"):
        return handle_accept_invite(body)

    if path == "/list-managers" or (action == "list-managers"):
        return handle_list_managers(headers_lower)

    if path == "/toggle-manager" or (action == "toggle-manager"):
        return handle_toggle_manager(body, headers_lower)

    return json_response(404, {"error": "Маршрут не найден"})