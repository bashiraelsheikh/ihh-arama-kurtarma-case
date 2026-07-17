import { requireRole } from "@/lib/auth";
import { getInstructorDashboard } from "@/lib/services/instructor";
import { Card, CardHeader, CardTitle, CardBody, Badge, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/datetime";
import { trainingStatusLabel } from "@/lib/labels";

export default async function InstructorTrainingsPage() {
  const session = await requireRole("INSTRUCTOR");
  const d = await getInstructorDashboard(session.profileId);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Eğitimlerim</h1>
      <Card>
        <CardHeader>
          <CardTitle>Görevli Olduğum Eğitimler</CardTitle>
        </CardHeader>
        <CardBody>
          {d.trainings.length === 0 ? (
            <EmptyState title="Atanmış eğitim bulunmuyor" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th className="pb-2 pr-3">Eğitim</th>
                    <th className="pb-2 pr-3">Kategori</th>
                    <th className="pb-2 pr-3">İl / Konum</th>
                    <th className="pb-2 pr-3">Tarih</th>
                    <th className="pb-2 pr-3">Katılımcı</th>
                    <th className="pb-2">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {d.trainings.map((t) => {
                    const ts = trainingStatusLabel[t.status];
                    return (
                      <tr key={t.id} className="border-b border-slate-100">
                        <td className="py-2.5 pr-3 font-medium text-slate-700">{t.name}</td>
                        <td className="py-2.5 pr-3 text-slate-500">{t.category}</td>
                        <td className="py-2.5 pr-3 text-slate-500">
                          {t.city} · {t.location}
                        </td>
                        <td className="py-2.5 pr-3 text-slate-500">
                          {formatDate(t.startAt)} - {formatDate(t.endAt)}
                        </td>
                        <td className="py-2.5 pr-3 text-slate-500">{t.participants}</td>
                        <td className="py-2.5">
                          <Badge tone={ts.tone}>{ts.label}</Badge>
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
