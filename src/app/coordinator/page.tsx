import Link from "next/link";
import { requireRole } from "@/lib/auth";
import {
  getKpis,
  getMonthlyTrainingSeries,
  getCoordinatorContext,
  getExamCreationTrainings,
} from "@/lib/services/coordinator";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardHeader, CardTitle, CardBody, Button, EmptyState } from "@/components/ui";
import { LineChartView } from "@/components/charts";

export default async function CoordinatorDashboard() {
  const session = await requireRole("COORDINATOR");
  const ctx = await getCoordinatorContext(session.profileId);
  const [kpis, monthly, examTrainings] = await Promise.all([
    getKpis(),
    getMonthlyTrainingSeries(),
    getExamCreationTrainings(ctx.responsibleRegionId),
  ]);
  const needsExam = examTrainings.filter((t) => t.needsExam);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Merkez Eğitim Sorumlusu Dashboard</h1>
        <p className="text-sm text-slate-500">
          Hoş geldiniz, {session.name} · Sorumlu Bölge: {ctx.responsibleRegion.name}
        </p>
      </div>

      {/* Genel durumu değerlendirmek için temel göstergeler */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Toplam Gönüllü" value={kpis.totalVolunteers} tone="blue" />
        <StatCard label="Aktif Gönüllü" value={kpis.activeVolunteers} tone="green" />
        <StatCard label="Toplam Eğitim" value={kpis.totalTrainings} />
        <StatCard label="Sınav Başarı" value={`%${kpis.passRate}`} tone="green" />
        <StatCard label="Aktif Operasyon" value={kpis.activeOperations} tone="red" />
        <StatCard label="Ort. Yoklama" value={`%${kpis.avgAttendance}`} tone="yellow" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Aylara Göre Eğitim Sayısı</CardTitle>
        </CardHeader>
        <CardBody>
          <LineChartView data={monthly} xKey="month" lineKey="count" label="Eğitim" height={400} />
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sınav Bekleyen Tamamlanmış Eğitimler</CardTitle>
          </CardHeader>
          <CardBody>
            {needsExam.length === 0 ? (
              <EmptyState title="Sınav bekleyen eğitim yok" description="Tamamlanan tüm eğitimler için sınav oluşturulmuş." />
            ) : (
              <ul className="space-y-2">
                {needsExam.slice(0, 6).map((t) => (
                  <li key={t.id} className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 ring-1 ring-amber-100">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{t.name}</p>
                      <p className="text-xs text-amber-700">Bu eğitim için sınav oluşturulmadı</p>
                    </div>
                    <Link href={`/coordinator/sinav-olustur?trainingId=${t.id}`}>
                      <Button size="sm">Sınav Oluştur</Button>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Hızlı İşlemler</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2">
            <Link href="/coordinator/egitimler" className="block">
              <Button className="w-full" variant="outline">Eğitim Oluştur</Button>
            </Link>
            <Link href="/coordinator/sinav-olustur" className="block">
              <Button className="w-full" variant="outline">Sınav Oluştur</Button>
            </Link>
            <Link href="/coordinator/harita" className="block">
              <Button className="w-full" variant="outline">Harita ve Dağılım</Button>
            </Link>
            <Link href="/coordinator/analiz" className="block">
              <Button className="w-full" variant="outline">Analiz ve Raporlar</Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
