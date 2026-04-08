# Safe D1 Migration Workflow

Create and test a new D1 migration safely. Follow every step in order.

## Steps

1. **Read latest migration**: List files in `worker/migrations/` and identify the highest-numbered migration file. The new migration number is that number + 1, zero-padded to 4 digits (e.g. if latest is `0005_xxx.sql`, the new one is `0006`).

2. **Verify additive only**: Before writing the migration, confirm the proposed changes are additive:
   - NO `DROP TABLE`, `DROP COLUMN`, `DROP INDEX`
   - NO destructive `ALTER TABLE` (removing columns, changing column types that lose data)
   - Adding new tables, columns, and indexes is allowed

3. **Check D1 types**: Verify no prohibited types are used:
   - No `ENUM` → use `TEXT` with `CHECK` constraint
   - No `BOOLEAN` → use `INTEGER` (0 or 1)
   - No `UUID` → use `TEXT`
   - No `JSONB` → use `TEXT`

4. **Add indexes**: For any new table, ensure indexes exist for:
   - `user_id` (required for all user-scoped tables)
   - `created_at` or other timestamp columns used in queries

5. **Write the migration file**: Create `worker/migrations/NNNN_description.sql` with the SQL.

6. **Test locally**: Run `npx wrangler d1 migrations apply quidsafe-staging --local --config wrangler.worker.toml` to verify the migration applies without errors.

7. **Report**: Summarise what changed — tables added/modified, columns added, indexes created. Include the full migration SQL in the output.

## Important

- Never modify an existing migration file — always create a new one
- Migration descriptions should be lowercase with underscores (e.g. `0006_add_invoice_payments.sql`)
- Always include `IF NOT EXISTS` for `CREATE TABLE` and `CREATE INDEX` where possible
