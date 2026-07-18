import { requireRole } from "@/lib/auth";
import { getInstructorTrainingsWithParticipants } from "@/lib/services/instructor";
import { Card, CardHeader, CardTitle, CardBody } from "@/components/ui";
import { AttendanceManager } from "./attendance-manager";

export default async function AttendancePage() {
  const session = await requireRole("INSTRUCTOR");
  const trainings = await getInstructorTrainingsWithParticipants(session.profileId);
  const serializable = trainings.map((t) => ({
    ...t,
    startAt: t.startAt.toISOString(),
    endAt: t.endAt.toISOString(),
    sessions: t.sessions.map((s) => ({ id: s.id, date: s.date.toISOString() })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Eğitim Yoklamaları</h1>
        <p className="text-sm text-slate-500">
          Sorumlu olduğunuz eğitimlerin oturum yoklamalarını girin veya CSV dosyası yükleyin.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Yoklama Girişi</CardTitle>
        </CardHeader>
        <CardBody>
          <AttendanceManager trainings={serializable} />
        </CardBody>
      </Card>
    </div>
  );
}
