CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    yacht_name TEXT NOT NULL,
    yacht_type TEXT,
    marina TEXT NOT NULL,
    country TEXT,
    date_from DATE NOT NULL,
    date_to DATE NOT NULL,
    status TEXT DEFAULT 'new',
    captain TEXT,
    cabins INTEGER,
    berths INTEGER,
    length TEXT,
    engine TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by INTEGER REFERENCES managers(id)
);