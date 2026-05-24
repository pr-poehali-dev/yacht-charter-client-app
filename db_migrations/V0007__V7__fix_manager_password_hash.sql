-- Обновляем пароль менеджера: Charter2025!
-- Хэш сгенерирован через bcrypt.hashpw(b'Charter2025!', bcrypt.gensalt(12))
UPDATE managers SET password_hash = '$2b$12$8K1p/a0dR1xqM1q6K8aKtu9fdjMVqmKlQ4S4F3/A.V5h3UoAa0j5K' WHERE email = 'manager@yachtcharter.ru';