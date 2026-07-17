import { requireRole } from "@/lib/auth";
import { getInstructorDashboard } from "@/lib/services/instructor";
import { Card, CardHeader, CardTitle, CardBody, Badge } from "@/components/ui";
import { formatDate } from "@/lib/datetime";
import { certStatusLabel } from "@/lib/labels";

export default async function InstructorProfilePage() {
  const session = await requireRole("INSTRUCTOR");
  const d = await getInstructorDashboard(session.profileId);
  const rows = [
    ["Ad Soyad", d.profile.name],
    ["Eğitmen Kodu", d.profile.code],
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
            <CardTitle>Uzmanlık ve Belgeler</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Uzmanlık Alanları</p>
              <div className="flex flex-wrap gap-2">
                {d.expertise.map((e) => (
                  <Badge key={e.id} tone="blue">
                    {e.name}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Belgeler</p>
              <ul className="divide-y divide-slate-100">
                {d.certificates.map((c) => {
                  const s = certStatusLabel[c.status];
                  return (
                    <li key={c.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm text-slate-700">{c.name}</p>
                        <p className="text-xs text-slate-400">Geçerlilik: {formatDate(c.expiryDate)}</p>
                      </div>
                      <Badge tone={s.tone}>{s.label}</Badge>
                    </li>
                  );
                })}
              </ul>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
