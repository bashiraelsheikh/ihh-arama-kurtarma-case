import { requireRole } from "@/lib/auth";
import {
  getCoordinatorContext,
  getExamCreationTrainings,
  getAllInstructorsWithExpertise,
} from "@/lib/services/coordinator";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui";
import { ExamWizard } from "./exam-wizard";

export default async function CreateExamPage({
  searchParams,
}: {
  searchParams: Promise<{ trainingId?: string }>;
}) {
  const session = await requireRole("COORDINATOR");
  const params = await searchParams;
  const ctx = await getCoordinatorContext(session.profileId);
  const [trainings, instructors] = await Promise.all([
    getExamCreationTrainings(ctx.responsibleRegionId),
    getAllInstructorsWithExpertise(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Sınav Oluştur</h1>
        <p className="text-sm text-slate-500">Üç adımlı sihirbaz ile eğitime bağlı sınav oluşturun.</p>
      </div>
      <Card>
        <CardBody>
          <ExamWizard trainings={trainings} instructors={instructors} preselectedTrainingId={params.trainingId} />
        </CardBody>
      </Card>
    </div>
  );
}
