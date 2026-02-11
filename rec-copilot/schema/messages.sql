CREATE TABLE IF NOT EXISTS messages (
    msg_id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(site_id) REFERENCES sites(site_id)
);

CREATE INDEX IF NOT EXISTS idx_messages_site_time ON messages(site_id, created_at);
