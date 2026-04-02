import { drizzle, BetterSQLite3Database as Database } from "drizzle-orm/better-sqlite3"
import Databasepkg from "better-sqlite3"
import * as schema from "./schema"

const sqlite = new Databasepkg("sqlite.db")

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS "repository_analysis" (
    "id" TEXT PRIMARY KEY,
    "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "repo_full_name" TEXT NOT NULL,
    "repo_name" TEXT NOT NULL,
    "owner_login" TEXT NOT NULL,
    "html_url" TEXT,
    "description" TEXT,
    "default_branch" TEXT,
    "is_private" INTEGER NOT NULL DEFAULT 0,
    "primary_language" TEXT,
    "languages_json" TEXT,
    "dependencies_json" TEXT,
    "workflows_json" TEXT,
    "issues_json" TEXT,
    "ci_issues_json" TEXT,
    "suggestions_json" TEXT,
    "analysis_markdown" TEXT,
    "summary" TEXT,
    "history_json" TEXT,
    "raw_json" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "last_error" TEXT,
    "analyzed_at" INTEGER,
    "created_at" INTEGER NOT NULL,
    "updated_at" INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "knowledge_graph_node" (
    "id" TEXT PRIMARY KEY,
    "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "repo_full_name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "node_type" TEXT NOT NULL,
    "properties_json" TEXT,
    "created_at" INTEGER NOT NULL,
    "updated_at" INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "knowledge_graph_edge" (
    "id" TEXT PRIMARY KEY,
    "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "repo_full_name" TEXT NOT NULL,
    "source_node_id" TEXT NOT NULL,
    "target_node_id" TEXT NOT NULL,
    "edge_type" TEXT NOT NULL,
    "label" TEXT,
    "properties_json" TEXT,
    "created_at" INTEGER NOT NULL,
    "updated_at" INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS "repository_analysis_user_id_idx" ON "repository_analysis"("user_id");
  CREATE INDEX IF NOT EXISTS "repository_analysis_repo_full_name_idx" ON "repository_analysis"("repo_full_name");
  CREATE INDEX IF NOT EXISTS "knowledge_graph_node_user_id_idx" ON "knowledge_graph_node"("user_id");
  CREATE INDEX IF NOT EXISTS "knowledge_graph_node_repo_full_name_idx" ON "knowledge_graph_node"("repo_full_name");
  CREATE INDEX IF NOT EXISTS "knowledge_graph_edge_user_id_idx" ON "knowledge_graph_edge"("user_id");
  CREATE INDEX IF NOT EXISTS "knowledge_graph_edge_repo_full_name_idx" ON "knowledge_graph_edge"("repo_full_name");
`)

// Migration: Add dependencies_json column if it doesn't exist
try {
  sqlite.exec(`ALTER TABLE "repository_analysis" ADD COLUMN "dependencies_json" TEXT`)
} catch {
  // Column already exists, ignore
}

export type DbClient = Database

export const db = drizzle(sqlite, { schema })
export { schema }
