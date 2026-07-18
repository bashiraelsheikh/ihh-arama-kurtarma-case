"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardBody, Badge, EmptyState } from "@/components/ui";
import { StatCard } from "@/components/dashboard/stat-card";
import { LineChartView, BarChartView } from "@/components/charts";
import { DataTable, type Row } from "@/components/ui/data-table";
import { apiGet } from "@/lib/client-api";
import { formatDateTime } from "@/lib/datetime";
import { trainingStatusLabel } from "@/lib/labels";
import { FilterBar, buildFilterQuery, EMPTY_FILTERS, type FilterState, type Ref, type CityRef } from "../_components/filter-bar";

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
  fieldAnalysis: { field: string; group: string; trainings: number; participants: number; completed: number; passRate: number }[];
  cityAnalysis: { city: string; region: string; volunteers: number; activeVolunteers: number; instructors: number; trainings: number; passRate: number }[];
  instructorAnalysis: {
    id: string;
    name: string;
    city: string;
    region: string;
    expertise: string[];
    trainingCount: number;
    participants: number;
    avgScore: number | null;
    passRate: number | null;
    cancelRate: number;
  }[];
  allTrainings: {
    code: string;
    name: string;
    field: string;
    city: string;
    location: string;
    startAt: string;
    endAt: string;
    capacity: number;
    enrolled: number;
    exams: number;
    instructor: string;
    status: string;
  }[];
}

export function AnalyticsView({ regions, cities, categories }: { regions: Ref[]; cities: CityRef[]; categories: Ref[] }) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const query = buildFilterQuery(filters, { scope: "full" });

  const { data, isFetching } = useQuery({
    queryKey: ["analytics", query],
    queryFn: async () => {
      const res = await apiGet<AnalyticsData>(`/api/coordinator/analytics?${query}`);
      if (!res.ok) throw new Error(res.error);
      return res.data!;
    },
  });

  const k = data?.kpis;

  const fieldRows: Row[] = (data?.fieldAnalysis ?? []).map((f) => ({
    field: f.field,
    group: f.group,
    trainings: f.trainings,
    participants: f.participants,
    completed: f.completed,
    passRate: `%${f.passRate}`,
  }));
  const cityRows: Row[] = (data?.cityAnalysis ?? []).map((c) => ({
    city: c.city,
    region: c.region,
    volunteers: c.volunteers,
    activeVolunteers: c.activeVolunteers,
    instructors: c.instructors,
    trainings: c.trainings,
    passRate: `%${c.passRate}`,
  }));
  const instructorRows: Row[] = (data?.instructorAnalysis ?? []).map((i) => ({
    name: i.name,
    city: i.city,
    expertise: i.expertise.join(", ") || "-",
    trainingCount: i.trainingCount,
    participants: i.participants,
    avgScore: i.avgScore ?? "-",
    passRate: i.passRate != null ? `%${i.passRate}` : "-",
    cancelRate: `%${i.cancelRate}`,
  }));
  const trainingRows: Row[] = (data?.allTrainings ?? []).map((t) => ({
    name: t.name,
    field: t.field,
    city: t.city,
    location: t.location,
    startAt: formatDateTime(t.startAt),
    kontenjan: `${t.enrolled}/${t.capacity}`,
    exams: t.exams,
    instructor: t.instructor,
    status: trainingStatusLabel[t.status] ?? { label: t.status, tone: "gray" },
  }));

  return (
    <div className="space-y-6">
      <FilterBar
        regions={regions}
        cities={cities}
        categories={categories}
        state={filters}
        onChange={setFilters}
        fetching={isFetching}
      />

      {/* KPI kartları - tüm eğitim bilgisi */}
      {k && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          <StatCard label="Toplam Gönüllü" value={k.totalVolunteers} tone="blue" />
          <StatCard label="Aktif Gönüllü" value={k.activeVolunteers} tone="green" />
          <StatCard label="Yeni Kayıt" value={k.newVolunteers} />
          <StatCard label="Toplam Eğitmen" value={k.totalInstructors} />
          <StatCard label="Toplam Eğitim" value={k.totalTrainings} />
          <StatCard label="Tamamlanan Eğitim" value={k.completedTrainings} tone="green" />
          <StatCard label="Yaklaşan Eğitim" value={k.upcomingTrainings} tone="yellow" />
          <StatCard label="Oluşturulan Sınav" value={k.totalExams} />
          <StatCard label="Sınava Giren" value={k.examAttendees} />
          <StatCard label="Sınav Başarı" value={`%${k.passRate}`} tone="green" />
        </div>
      )}

      {/* Aylara göre eğitim (büyük) */}
      <Card>
        <CardHeader>
          <CardTitle>Aylara Göre Eğitim Sayısı</CardTitle>
        </CardHeader>
        <CardBody>{data && <LineChartView data={data.monthly} xKey="month" lineKey="count" label="Eğitim" height={400} />}</CardBody>
      </Card>

      {/* Alan bazlı analiz */}
      <Card>
        <CardHeader>
          <CardTitle>Eğitim Alanına Göre Analiz</CardTitle>
        </CardHeader>
        <CardBody className="space-y-5">
          {data && data.fieldAnalysis.length > 0 ? (
            <>
              <BarChartView
                data={data.fieldAnalysis.slice(0, 10).map((f) => ({ field: f.field, participants: f.participants }))}
                xKey="field"
                barKey="participants"
                label="Katılımcı"
                horizontal
              />
              <DataTable
                columns={[
                  { key: "field", label: "Eğitim Alanı" },
                  { key: "group", label: "Grup" },
                  { key: "trainings", label: "Eğitim Sayısı" },
                  { key: "participants", label: "Katılımcı" },
                  { key: "completed", label: "Tamamlanan" },
                  { key: "passRate", label: "Sınav Başarı" },
                ]}
                rows={fieldRows}
                searchable={false}
                pageSize={10}
              />
            </>
          ) : (
            <EmptyState title="Yeterli veri yok" />
          )}
        </CardBody>
      </Card>

      {/* İl bazlı analiz */}
      <Card>
        <CardHeader>
          <CardTitle>İl'e Göre Analiz</CardTitle>
        </CardHeader>
        <CardBody>
          {cityRows.length > 0 ? (
            <DataTable
              columns={[
                { key: "city", label: "İl" },
                { key: "region", label: "Bölge" },
                { key: "volunteers", label: "Gönüllü" },
                { key: "activeVolunteers", label: "Aktif Gönüllü" },
                { key: "instructors", label: "Eğitmen" },
                { key: "trainings", label: "Eğitim" },
                { key: "passRate", label: "Sınav Başarı" },
              ]}
              rows={cityRows}
            />
          ) : (
            <EmptyState title="Yeterli veri yok" />
          )}
        </CardBody>
      </Card>

      {/* Eğitmen bazlı analiz */}
      <Card>
        <CardHeader>
          <CardTitle>Eğitmene Göre Analiz</CardTitle>
        </CardHeader>
        <CardBody>
          {instructorRows.length > 0 ? (
            <DataTable
              columns={[
                { key: "name", label: "Eğitmen" },
                { key: "city", label: "İl" },
                { key: "expertise", label: "Uzmanlık" },
                { key: "trainingCount", label: "Eğitim" },
                { key: "participants", label: "Katılımcı" },
                { key: "avgScore", label: "Ort. Puan" },
                { key: "passRate", label: "Başarı" },
                { key: "cancelRate", label: "İptal Oranı" },
              ]}
              rows={instructorRows}
            />
          ) : (
            <EmptyState title="Yeterli veri yok" />
          )}
        </CardBody>
      </Card>

      {/* Tüm eğitim bilgileri */}
      <Card>
        <CardHeader>
          <CardTitle>Tüm Eğitim Bilgileri</CardTitle>
        </CardHeader>
        <CardBody>
          {trainingRows.length > 0 ? (
            <DataTable
              columns={[
                { key: "name", label: "Eğitim" },
                { key: "field", label: "Alan" },
                { key: "city", label: "İl" },
                { key: "location", label: "Konum" },
                { key: "startAt", label: "Başlangıç" },
                { key: "kontenjan", label: "Kontenjan" },
                { key: "exams", label: "Sınav" },
                { key: "instructor", label: "Eğitmen" },
                { key: "status", label: "Durum", type: "badge" },
              ]}
              rows={trainingRows}
              pageSize={10}
            />
          ) : (
            <EmptyState title="Eğitim bulunamadı" />
          )}
        </CardBody>
      </Card>

      {/* Güçlü/zayıf alanlar + risk */}
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
