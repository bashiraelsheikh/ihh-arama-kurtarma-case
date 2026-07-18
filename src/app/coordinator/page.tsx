import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getCoordinatorContext, getExamCreationTrainings } from "@/lib/services/coordinator";
import { getRegions, getCities, getCategories } from "@/lib/reference";
import { Card, CardHeader, CardTitle, CardBody, Button, EmptyState } from "@/components/ui";
import { DashboardOverview } from "./_components/dashboard-overview";

export default async function CoordinatorDashboard() {
  const session = await requireRole("COORDINATOR");
  const ctx = await getCoordinatorContext(session.profileId);
  const [examTrainings, regions, cities, categories] = await Promise.all([
    getExamCreationTrainings(ctx.responsibleRegionId),
    getRegions(),
    getCities(),
    getCategories(),
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

      {/* Rapor/analiz filtresi + temel göstergeler */}
      <DashboardOverview
        regions={regions}
        cities={cities.map((c) => ({ id: c.id, name: c.name, regionId: c.regionId }))}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />

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
