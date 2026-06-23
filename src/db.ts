import Database from 'better-sqlite3';
import { Observation, Session, CCRBlob } from './models';

const DB_PATH = process.env.DB_PATH || '~/.harbor/agent.db';

let db: any = null;

export function getDb(): any {
  if (!db) {
    db = new Database(DB_PATH.replace('~', process.env.HOME || '/home/user'));
    initSchema();
  }
  return db;
}

function initSchema() {
  const database = getDb();

  // Sessions table
  database.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      project_path TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      summary TEXT
    )
  `);

  // Observations table with FTS5
  database.exec(`
    CREATE TABLE IF NOT EXISTS observations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      type TEXT NOT NULL,
      tool TEXT,
      content TEXT NOT NULL,
      compressed_content TEXT,
      ccr_key TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      metadata TEXT,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    )
  `);

  database.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS observations_fts USING fts5(
      content, 
      session_id UNINDEXED,
      type UNINDEXED,
      tool UNINDEXED,
      timestamp UNINDEXED
    )
  `);

  // CCR Blobs
  database.exec(`
    CREATE TABLE IF NOT EXISTS ccr_blobs (
      key TEXT PRIMARY KEY,
      original_content TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Trigger to keep FTS in sync
  database.exec(`
    CREATE TRIGGER IF NOT EXISTS observations_ai AFTER INSERT ON observations BEGIN
      INSERT INTO observations_fts(rowid, content, session_id, type, tool, timestamp) 
      VALUES (new.id, new.content, new.session_id, new.type, new.tool, new.timestamp);
    END;
  `);
}

export function createSession(projectPath: string): Session {
  const db = getDb();
  const id = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const startedAt = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO sessions (id, project_path, started_at) VALUES (?, ?, ?)
  `);
  stmt.run(id, projectPath, startedAt);

  return { id, project_path: projectPath, started_at: startedAt };
}

export function getSession(id: string): Session | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM sessions WHERE id = ?');
  return stmt.get(id) as Session | null;
}

export function saveObservation(obs: Omit<Observation, 'id' | 'timestamp'>): Observation {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO observations (session_id, type, tool, content, compressed_content, ccr_key, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    obs.session_id,
    obs.type,
    obs.tool || null,
    obs.content,
    obs.compressed_content || null,
    obs.ccr_key || null,
    obs.metadata ? JSON.stringify(obs.metadata) : null
  );

  const id = result.lastInsertRowid as number;

  return {
    ...obs,
    id: String(id),
    timestamp: new Date().toISOString()
  };
}

export function saveCCRBlob(blob: CCRBlob): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO ccr_blobs (key, original_content, type, created_at) 
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(blob.key, blob.original_content, blob.type, blob.created_at);
}

export function getCCRBlob(key: string): CCRBlob | null {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM ccr_blobs WHERE key = ?');
  return stmt.get(key) as CCRBlob | null;
}

export function searchObservations(query: string, limit = 10): any[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT o.*, 
           highlight(observations_fts, 0, '<mark>', '</mark>') as highlighted
    FROM observations_fts 
    JOIN observations o ON o.id = observations_fts.rowid
    WHERE observations_fts MATCH ?
    ORDER BY rank
    LIMIT ?
  `);
  return stmt.all(query, limit);
}

export function getRecentObservations(sessionId: string, limit = 20): Observation[] {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT * FROM observations 
    WHERE session_id = ? 
    ORDER BY timestamp DESC 
    LIMIT ?
  `);
  return stmt.all(sessionId, limit) as Observation[];
}