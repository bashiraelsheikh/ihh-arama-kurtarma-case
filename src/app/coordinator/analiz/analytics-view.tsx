"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardBody, Select, Label, Badge, EmptyState, Spinner } from "@/components/ui";
import { StatCard } from "@/components/dashboard/stat-card";
import { BarChartView, LineChartView } from "@/components/charts";
import { apiGet } from "@/lib/client-api";

interface Ref {
  id: string;
  name: string;
}
interface City extends Ref {
  regionId: string;
}

interface AnalyticsData {
  kpis: Record<string, number>;
  competency: {
    byGroup: { group: string; count: number }[];
    topAreas: { area: string; count: number }[];
    weakAreas: { area: string; count: number }[];
    expiringSoon: number;
    outdatedPhones: number;
  };
  monthly: { month: string; count: number }[];
  predictions: { title: string; detail: string; level: "info" | "warning" | "danger" }[];
}

export function AnalyticsView({ regions, cities, categories }: { regions: Ref[]; cities: City[]; categories: Ref[] }) {
  const [regionId, setRegionId] = useState("");
  const [cityId, setCityId] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const filteredCities = regionId ? cities.filter((c) => c.regionId === regionId) : cities;

  const params = new URLSearchParams();
  if (regionId) params.set("regionId", regionId);
  if (cityId) params.set("cityId", cityId);
  if (categoryId) params.set("categoryId", categoryId);

  const { data, isFetching } = useQuery({
    queryKey: ["analytics", regionId, cityId, categoryId],
    queryFn: async () => {
      const res = await apiGet<AnalyticsData>(`/api/coordinator/analytics?${params.toString()}`);
      if (!res.ok) throw new Error(res.error);
      return res.data!;
    },
  });

  const k = data?.kpis;

  return (
    <div className="space-y-6">
      {/* Filtreler */}
      <Card>
        <CardHeader>
          <CardTitle>Filtreler</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label>Bölge</Label>
              <Select
                value={regionId}
                onChange={(e) => {
                  setRegionId(e.target.value);
                  setCityId("");
                }}
              >
                <option value="">Tümü</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>İl</Label>
              <Select value={cityId} onChange={(e) => setCityId(e.target.value)}>
                <option value="">Tümü</option>
                {filteredCities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Eğitim Alanı</Label>
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Tümü</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          {isFetching && (
            <p className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              <Spinner className="h-3 w-3" /> Güncelleniyor...
            </p>
          )}
        </CardBody>
      </Card>

      {/* KPI kartları */}
      {k && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          <StatCard label="Toplam Gönüllü" value={k.totalVolunteers} tone="blue" />
          <StatCard label="Aktif Gönüllü" value={k.activeVolunteers} tone="green" />
          <StatCard label="Yeni Kayıt" value={k.newVolunteers} />
          <StatCard label="Toplam Eğitmen" value={k.totalInstructors} />
          <StatCard label="Toplam Eğitim" value={k.totalTrainings} />
          <StatCard label="Tamamlanan" value={k.completedTrainings} tone="green" />
          <StatCard label="Yaklaşan Eğitim" value={k.upcomingTrainings} tone="yellow" />
          <StatCard label="Oluşturulan Sınav" value={k.totalExams} />
          <StatCard label="Sınava Giren" value={k.examAttendees} />
          <StatCard label="Sınav Başarı" value={`%${k.passRate}`} tone="green" />
          <StatCard label="Aktif Operasyon" value={k.activeOperations} tone="red" />
          <StatCard label="Ort. Yoklama" value={`%${k.avgAttendance}`} tone="blue" />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Aylara Göre Eğitim Sayısı</CardTitle>
          </CardHeader>
          <CardBody>{data && <LineChartView data={data.monthly} xKey="month" lineKey="count" label="Eğitim" />}</CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>En Çok Eğitim Alınan İlk 5 Alan</CardTitle>
          </CardHeader>
          <CardBody>
            {data && data.competency.topAreas.length > 0 ? (
              <BarChartView data={data.competency.topAreas} xKey="area" barKey="count" label="Gönüllü" horizontal />
            ) : (
              <EmptyState title="Yeterli veri yok" />
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>En Güçlü Alanlar</CardTitle>
          </CardHeader>
          <CardBody>
            <ul className="space-y-2">
              {data?.competency.topAreas.map((a) => (
                <li key={a.area} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{a.area}</span>
                  <Badge tone="green">{a.count}</Badge>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>En Zayıf Alanlar</CardTitle>
          </CardHeader>
          <CardBody>
            <ul className="space-y-2">
              {data?.competency.weakAreas.map((a) => (
                <li key={a.area} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{a.area}</span>
                  <Badge tone="red">{a.count}</Badge>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Risk Göstergeleri</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Sertifikası yakında dolacak</span>
              <Badge tone="yellow">{data?.competency.expiringSoon ?? 0}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Telefonu güncel olmayan</span>
              <Badge tone="red">{data?.competency.outdatedPhones ?? 0}</Badge>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Öngörüler */}
      <Card>
        <CardHeader>
          <CardTitle>İleriye Dönük Analiz ve Öngörüler</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {data?.predictions.map((p) => (
              <div
                key={p.title}
                className={`rounded-lg border p-3 ${
                  p.level === "danger"
                    ? "border-red-200 bg-red-50"
                    : p.level === "warning"
                      ? "border-amber-200 bg-amber-50"
                      : "border-slate-200 bg-slate-50"
                }`}
              >
                <p className="text-sm font-medium text-slate-800">{p.title}</p>
                <p className="mt-1 text-xs text-slate-600">{p.detail}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
