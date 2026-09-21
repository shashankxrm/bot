import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import type { Mood } from "./moods";

export interface StoredMessage {
  role: "user" | "assistant";
  content: string;
  mood: Mood;
  timestamp: string;
}

// Vercel serverless has a read-only filesystem — use /tmp there
const DATA_DIR = process.env.VERCEL
  ? path.join("/tmp", "siri-bot")
  : path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "conversations.db");
const LEGACY_JSON = path.join(process.cwd(), "data", "conversations.json");

declare global {
  var __siriDb: Database.Database | undefined;
}

function migrateFromJson(db: Database.Database): void {
  if (!fs.existsSync(LEGACY_JSON)) return;

  const count = db.prepare("SELECT COUNT(*) AS c FROM messages").get() as {
    c: number;
  };
  if (count.c > 0) return;

  try {
    const raw = fs.readFileSync(LEGACY_JSON, "utf-8").trim();
    if (!raw) return;

    const store = JSON.parse(raw) as Record<string, StoredMessage[]>;
    const insert = db.prepare(`
      INSERT INTO messages (session_id, role, content, mood, timestamp)
      VALUES (@sessionId, @role, @content, @mood, @timestamp)
    `);

    const migrate = db.transaction(() => {
      for (const [sessionId, messages] of Object.entries(store)) {
        for (const msg of messages) {
          insert.run({ sessionId, ...msg });
        }
      }
    });

    migrate();
    fs.renameSync(LEGACY_JSON, `${LEGACY_JSON}.bak`);
    console.log("Migrated conversations.json → SQLite");
  } catch (error) {
    console.warn("JSON migration skipped:", error);
  }
}

function initDb(): Database.Database {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const db = new Database(DB_FILE);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      mood TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_messages_session
      ON messages (session_id, id);
  `);

  migrateFromJson(db);
  return db;
}

function getDb(): Database.Database {
  if (!global.__siriDb) {
    global.__siriDb = initDb();
  }
  return global.__siriDb;
}

export async function getMessages(sessionId: string): Promise<StoredMessage[]> {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT role, content, mood, timestamp
       FROM messages
       WHERE session_id = ?
       ORDER BY id ASC`
    )
    .all(sessionId) as StoredMessage[];

  return rows;
}

export async function appendMessage(
  sessionId: string,
  message: StoredMessage
): Promise<void> {
  const db = getDb();
  db.prepare(
    `INSERT INTO messages (session_id, role, content, mood, timestamp)
     VALUES (?, ?, ?, ?, ?)`
  ).run(sessionId, message.role, message.content, message.mood, message.timestamp);
}

export async function appendMessages(
  sessionId: string,
  messages: StoredMessage[]
): Promise<void> {
  const db = getDb();
  const insert = db.prepare(
    `INSERT INTO messages (session_id, role, content, mood, timestamp)
     VALUES (?, ?, ?, ?, ?)`
  );

  const insertMany = db.transaction((items: StoredMessage[]) => {
    for (const msg of items) {
      insert.run(sessionId, msg.role, msg.content, msg.mood, msg.timestamp);
    }
  });

  insertMany(messages);
}
