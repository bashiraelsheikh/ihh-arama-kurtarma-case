import { requireRole } from "@/lib/auth";
import { getVolunteerDashboard } from "@/lib/services/volunteer";
import { Card, CardHeader, CardTitle, CardBody, Badge } from "@/components/ui";
import { formatDate } from "@/lib/datetime";
import { phoneStatusLabel } from "@/lib/labels";
import { PhoneUpdateButton } from "../_components/phone-update";

export default async function ContactPage() {
  const session = await requireRole("VOLUNTEER");
  const d = await getVolunteerDashboard(session.profileId);
  const phone = phoneStatusLabel[d.stats.phoneStatus];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">İletişim Bilgilerim</h1>
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Telefon Bilgisi</CardTitle>
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
          <div className="border-t border-slate-100 pt-3 text-xs text-slate-400">
            Kural: 0–180 gün Güncel · 181–365 gün Kontrol edilmeli · 365+ gün Güncellenmesi gerekiyor
          </div>
          <div className="pt-1">
            <PhoneUpdateButton currentPhone={d.profile.phone} />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
