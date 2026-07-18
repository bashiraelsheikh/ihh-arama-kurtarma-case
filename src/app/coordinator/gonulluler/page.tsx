import { requireRole } from "@/lib/auth";
import { getCoordinatorContext, getRegionVolunteers } from "@/lib/services/coordinator";
import { Card, CardHeader, CardTitle, CardBody, EmptyState } from "@/components/ui";
import { phoneStatusLabel } from "@/lib/labels";
import { VolunteerTable } from "./volunteer-table";

export default async function VolunteersPage() {
  const session = await requireRole("COORDINATOR");
  const ctx = await getCoordinatorContext(session.profileId);
  const volunteers = await getRegionVolunteers(ctx.responsibleRegionId);
  const rows = volunteers.map((v) => ({
    code: v.code,
    name: v.name,
    city: v.city,
    phone: v.phone,
    phoneStatus: phoneStatusLabel[v.phoneStatus],
    enrollments: v.enrollments,
    certificates: v.certificates,
    status: v.status === "ACTIVE" ? { label: "Aktif", tone: "green" as const } : { label: "Pasif", tone: "gray" as const },
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Gönüllüler ({ctx.responsibleRegion.name})</h1>
      <Card>
        <CardHeader>
          <CardTitle>Bölgenizdeki Gönüllüler</CardTitle>
        </CardHeader>
        <CardBody>
          {rows.length === 0 ? <EmptyState title="Gönüllü bulunmuyor" /> : <VolunteerTable rows={rows} />}
        </CardBody>
      </Card>
    </div>
  );
}
