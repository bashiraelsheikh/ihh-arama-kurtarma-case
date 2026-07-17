import { prisma } from "./prisma";
import type { Prisma } from "@prisma/client";

interface AuditInput {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldData?: unknown;
  newData?: unknown;
}

/** Audit log kaydı oluşturur. Transaction client verilirse onu kullanır. */
export async function writeAudit(
  input: AuditInput,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client = tx ?? prisma;
  await client.auditLog.create({
    data: {
      userId: input.userId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      oldData: input.oldData === undefined ? undefined : (input.oldData as Prisma.InputJsonValue),
      newData: input.newData === undefined ? undefined : (input.newData as Prisma.InputJsonValue),
    },
  });
}
