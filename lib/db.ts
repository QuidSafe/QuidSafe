// D1 database helper for Cloudflare Workers
// Used inside Worker route handlers via c.env.DB

import type { Env } from '../worker/index';

/** Typed helper to get the D1 database binding from Worker context */
export function getDB(env: Env): D1Database {
  return env.DB;
}

/** Run a single query and return all rows */
export async function query<T = Record<string, unknown>>(
  db: D1Database,
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await db.prepare(sql).bind(...params).all<T>();
  return result.results;
}

/** Run a single query and return the first row (or null) */
export async function queryOne<T = Record<string, unknown>>(
  db: D1Database,
  sql: string,
  params: unknown[] = [],
): Promise<T | null> {
  const result = await db.prepare(sql).bind(...params).first<T>();
  return result ?? null;
}

/** Run an INSERT/UPDATE/DELETE and return metadata */
export async function execute(
  db: D1Database,
  sql: string,
  params: unknown[] = [],
): Promise<D1Result> {
  return db.prepare(sql).bind(...params).run();
}

/** Run multiple statements in a batch (D1 batch API) */
export async function batch(
  db: D1Database,
  statements: { sql: string; params?: unknown[] }[],
): Promise<D1Result[]> {
  const prepared = statements.map((s) => db.prepare(s.sql).bind(...(s.params ?? [])));
  return db.batch(prepared);
}
