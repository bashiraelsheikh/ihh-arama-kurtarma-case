import { requireRole } from "@/lib/auth";
import { getCoordinatorExams } from "@/lib/services/coordinator";
import { Card, CardHeader, CardTitle, CardBody, EmptyState } from "@/components/ui";
import { formatDateTime } from "@/lib/datetime";
import { ExamTable } from "./exam-table";

export default async function MyExamsPage() {
  const session = await requireRole("COORDINATOR");
  const exams = await getCoordinatorExams(session.profileId);
  const rows = exams.map((e) => ({
    name: e.name,
    training: e.training,
    examType: e.examType,
    examDateStr: formatDateTime(e.examDate),
    location: e.location,
    puan: `${e.passingScore}/${e.maxScore}`,
    instructor: e.instructor,
    candidates: e.candidates,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Sınavlarım</h1>
      <Card>
        <CardHeader>
          <CardTitle>Oluşturduğunuz Sınavlar</CardTitle>
        </CardHeader>
        <CardBody>
          {rows.length === 0 ? (
            <EmptyState title="Henüz sınav oluşturmadınız" description="Sınav Oluştur sekmesinden yeni sınav ekleyin." />
          ) : (
            <ExamTable rows={rows} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
