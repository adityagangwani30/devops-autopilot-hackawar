import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import { sql } from "drizzle-orm"
import * as schema from "../lib/db/schema"

const sqlite = new Database("sqlite.db")
const db = drizzle(sqlite, { schema })

console.log("Creating database tables...")

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS "user" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL UNIQUE,
    "email_verified" INTEGER DEFAULT 0,
    "image" TEXT,
    "role" TEXT DEFAULT 'user',
    "created_at" INTEGER NOT NULL,
    "updated_at" INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "session" (
    "id" TEXT PRIMARY KEY,
    "expires_at" INTEGER NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "created_at" INTEGER NOT NULL,
    "updated_at" INTEGER NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS "account" (
    "id" TEXT PRIMARY KEY,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" INTEGER,
    "refresh_token_expires_at" INTEGER,
    "scope" TEXT,
    "password" TEXT,
    "created_at" INTEGER NOT NULL,
    "updated_at" INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "verification" (
    "id" TEXT PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" INTEGER NOT NULL,
    "created_at" INTEGER,
    "updated_at" INTEGER
  );

  CREATE TABLE IF NOT EXISTS "organization" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "github_org_id" TEXT UNIQUE,
    "github_org_name" TEXT,
    "github_org_avatar" TEXT,
    "github_access_token" TEXT,
    "connected_at" INTEGER,
    "created_at" INTEGER NOT NULL,
    "updated_at" INTEGER NOT NULL,
    "owner_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS "member" (
    "id" TEXT PRIMARY KEY,
    "organization_id" TEXT NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
    "user_id" TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "role" TEXT NOT NULL DEFAULT 'member',
    "created_at" INTEGER NOT NULL
  );

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

  CREATE INDEX IF NOT EXISTS "session_user_id_idx" ON "session"("user_id");
  CREATE INDEX IF NOT EXISTS "account_user_id_idx" ON "account"("user_id");
  CREATE INDEX IF NOT EXISTS "member_organization_id_idx" ON "member"("organization_id");
  CREATE INDEX IF NOT EXISTS "member_user_id_idx" ON "member"("user_id");
  CREATE INDEX IF NOT EXISTS "repository_analysis_user_id_idx" ON "repository_analysis"("user_id");
  CREATE INDEX IF NOT EXISTS "repository_analysis_repo_full_name_idx" ON "repository_analysis"("repo_full_name");
  CREATE INDEX IF NOT EXISTS "knowledge_graph_node_user_id_idx" ON "knowledge_graph_node"("user_id");
  CREATE INDEX IF NOT EXISTS "knowledge_graph_node_repo_full_name_idx" ON "knowledge_graph_node"("repo_full_name");
  CREATE INDEX IF NOT EXISTS "knowledge_graph_edge_user_id_idx" ON "knowledge_graph_edge"("user_id");
  CREATE INDEX IF NOT EXISTS "knowledge_graph_edge_repo_full_name_idx" ON "knowledge_graph_edge"("repo_full_name");
`)

console.log("Database tables created successfully!")
