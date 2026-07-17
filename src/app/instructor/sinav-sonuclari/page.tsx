import { requireRole } from "@/lib/auth";
import { getInstructorExamsWithCandidates } from "@/lib/services/instructor";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui";
import { ExamResultsManager } from "./exam-results-manager";

export default async function ExamResultsPage() {
  const session = await requireRole("INSTRUCTOR");
  const exams = await getInstructorExamsWithCandidates(session.profileId);
  const serializable = exams.map((e) => ({ ...e, examDate: e.examDate.toISOString() }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Sınav Sonuçları</h1>
        <p className="text-sm text-slate-500">Yalnızca size atanmış sınavların sonuçlarını girebilirsiniz.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sonuç Girişi</CardTitle>
        </CardHeader>
        <CardBody>
          <ExamResultsManager exams={serializable} />
        </CardBody>
      </Card>
    </div>
  );
}
