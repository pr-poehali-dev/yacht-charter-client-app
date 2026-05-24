ALTER TABLE managers ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

UPDATE managers SET is_admin = TRUE WHERE email = 'tatiana.ayyildiz@abeona.club';

CREATE TABLE invite_tokens (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    invited_by INTEGER REFERENCES managers(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);