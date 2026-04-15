// Audit logging for financial mutations.
// Required for MTD digital record-keeping + dispute/fraud evidence.

export type AuditAction =
  | 'invoice.create'
  | 'invoice.update'
  | 'invoice.delete'
  | 'invoice.send'
  | 'expense.create'
  | 'expense.update'
  | 'expense.delete'
  | 'mtd.submit'
  | 'bank.connect'
  | 'bank.disconnect'
  | 'bank.sync'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.cancelled'
  | 'account.delete';

export interface AuditEntry {
  userId: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Write an audit log entry. Fire-and-forget - errors are logged but never
 * break the calling request (audit failure must not block business logic).
 */
export async function audit(db: D1Database, entry: AuditEntry): Promise<void> {
  try {
    await db
      .prepare(
        `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id, metadata, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        entry.userId,
        entry.action,
        entry.entityType ?? null,
        entry.entityId ?? null,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
        entry.ipAddress ?? null,
        entry.userAgent ? entry.userAgent.slice(0, 256) : null,
      )
      .run();
  } catch (err) {
    console.error('[audit] write failed', { action: entry.action, error: err instanceof Error ? err.message : String(err) });
  }
}

/**
 * Extract IP + user agent from a Hono context for audit logging.
 */
export function auditContext(headers: Headers): { ipAddress?: string; userAgent?: string } {
  return {
    ipAddress: headers.get('cf-connecting-ip') ?? headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? undefined,
    userAgent: headers.get('user-agent') ?? undefined,
  };
}
