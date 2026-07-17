import { requireRole } from "@/lib/auth";
import { getVolunteerDashboard } from "@/lib/services/volunteer";
import { Card, CardHeader, CardTitle, CardBody, Badge, EmptyState } from "@/components/ui";
import { formatDateTime } from "@/lib/datetime";
import { trainingStatusLabel, completionStatusLabel } from "@/lib/labels";

export default async function MyTrainingsPage() {
  const session = await requireRole("VOLUNTEER");
  const d = await getVolunteerDashboard(session.profileId);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Eğitimlerim</h1>
      <Card>
        <CardHeader>
          <CardTitle>Kayıtlı ve Tamamlanan Eğitimler</CardTitle>
        </CardHeader>
        <CardBody>
          {d.enrollments.length === 0 ? (
            <EmptyState title="Henüz bir eğitime kayıtlı değilsiniz" description="Duyurular sayfasından eğitimlere kaydolabilirsiniz." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th className="pb-2 pr-3">Eğitim</th>
                    <th className="pb-2 pr-3">İl</th>
                    <th className="pb-2 pr-3">Tarih</th>
                    <th className="pb-2 pr-3">Katılım %</th>
                    <th className="pb-2 pr-3">Eğitim Durumu</th>
                    <th className="pb-2">Tamamlama</th>
                  </tr>
                </thead>
                <tbody>
                  {d.enrollments.map((e) => {
                    const ts = trainingStatusLabel[e.status];
                    const cs = completionStatusLabel[e.completionStatus];
                    return (
                      <tr key={e.id} className="border-b border-slate-100">
                        <td className="py-2.5 pr-3 font-medium text-slate-700">{e.training}</td>
                        <td className="py-2.5 pr-3 text-slate-500">{e.city}</td>
                        <td className="py-2.5 pr-3 text-slate-500">{formatDateTime(e.startAt)}</td>
                        <td className="py-2.5 pr-3 text-slate-500">{e.attendancePercentage ?? "-"}</td>
                        <td className="py-2.5 pr-3">
                          <Badge tone={ts.tone}>{ts.label}</Badge>
                        </td>
                        <td className="py-2.5">
                          <Badge tone={cs.tone}>{cs.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
