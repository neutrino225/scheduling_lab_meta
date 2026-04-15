import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

const dbPath = path.join(process.cwd(), "db.sqlite");
const sqlite = new Database(dbPath);
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite);
