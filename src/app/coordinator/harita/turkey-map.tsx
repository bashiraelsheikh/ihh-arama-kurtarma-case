"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardBody, Select, Label, Badge, Spinner, EmptyState } from "@/components/ui";
import { apiGet } from "@/lib/client-api";
import { formatDate } from "@/lib/datetime";

interface CityPoint {
  cityId: string;
  name: string;
  region: string;
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

type GeoFeature = {
  properties: { name: string };
  geometry: { type: "Polygon" | "MultiPolygon"; coordinates: number[][][] | number[][][][] };
};
type GeoJson = { features: GeoFeature[] };

const METRICS = [
  { value: "volunteers", label: "Gönüllü Sayısı", unit: "" },
  { value: "activeVolunteers", label: "Aktif Gönüllü", unit: "" },
  { value: "trainings", label: "Eğitim Sayısı", unit: "" },
  { value: "instructors", label: "Eğitmen Sayısı", unit: "" },
  { value: "passRate", label: "Sınav Başarı Oranı", unit: "%" },
  { value: "operations", label: "Operasyon Sayısı", unit: "" },
];

// GeoJSON adı -> veritabanı il adı eşlemesi (farklı olanlar)
const NAME_ALIAS: Record<string, string> = { Afyon: "Afyonkarahisar" };
const normalize = (n: string) => NAME_ALIAS[n] ?? n;

const W = 900;
const H = 420;
const PAD = 12;

function colorFor(ratio: number) {
  const stops = [
    [255, 241, 214],
    [253, 190, 110],
    [240, 100, 34],
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
  const [hover, setHover] = useState<{ name: string; value: number; x: number; y: number } | null>(null);

  const { data: points, isFetching } = useQuery({
    queryKey: ["map", metric],
    queryFn: async () => {
      const res = await apiGet<CityPoint[]>(`/api/coordinator/map?metric=${metric}`);
      if (!res.ok) throw new Error(res.error);
      return res.data!;
    },
  });

  const { data: geo } = useQuery({
    queryKey: ["turkey-geo"],
    staleTime: Infinity,
    queryFn: async () => {
      const res = await fetch("/turkey-provinces.geo.json");
      return (await res.json()) as GeoJson;
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

  // Projeksiyon: tüm koordinatlardan sınırlayıcı kutu + eş dikdörtgen izdüşüm
  const projection = useMemo(() => {
    if (!geo) return null;
    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    const scan = (c: unknown): void => {
      if (typeof (c as number[])[0] === "number") {
        const [lon, lat] = c as number[];
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      } else {
        for (const x of c as unknown[]) scan(x);
      }
    };
    for (const f of geo.features) scan(f.geometry.coordinates);
    const midLat = (minLat + maxLat) / 2;
    const kx = Math.cos((midLat * Math.PI) / 180);
    const lonSpan = (maxLon - minLon) * kx;
    const latSpan = maxLat - minLat;
    const scale = Math.min((W - 2 * PAD) / lonSpan, (H - 2 * PAD) / latSpan);
    const offX = (W - lonSpan * scale) / 2;
    const offY = (H - latSpan * scale) / 2;
    const project = (lon: number, lat: number): [number, number] => [
      offX + (lon - minLon) * kx * scale,
      offY + (maxLat - lat) * scale,
    ];
    return { project };
  }, [geo]);

  // İl adına göre veri eşlemesi
  const byName = useMemo(() => {
    const m = new Map<string, CityPoint>();
    for (const p of points ?? []) m.set(p.name, p);
    return m;
  }, [points]);

  const max = useMemo(() => Math.max(1, ...(points ?? []).map((p) => p.value)), [points]);

  const paths = useMemo(() => {
    if (!geo || !projection) return [];
    const build = (feature: GeoFeature): string => {
      const rings: number[][][] =
        feature.geometry.type === "Polygon"
          ? (feature.geometry.coordinates as number[][][])
          : (feature.geometry.coordinates as number[][][][]).flat(1);
      let d = "";
      for (const ring of rings) {
        ring.forEach(([lon, lat], i) => {
          const [x, y] = projection.project(lon, lat);
          d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)} `;
        });
        d += "Z ";
      }
      return d;
    };
    return geo.features.map((f) => {
      const dbName = normalize(f.properties.name);
      const point = byName.get(dbName);
      const value = point?.value ?? 0;
      return { name: dbName, geoName: f.properties.name, cityId: point?.cityId, value, d: build(f) };
    });
  }, [geo, projection, byName]);

  const metricLabel = METRICS.find((m) => m.value === metric)?.label ?? "";
  const metricUnit = METRICS.find((m) => m.value === metric)?.unit ?? "";

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
            {(isFetching || !geo) && <Spinner className="mt-5 h-4 w-4 text-slate-400" />}
          </div>

          <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-b from-sky-50 to-white">
            <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Türkiye il bazlı ısı haritası">
              {paths.map((p) => {
                const ratio = p.value / max;
                const isSel = !!p.cityId && selected === p.cityId;
                const fill = p.value > 0 ? colorFor(ratio) : "#e9edf2";
                return (
                  <path
                    key={p.geoName}
                    d={p.d}
                    fill={fill}
                    stroke={isSel ? "#0e1c28" : "#ffffff"}
                    strokeWidth={isSel ? 1.6 : 0.5}
                    className="cursor-pointer transition-[stroke,fill] hover:stroke-brand"
                    onMouseEnter={(e) => {
                      const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                      setHover({ name: p.name, value: p.value, x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }}
                    onMouseMove={(e) => {
                      const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                      setHover({ name: p.name, value: p.value, x: e.clientX - rect.left, y: e.clientY - rect.top });
                    }}
                    onMouseLeave={() => setHover(null)}
                    onClick={() => p.cityId && setSelected(p.cityId)}
                  />
                );
              })}
            </svg>
            {hover && (
              <div
                className="pointer-events-none absolute z-10 rounded-md bg-brand px-2 py-1 text-xs font-medium text-white shadow"
                style={{ left: Math.min(hover.x + 10, W - 120), top: hover.y + 10 }}
              >
                {hover.name}: {hover.value}
                {metricUnit} {metricLabel}
              </div>
            )}
          </div>

          {/* Renk skalası */}
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <span>Düşük</span>
            <div
              className="h-3 w-40 rounded"
              style={{
                background:
                  "linear-gradient(to right, rgb(255,241,214), rgb(253,190,110), rgb(240,100,34), rgb(153,0,13))",
              }}
            />
            <span>Yüksek ({metricLabel})</span>
            <span className="ml-3 flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ background: "#e9edf2" }} /> Veri yok
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Bir ile tıklayarak detayları görüntüleyin.</p>
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
