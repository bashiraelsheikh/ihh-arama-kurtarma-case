import { requireRole } from "@/lib/auth";
import { getVolunteerDashboard } from "@/lib/services/volunteer";
import { Card, CardHeader, CardTitle, CardBody, ProgressBar } from "@/components/ui";

export default async function ProfilePage() {
  const session = await requireRole("VOLUNTEER");
  const d = await getVolunteerDashboard(session.profileId);

  const rows = [
    ["Ad Soyad", d.profile.name],
    ["Gönüllü Kodu", d.profile.volunteerCode],
    ["E-posta", d.profile.email],
    ["Telefon", d.profile.phone],
    ["İl", d.profile.city],
    ["Bölge", d.profile.region],
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Profil Bilgilerim</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Kişisel Bilgiler</CardTitle>
          </CardHeader>
          <CardBody>
            <dl className="divide-y divide-slate-100">
              {rows.map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-2.5">
                  <dt className="text-sm text-slate-500">{k}</dt>
                  <dd className="text-sm font-medium text-slate-800">{v}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Eğitim İlerlemesi</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            {d.groupProgress.map((g) => (
              <div key={g.group}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">{g.group}</span>
                  <span className="text-slate-400">
                    {g.completed}/{g.total}
                  </span>
                </div>
                <ProgressBar value={g.percentage} />
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
