import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', '..', '.data');
const DB_PATH = path.join(DATA_DIR, 'drill.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const db = new DatabaseSync(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS drill_session (
    session_id   TEXT PRIMARY KEY,
    operator     TEXT NOT NULL,
    started_at   TEXT NOT NULL,
    finished_at  TEXT,
    total_score  INTEGER NOT NULL DEFAULT 0,
    grade        TEXT
  );

  CREATE TABLE IF NOT EXISTS operation_record (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id   TEXT NOT NULL,
    operation    TEXT NOT NULL,
    borehole_id  TEXT NOT NULL,
    score_delta  INTEGER NOT NULL,
    correct      INTEGER NOT NULL,
    message      TEXT NOT NULL,
    timestamp    TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES drill_session(session_id)
  );

  CREATE INDEX IF NOT EXISTS idx_operation_session ON operation_record(session_id);
`);

export default db;
