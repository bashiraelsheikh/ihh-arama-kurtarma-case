import { requireRole } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui";
import { ChangePasswordForm } from "@/components/dashboard/settings-form";

export default async function SettingsPage() {
  await requireRole("VOLUNTEER");
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Ayarlar</h1>
      <Card>
        <CardHeader>
          <CardTitle>Şifre Değiştir</CardTitle>
        </CardHeader>
        <CardBody>
          <ChangePasswordForm />
        </CardBody>
      </Card>
    </div>
  );
}
