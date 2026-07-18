import { requireRole } from "@/lib/auth";
import { getInstructorAnalysis } from "@/lib/services/coordinator";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui";
import { InstructorTable } from "./instructor-table";

export default async function InstructorsPage() {
  await requireRole("COORDINATOR");
  const instructors = await getInstructorAnalysis();
  const rows = instructors.map((i) => ({
    name: i.name,
    city: i.city,
    region: i.region,
    expertise: i.expertise.join(", ") || "-",
    trainingCount: i.trainingCount,
    participants: i.participants,
    avgScore: i.avgScore != null ? i.avgScore : "-",
    passRate: i.passRate != null ? `%${i.passRate}` : "-",
    cancelRate: `%${i.cancelRate}`,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Eğitmenler</h1>
      <Card>
        <CardHeader>
          <CardTitle>Eğitmen Performans Analizi</CardTitle>
        </CardHeader>
        <CardBody>
          <InstructorTable rows={rows} />
        </CardBody>
      </Card>
    </div>
  );
}
