import { requireRole } from "@/lib/auth";
import { getVolunteerDashboard } from "@/lib/services/volunteer";
import { StatCard, SectionTitle } from "@/components/dashboard/stat-card";
import { Card, CardHeader, CardTitle, CardBody, Badge, ProgressBar, EmptyState } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/datetime";
import { certStatusLabel, phoneStatusLabel } from "@/lib/labels";
import { EnrollButton } from "./_components/enroll-button";
import { PhoneUpdateButton } from "./_components/phone-update";
import { OperationResponse } from "./_components/operation-response";

export default async function VolunteerDashboard() {
  const session = await requireRole("VOLUNTEER");
  const d = await getVolunteerDashboard(session.profileId);
  const phone = phoneStatusLabel[d.stats.phoneStatus];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Gönüllü Dashboard</h1>
        <p className="text-sm text-slate-500">Hoş geldiniz, {d.profile.name} ({d.profile.volunteerCode})</p>
      </div>

      {/* Kartlar */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Tamamladığı Eğitim" value={d.stats.completedCount} hint={`/ ${d.stats.totalCatalog}`} tone="green" />
        <StatCard label="Geçerli Sertifika" value={d.stats.validCertificates} tone="blue" />
        <StatCard label="Eksik Eğitim" value={d.stats.missingCount} tone="yellow" />
        <StatCard label="Aktif Operasyon" value={d.stats.activeOperations} tone="red" />
        <StatCard label="Sertifika Yenileme Riski" value={d.stats.expiringCertificates} hint="60 gün içinde" tone="yellow" />
        <StatCard label="Telefon Durumu" value={phone.label} tone={phone.tone === "green" ? "green" : phone.tone === "yellow" ? "yellow" : "red"} />
      </div>

      {/* Eğitim tamamlama oranı */}
      <Card>
        <CardHeader>
          <CardTitle>Eğitim Tamamlama Oranı</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">Genel İlerleme</span>
              <span className="text-slate-500">
                {d.stats.completedCount}/{d.stats.totalCatalog} (%{d.stats.completionPct})
              </span>
            </div>
            <ProgressBar value={d.stats.completionPct} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Eksik eğitimler */}
        <Card>
          <CardHeader>
            <CardTitle>Eksik Eğitimler</CardTitle>
          </CardHeader>
          <CardBody>
            {d.missing.length === 0 ? (
              <EmptyState title="Tebrikler!" description="Tüm katalog eğitimlerini tamamladınız." />
            ) : (
              <ul className="space-y-2">
                {d.missing.slice(0, 8).map((m) => (
                  <li key={m.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{m.name}</p>
                      <p className="text-xs text-slate-400">{m.group}</p>
                    </div>
                    {m.recommended && <Badge tone="blue">Önerilen</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Telefon güncelliği */}
        <Card>
          <CardHeader>
            <CardTitle>İletişim Bilgisi Durumu</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Telefon Numarası</span>
              <span className="text-sm font-medium text-slate-800">{d.profile.phone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Son Güncelleme</span>
              <span className="text-sm text-slate-800">{formatDate(d.profile.phoneUpdatedAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Güncellik Durumu</span>
              <Badge tone={phone.tone}>{phone.label}</Badge>
            </div>
            <div className="pt-2">
              <PhoneUpdateButton currentPhone={d.profile.phone} />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Duyurular / Yaklaşan eğitimler */}
      <Card>
        <CardHeader>
          <CardTitle>Duyurular ve Yaklaşan Eğitimler (Bulunduğunuz İl/Bölge)</CardTitle>
        </CardHeader>
        <CardBody>
          {d.upcoming.length === 0 ? (
            <EmptyState title="Uygun eğitim bulunmuyor" description="Bölgenizde kaydolabileceğiniz yeni eğitim yok." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th className="pb-2 pr-3">Eğitim Adı</th>
                    <th className="pb-2 pr-3">İl</th>
                    <th className="pb-2 pr-3">Konum</th>
                    <th className="pb-2 pr-3">Tarih</th>
                    <th className="pb-2 pr-3">Kontenjan</th>
                    <th className="pb-2 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {d.upcoming.map((t) => (
                    <tr key={t.id} className="border-b border-slate-100">
                      <td className="py-2.5 pr-3 font-medium text-slate-700">{t.name}</td>
                      <td className="py-2.5 pr-3 text-slate-500">{t.city}</td>
                      <td className="py-2.5 pr-3 text-slate-500">{t.location}</td>
                      <td className="py-2.5 pr-3 text-slate-500">{formatDateTime(t.startAt)}</td>
                      <td className="py-2.5 pr-3">
                        <Badge tone={t.remaining > 0 ? "green" : "red"}>
                          {t.enrolled}/{t.capacity} ({t.remaining} boş)
                        </Badge>
                      </td>
                      <td className="py-2.5 text-right">
                        <EnrollButton trainingId={t.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sertifikalar */}
        <Card>
          <CardHeader>
            <CardTitle>Sertifikalarım</CardTitle>
          </CardHeader>
          <CardBody>
            {d.certificates.length === 0 ? (
              <EmptyState title="Sertifika bulunmuyor" />
            ) : (
              <ul className="divide-y divide-slate-100">
                {d.certificates.map((c) => {
                  const s = certStatusLabel[c.status];
                  return (
                    <li key={c.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{c.name}</p>
                        <p className="text-xs text-slate-400">
                          {c.number} · Geçerlilik: {formatDate(c.expiryDate)}
                        </p>
                      </div>
                      <Badge tone={s.tone}>{s.label}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Operasyonlar */}
        <Card>
          <CardHeader>
            <CardTitle>Operasyon Çağrıları</CardTitle>
          </CardHeader>
          <CardBody>
            {d.operations.length === 0 ? (
              <EmptyState title="Operasyon daveti bulunmuyor" />
            ) : (
              <ul className="space-y-3">
                {d.operations.map((op) => (
                  <li key={op.assignmentId} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{op.operationName}</p>
                        <p className="text-xs text-slate-400">
                          {op.city} · {formatDateTime(op.startAt)}
                        </p>
                        {op.requiredCategory && (
                          <p className="mt-0.5 text-xs text-slate-400">Gerekli: {op.requiredCategory}</p>
                        )}
                      </div>
                      <OperationResponse
                        assignmentId={op.assignmentId}
                        invitationStatus={op.invitationStatus}
                        operationActive={op.status === "ACTIVE"}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
