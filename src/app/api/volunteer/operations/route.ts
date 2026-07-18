import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/auth";
import { ok, mapError, BusinessRuleError } from "@/lib/api";
import { operationResponseSchema } from "@/lib/validation";
import { writeAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const session = await requireApiRole("VOLUNTEER");
    const body = await req.json();
    const { assignmentId, response } = operationResponseSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      const assignment = await tx.operationAssignment.findUnique({
        where: { id: assignmentId },
        include: { operation: true },
      });
      if (!assignment) throw new BusinessRuleError("Operasyon daveti bulunamadı.");
      if (assignment.volunteerId !== session.profileId) {
        throw new BusinessRuleError("Bu davete yanıt verme yetkiniz yok.");
      }
      if (assignment.operation.status !== "ACTIVE") {
        throw new BusinessRuleError("Bu operasyon artık aktif değil.");
      }
      const updated = await tx.operationAssignment.update({
        where: { id: assignmentId },
        data: { invitationStatus: response, respondedAt: new Date() },
      });
      await writeAudit(
        {
          userId: session.userId,
          action: "RESPOND_OPERATION",
          entityType: "OperationAssignment",
          entityId: assignmentId,
          oldData: { invitationStatus: assignment.invitationStatus },
          newData: { invitationStatus: response },
        },
        tx,
      );
      return updated;
    });

    return ok({ invitationStatus: result.invitationStatus });
  } catch (e) {
    return mapError(e);
  }
}
