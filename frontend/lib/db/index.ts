import { drizzle, BetterSQLite3Database as Database } from "drizzle-orm/better-sqlite3"
import Databasepkg from "better-sqlite3"
import * as schema from "./schema"

const sqlite = new Databasepkg("sqlite.db")

export type DbClient = Database

export const db = drizzle(sqlite, { schema })
export { schema }
