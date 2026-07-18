import { requireRole } from "@/lib/auth";
import { getVolunteerDashboard } from "@/lib/services/volunteer";
import { Card, CardHeader, CardTitle, CardBody, Badge, EmptyState } from "@/components/ui";
import { formatDateTime } from "@/lib/datetime";
import { operationStatusLabel } from "@/lib/labels";
import { OperationResponse } from "../_components/operation-response";

export default async function OperationsPage() {
  const session = await requireRole("VOLUNTEER");
  const d = await getVolunteerDashboard(session.profileId);

  const active = d.operations.filter((o) => o.status === "ACTIVE");
  const past = d.operations.filter((o) => o.status !== "ACTIVE");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Operasyonlarım</h1>

      <Card>
        <CardHeader>
          <CardTitle>Aktif Çağrılar</CardTitle>
        </CardHeader>
        <CardBody>
          {active.length === 0 ? (
            <EmptyState title="Aktif operasyon çağrısı bulunmuyor" />
          ) : (
            <ul className="space-y-3">
              {active.map((op) => (
                <li key={op.assignmentId} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-800">{op.operationName}</p>
                      <p className="text-xs text-slate-400">
                        {op.city} · {op.region} · {formatDateTime(op.startAt)}
                      </p>
                      {op.requiredCategory && (
                        <p className="mt-1 text-xs text-slate-400">Gerekli eğitim: {op.requiredCategory}</p>
                      )}
                    </div>
                    <OperationResponse
                      assignmentId={op.assignmentId}
                      invitationStatus={op.invitationStatus}
                      operationActive={true}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Geçmiş Operasyonlar</CardTitle>
        </CardHeader>
        <CardBody>
          {past.length === 0 ? (
            <EmptyState title="Geçmiş operasyon bulunmuyor" />
          ) : (
            <ul className="space-y-2">
              {past.map((op) => (
                <li key={op.assignmentId} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <span className="text-sm text-slate-700">{op.operationName}</span>
                  <Badge tone={operationStatusLabel[op.status].tone}>{operationStatusLabel[op.status].label}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
