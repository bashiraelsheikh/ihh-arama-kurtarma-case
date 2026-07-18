import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getInstructorDashboard } from "@/lib/services/instructor";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardHeader, CardTitle, CardBody, Badge, EmptyState, Button } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/datetime";
import { certStatusLabel, trainingStatusLabel } from "@/lib/labels";

export default async function InstructorDashboard() {
  const session = await requireRole("INSTRUCTOR");
  const d = await getInstructorDashboard(session.profileId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Eğitmen Dashboard</h1>
        <p className="text-sm text-slate-500">Hoş geldiniz, {d.profile.name} ({d.profile.code})</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Uzmanlık Alanı" value={d.stats.expertiseCount} tone="blue" />
        <StatCard label="Görevli Eğitim" value={d.stats.assignedTrainings} />
        <StatCard label="Toplam Katılımcı" value={d.stats.totalParticipants} tone="blue" />
        <StatCard label="Ort. Yoklama Oranı" value={d.stats.avgAttendance != null ? `%${d.stats.avgAttendance}` : "-"} tone="green" />
        <StatCard label="Tamamlanan Eğitim" value={d.stats.completedCount} tone="green" />
        <StatCard label="Planlanan Eğitim" value={d.stats.plannedCount} tone="yellow" />
      </div>

      {/* Hızlı işlemler */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <p className="text-sm font-semibold text-slate-800">Eğitim Yoklamalarını Gir</p>
          <p className="mt-1 text-xs text-slate-500">Sorumlu olduğunuz eğitimlerin oturum yoklamalarını girin.</p>
          <Link href="/instructor/yoklamalar" className="mt-3 inline-block">
            <Button size="sm">Yoklama Gir / Yükle</Button>
          </Link>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-semibold text-slate-800">Sınav Sonuçlarını Gir</p>
          <p className="mt-1 text-xs text-slate-500">Size atanmış sınavların sonuçlarını girin.</p>
          <Link href="/instructor/sinav-sonuclari" className="mt-3 inline-block">
            <Button size="sm" variant="secondary">Sınav Sonuçları</Button>
          </Link>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Uzmanlık Alanları</CardTitle>
          </CardHeader>
          <CardBody>
            {d.expertise.length === 0 ? (
              <EmptyState title="Uzmanlık alanı tanımlı değil" />
            ) : (
              <ul className="space-y-2">
                {d.expertise.map((e) => (
                  <li key={e.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-sm text-slate-700">{e.name}</span>
                    <Badge tone="blue">{e.level}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Eğitmen Belgelerim</CardTitle>
          </CardHeader>
          <CardBody>
            {d.certificates.length === 0 ? (
              <EmptyState title="Belge bulunmuyor" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {d.certificates.map((c) => {
                  const s = certStatusLabel[c.status];
                  return (
                    <li key={c.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{c.name}</p>
                        <p className="text-xs text-slate-400">Geçerlilik: {formatDate(c.expiryDate)}</p>
                      </div>
                      <Badge tone={s.tone}>{s.label}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Görevli Olduğu Eğitimler</CardTitle>
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
                    <th className="pb-2 pr-3">İl</th>
                    <th className="pb-2 pr-3">Tarih Aralığı</th>
                    <th className="pb-2 pr-3">Katılımcı</th>
                    <th className="pb-2 pr-3">Rol</th>
                    <th className="pb-2">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {d.trainings.map((t) => {
                    const ts = trainingStatusLabel[t.status];
                    return (
                      <tr key={t.id} className="border-b border-slate-100">
                        <td className="py-2.5 pr-3 font-medium text-slate-700">{t.name}</td>
                        <td className="py-2.5 pr-3 text-slate-500">{t.city}</td>
                        <td className="py-2.5 pr-3 text-slate-500">
                          {formatDate(t.startAt)} - {formatDate(t.endAt)}
                        </td>
                        <td className="py-2.5 pr-3 text-slate-500">{t.participants}</td>
                        <td className="py-2.5 pr-3 text-slate-500">{t.role}</td>
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
