"""
Аутентификация клиентов яхтенного чартера через одноразовый код (OTP).
Поддерживает отправку кода на email и его верификацию с созданием сессии.
"""

import json
import os
import random
import secrets
import smtplib
import ssl
from datetime import datetime, timedelta, timezone

import psycopg2

DATABASE_URL = os.environ["DATABASE_URL"]
MAIN_DB_SCHEMA = os.environ["MAIN_DB_SCHEMA"]
SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "465"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
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


def send_otp_email(to_email: str, code: str) -> None:
    """Отправляет письмо с OTP-кодом на указанный email через SMTP с SSL."""
    subject = "Ваш код входа в YachtCharter"
    body_text = f"Ваш код подтверждения: {code}\nКод действителен 15 минут."

    message = (
        f"From: {SMTP_USER}\r\n"
        f"To: {to_email}\r\n"
        f"Subject: {subject}\r\n"
        f"Content-Type: text/plain; charset=utf-8\r\n"
        f"\r\n"
        f"{body_text}"
    )

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_USER, to_email, message.encode("utf-8"))


def handle_send_otp(body: dict) -> dict:
    """
    Генерирует и отправляет 6-значный OTP-код клиенту на email.
    Если клиент не найден в базе — возвращает 404.
    """
    email = (body.get("email") or "").strip().lower()

    if not email:
        return json_response(400, {"error": "Необходимо указать email"})

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            "SELECT id, name FROM clients WHERE email = %s",
            [email],
        )
        row = cur.fetchone()

        if row is None:
            cur.close()
            return json_response(404, {"error": "Клиент не найден"})

        client_id, client_name = row

        code = str(random.randint(100000, 999999))
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

        cur.execute(
            """
            INSERT INTO client_otp (client_id, email, code, expires_at, used)
            VALUES (%s, %s, %s, %s, false)
            """,
            [client_id, email, code, expires_at],
        )
        conn.commit()
        cur.close()

        send_otp_email(email, code)

        return json_response(200, {"sent": True})

    except Exception as e:
        if conn:
            conn.rollback()
        return json_response(500, {"error": f"Внутренняя ошибка сервера: {str(e)}"})
    finally:
        if conn:
            conn.close()


def handle_verify_otp(body: dict) -> dict:
    """
    Проверяет OTP-код клиента: код должен быть не использован и не просрочен.
    При успехе помечает код использованным и создаёт сессию.
    """
    email = (body.get("email") or "").strip().lower()
    code = (body.get("code") or "").strip()

    if not email or not code:
        return json_response(400, {"error": "Необходимо указать email и код"})

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            """
            SELECT co.id, co.client_id, co.expires_at, c.name, c.email
            FROM client_otp co
            JOIN clients c ON c.id = co.client_id
            WHERE co.email = %s
              AND co.code = %s
              AND co.used = false
            ORDER BY co.expires_at DESC
            LIMIT 1
            """,
            [email, code],
        )
        row = cur.fetchone()

        if row is None:
            cur.close()
            return json_response(401, {"error": "Неверный или уже использованный код"})

        otp_id, client_id, expires_at, client_name, client_email = row

        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if datetime.now(timezone.utc) > expires_at:
            cur.close()
            return json_response(401, {"error": "Код истёк"})

        cur.execute(
            "UPDATE client_otp SET used = true WHERE id = %s",
            [otp_id],
        )

        token = secrets.token_hex(32)
        session_expires_at = datetime.now(timezone.utc) + timedelta(days=7)

        cur.execute(
            """
            INSERT INTO sessions (token, client_id, role, expires_at)
            VALUES (%s, %s, %s, %s)
            """,
            [token, client_id, "client", session_expires_at],
        )
        conn.commit()
        cur.close()

        return json_response(
            200,
            {
                "token": token,
                "name": client_name,
                "email": client_email,
                "client_id": client_id,
            },
        )

    except Exception as e:
        if conn:
            conn.rollback()
        return json_response(500, {"error": f"Внутренняя ошибка сервера: {str(e)}"})
    finally:
        if conn:
            conn.close()


def handler(event, context):
    """
    Главный обработчик функции аутентификации клиентов через OTP.
    Маршрутизация по пути или по полю action в теле запроса:
      POST /send-otp   | action=send-otp   — отправка одноразового кода на email клиента
      POST /verify-otp | action=verify-otp — проверка кода и выдача токена сессии
    """
    method = event.get("method", "POST").upper()
    path = event.get("path", "/").rstrip("/") or "/"

    if method == "OPTIONS":
        return {
            "statusCode": 204,
            "headers": CORS_HEADERS,
            "body": "",
        }

    raw_body = event.get("body") or "{}"
    if isinstance(raw_body, str):
        try:
            body = json.loads(raw_body) if raw_body.strip() else {}
        except json.JSONDecodeError:
            return json_response(400, {"error": "Некорректный JSON"})
    else:
        body = raw_body or {}

    # Определяем действие: по пути или по полю action в теле запроса
    action = body.get("action", "")

    if path == "/send-otp" or (path == "/" and action == "send-otp"):
        return handle_send_otp(body)

    if path == "/verify-otp" or (path == "/" and action == "verify-otp"):
        return handle_verify_otp(body)

    return json_response(404, {"error": "Маршрут не найден"})