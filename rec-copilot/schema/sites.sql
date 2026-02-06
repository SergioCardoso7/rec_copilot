CREATE TABLE IF NOT EXISTS sites (
    site_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    timezone TEXT NOT NULL,
    active_constraints_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
);