"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardBody, Select, Label, Badge, Spinner, EmptyState } from "@/components/ui";
import { apiGet } from "@/lib/client-api";
import { formatDate } from "@/lib/datetime";

interface CityPoint {
  cityId: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  value: number;
  volunteers: number;
  activeVolunteers: number;
  instructors: number;
  trainings: number;
  passRate: number;
  operations: number;
}

interface CityDetail {
  name: string;
  region: string;
  totalVol: number;
  activeVol: number;
  instructors: number;
  trainings: number;
  upcoming: { id: string; name: string; startAt: string }[];
  strongAreas: { group: string; count: number }[];
  weakAreas: { group: string; count: number }[];
  passRate: number;
  renewNeeded: number;
}

const METRICS = [
  { value: "volunteers", label: "Gönüllü Sayısı" },
  { value: "activeVolunteers", label: "Aktif Gönüllü" },
  { value: "trainings", label: "Eğitim Sayısı" },
  { value: "instructors", label: "Eğitmen Sayısı" },
  { value: "passRate", label: "Sınav Başarı Oranı" },
  { value: "operations", label: "Operasyon Sayısı" },
];

// Türkiye sınırlayıcı kutu projeksiyonu
const LNG_MIN = 25.5,
  LNG_MAX = 45,
  LAT_MIN = 35.5,
  LAT_MAX = 42.4;
const W = 820,
  H = 360;

function project(lat: number, lng: number) {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * W;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H;
  return { x, y };
}

function colorFor(ratio: number) {
  // Açık sarı -> koyu kırmızı (heat)
  const stops = [
    [255, 237, 160],
    [254, 178, 76],
    [240, 59, 32],
    [153, 0, 13],
  ];
  const seg = Math.min(stops.length - 2, Math.floor(ratio * (stops.length - 1)));
  const t = ratio * (stops.length - 1) - seg;
  const a = stops[seg];
  const b = stops[seg + 1];
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export function TurkeyMap() {
  const [metric, setMetric] = useState("volunteers");
  const [selected, setSelected] = useState<string | null>(null);

  const { data: points, isFetching } = useQuery({
    queryKey: ["map", metric],
    queryFn: async () => {
      const res = await apiGet<CityPoint[]>(`/api/coordinator/map?metric=${metric}`);
      if (!res.ok) throw new Error(res.error);
      return res.data!;
    },
  });

  const { data: detail, isFetching: detailLoading } = useQuery({
    queryKey: ["city", selected],
    enabled: !!selected,
    queryFn: async () => {
      const res = await apiGet<CityDetail>(`/api/coordinator/city/${selected}`);
      if (!res.ok) throw new Error(res.error);
      return res.data!;
    },
  });

  const max = points ? Math.max(1, ...points.map((p) => p.value)) : 1;
  const metricLabel = METRICS.find((m) => m.value === metric)?.label ?? "";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Türkiye İl Bazlı Isı Haritası</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="mb-4 flex items-center gap-3">
            <div className="w-64">
              <Label>Gösterge</Label>
              <Select value={metric} onChange={(e) => setMetric(e.target.value)}>
                {METRICS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </div>
            {isFetching && <Spinner className="mt-5 h-4 w-4 text-slate-400" />}
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50">
            <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Türkiye ısı haritası">
              <rect x={0} y={0} width={W} height={H} fill="#eef2f7" />
              {points?.map((p) => {
                const { x, y } = project(p.lat, p.lng);
                const ratio = p.value / max;
                const r = 6 + ratio * 16;
                const isSel = selected === p.cityId;
                return (
                  <g key={p.cityId} onClick={() => setSelected(p.cityId)} className="cursor-pointer">
                    <title>
                      {p.name}: {p.value} {metricLabel}
                    </title>
                    <circle
                      cx={x}
                      cy={y}
                      r={r}
                      fill={colorFor(ratio)}
                      fillOpacity={0.8}
                      stroke={isSel ? "#1e3a5f" : "#fff"}
                      strokeWidth={isSel ? 3 : 1}
                    />
                    {r > 14 && (
                      <text x={x} y={y + 3} textAnchor="middle" className="pointer-events-none" fontSize="9" fill="#1e293b">
                        {p.value}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Renk skalası */}
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <span>Düşük</span>
            <div className="h-3 w-40 rounded" style={{ background: "linear-gradient(to right, rgb(255,237,160), rgb(254,178,76), rgb(240,59,32), rgb(153,0,13))" }} />
            <span>Yüksek</span>
            <span className="ml-3">Bir ile tıklayarak detayları görün.</span>
          </div>
        </CardBody>
      </Card>

      {/* Detay paneli */}
      <Card>
        <CardHeader>
          <CardTitle>İl Detayı</CardTitle>
        </CardHeader>
        <CardBody>
          {!selected ? (
            <EmptyState title="İl seçilmedi" description="Haritadan bir il seçin." />
          ) : detailLoading || !detail ? (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Spinner /> Yükleniyor...
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-lg font-semibold text-slate-800">{detail.name}</p>
                <p className="text-xs text-slate-400">{detail.region} Bölgesi</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Stat label="Toplam Gönüllü" value={detail.totalVol} />
                <Stat label="Aktif Gönüllü" value={detail.activeVol} />
                <Stat label="Eğitmen" value={detail.instructors} />
                <Stat label="Eğitim" value={detail.trainings} />
                <Stat label="Sınav Başarı" value={`%${detail.passRate}`} />
                <Stat label="Yenileme İhtiyacı" value={detail.renewNeeded} />
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-slate-400">En Güçlü Alanlar</p>
                <div className="flex flex-wrap gap-1">
                  {detail.strongAreas.length ? (
                    detail.strongAreas.map((a) => (
                      <Badge key={a.group} tone="green">
                        {a.group} ({a.count})
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">Yeterli veri yok</span>
                  )}
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Yaklaşan Eğitimler</p>
                {detail.upcoming.length ? (
                  <ul className="space-y-1">
                    {detail.upcoming.map((u) => (
                      <li key={u.id} className="text-xs text-slate-600">
                        {u.name} · {formatDate(u.startAt)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-xs text-slate-400">Yaklaşan eğitim yok</span>
                )}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-base font-semibold text-slate-800">{value}</p>
    </div>
  );
}
