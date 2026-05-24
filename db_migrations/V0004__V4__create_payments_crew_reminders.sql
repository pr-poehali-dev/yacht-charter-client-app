CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id),
    name TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    due_date DATE,
    status TEXT DEFAULT 'upcoming',
    paid_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE crew_members (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id),
    name TEXT NOT NULL,
    role TEXT,
    age INTEGER,
    passport BOOLEAN DEFAULT FALSE,
    visa BOOLEAN DEFAULT FALSE,
    medical BOOLEAN DEFAULT FALSE
);

CREATE TABLE reminders (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id),
    text TEXT NOT NULL,
    reminder_date DATE,
    priority TEXT DEFAULT 'medium',
    done BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);