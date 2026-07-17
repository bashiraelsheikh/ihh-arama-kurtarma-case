import { requireRole } from "@/lib/auth";
import { getVolunteerDashboard } from "@/lib/services/volunteer";
import { Card, CardHeader, CardTitle, CardBody, Badge, EmptyState } from "@/components/ui";
import { formatDateTime } from "@/lib/datetime";
import { EnrollButton } from "../_components/enroll-button";

export default async function AnnouncementsPage() {
  const session = await requireRole("VOLUNTEER");
  const d = await getVolunteerDashboard(session.profileId);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Duyurular ve Yaklaşan Eğitimler</h1>
      <p className="text-sm text-slate-500">
        Yalnızca tamamlamadığınız, kayıt dönemi açık ve kontenjanı dolmamış eğitimler listelenir.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Kaydolabileceğiniz Eğitimler</CardTitle>
        </CardHeader>
        <CardBody>
          {d.upcoming.length === 0 ? (
            <EmptyState title="Uygun eğitim bulunmuyor" />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {d.upcoming.map((t) => (
                <div key={t.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-800">{t.name}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {t.city} · {t.location}
                      </p>
                      <p className="text-xs text-slate-400">{formatDateTime(t.startAt)}</p>
                    </div>
                    <Badge tone={t.remaining > 0 ? "green" : "red"}>{t.remaining} boş</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Kontenjan: {t.enrolled}/{t.capacity}
                    </span>
                    <EnrollButton trainingId={t.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
