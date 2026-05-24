"""
Менеджер аутентификации для яхтенного чартер-приложения.
Обрабатывает вход менеджеров по email/паролю и проверку текущей сессии.
"""

import json
import os
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
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
            "SELECT id, name, email, password_hash FROM managers WHERE email = %s",
            [email],
        )
        row = cur.fetchone()

        if row is None:
            return json_response(401, {"error": "Неверный email или пароль"})

        manager_id, name, manager_email, password_hash = row

        stored_hash = password_hash
        if isinstance(stored_hash, str):
            stored_hash = stored_hash.encode("utf-8")

        if not bcrypt.checkpw(password.encode("utf-8"), stored_hash):
            return json_response(401, {"error": "Неверный email или пароль"})

        token = secrets.token_hex(32)
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)

        cur.execute(
            """
            INSERT INTO sessions (token, manager_id, role, expires_at)
            VALUES (%s, %s, %s, %s)
            """,
            [token, manager_id, "manager", expires_at],
        )
        conn.commit()
        cur.close()

        return json_response(200, {"token": token, "name": name, "email": manager_email})

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
            SELECT s.role, s.expires_at, m.id, m.name, m.email
            FROM sessions s
            JOIN managers m ON m.id = s.manager_id
            WHERE s.token = %s AND s.role = 'manager'
            """,
            [token],
        )
        row = cur.fetchone()
        cur.close()

        if row is None:
            return json_response(401, {"error": "Сессия не найдена"})

        role, expires_at, manager_id, name, email = row

        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if datetime.now(timezone.utc) > expires_at:
            return json_response(401, {"error": "Сессия истекла"})

        return json_response(200, {"id": manager_id, "name": name, "email": email, "role": role})

    except Exception as e:
        return json_response(500, {"error": f"Внутренняя ошибка сервера: {str(e)}"})
    finally:
        if conn:
            conn.close()


def handler(event, context):
    """
    Главный обработчик функции аутентификации менеджеров.
    Маршрутизация по пути или по полю action в теле запроса:
      POST /login   | action=login — вход по email и паролю, возвращает токен сессии
      GET  /me      | action=me    — получение данных текущего менеджера по токену
    """
    method = event.get("method", "GET").upper()
    path = event.get("path", "/").rstrip("/") or "/"
    headers = event.get("headers") or {}

    # Нормализуем заголовки к нижнему регистру для единообразия
    headers_lower = {k.lower(): v for k, v in headers.items()}

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

    # Определяем действие: по полю action в теле запроса
    action = body.get("action", "")

    # Маршрутизация: по пути или по полю action в теле
    if path == "/login" or (path == "/" and action == "login"):
        return handle_login(body)

    if path == "/me" or (action == "me"):
        return handle_me(headers_lower)

    return json_response(404, {"error": "Маршрут не найден"})