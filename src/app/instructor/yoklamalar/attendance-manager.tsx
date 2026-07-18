"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button, Select, Input, Label, Badge, Spinner, Card, CardBody } from "@/components/ui";
import { apiPost } from "@/lib/client-api";
import { formatDate } from "@/lib/datetime";

type AttStatus = "PRESENT" | "LATE" | "LEFT_EARLY" | "ABSENT" | "EXCUSED";

const STATUS_OPTIONS: { value: AttStatus; label: string }[] = [
  { value: "PRESENT", label: "Katıldı" },
  { value: "LATE", label: "Geç geldi" },
  { value: "LEFT_EARLY", label: "Erken ayrıldı" },
  { value: "ABSENT", label: "Katılmadı" },
  { value: "EXCUSED", label: "Mazeretli" },
];

const STATUS_ALIASES: Record<string, AttStatus> = {
  "katıldı": "PRESENT",
  "tam katılım": "PRESENT",
  "geç geldi": "LATE",
  "erken ayrıldı": "LEFT_EARLY",
  "katılmadı": "ABSENT",
  "mazeretli": "EXCUSED",
};

interface Participant {
  volunteerId: string;
  name: string;
  code: string;
}
interface Training {
  id: string;
  name: string;
  city: string;
  status: string;
  sessions: { id: string; date: string }[];
  participants: Participant[];
}

interface RowState {
  status: AttStatus;
  percentage: string;
  note: string;
}

export function AttendanceManager({ trainings }: { trainings: Training[] }) {
  const router = useRouter();
  const [trainingId, setTrainingId] = useState(trainings[0]?.id ?? "");
  const [sessionDate, setSessionDate] = useState("");
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const training = useMemo(() => trainings.find((t) => t.id === trainingId), [trainings, trainingId]);
  const participants = training?.participants ?? [];

  function rowOf(vId: string): RowState {
    return rows[vId] ?? { status: "PRESENT", percentage: "", note: "" };
  }
  function setRow(vId: string, patch: Partial<RowState>) {
    setRows((prev) => ({ ...prev, [vId]: { ...rowOf(vId), ...patch } }));
  }

  function handleCsv(file: File) {
    setUploadErrors([]);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) {
        setUploadErrors(["Dosya boş veya başlık satırı eksik."]);
        return;
      }
      const delim = lines[0].includes(";") ? ";" : ",";
      const header = lines[0].split(delim).map((h) => h.trim().toLowerCase());
      const codeIdx = header.findIndex((h) => h.includes("kod") || h.includes("gönüllü"));
      const statusIdx = header.findIndex((h) => h.includes("durum") || h.includes("katılım"));
      const pctIdx = header.findIndex((h) => h.includes("yüzde") || h.includes("%"));
      if (codeIdx === -1 || statusIdx === -1) {
        setUploadErrors(['CSV başlığında "Gönüllü Kodu" ve "Katılım Durumu" sütunları bulunmalıdır.']);
        return;
      }
      const codeToVol = new Map(participants.map((p) => [p.code.toLowerCase(), p.volunteerId]));
      const errors: string[] = [];
      const next: Record<string, RowState> = { ...rows };
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(delim).map((c) => c.trim());
        const code = (cols[codeIdx] ?? "").toLowerCase();
        const vId = codeToVol.get(code);
        if (!vId) {
          errors.push(`Satır ${i + 1}: '${cols[codeIdx]}' bu eğitimin katılımcısı değil.`);
          continue;
        }
        const statusRaw = (cols[statusIdx] ?? "").toLowerCase();
        const mapped = STATUS_ALIASES[statusRaw];
        if (!mapped) {
          errors.push(`Satır ${i + 1}: geçersiz katılım durumu '${cols[statusIdx]}'.`);
          continue;
        }
        const pct = pctIdx >= 0 ? cols[pctIdx] : "";
        next[vId] = { status: mapped, percentage: pct ?? "", note: rowOf(vId).note };
      }
      setRows(next);
      setUploadErrors(errors);
      setMessage(
        errors.length
          ? { type: "err", text: `${errors.length} hatalı satır bulundu. Geçerli satırlar forma uygulandı.` }
          : { type: "ok", text: "Dosya doğrulandı ve forma uygulandı. Kaydetmek için 'Yoklamayı Kaydet' butonuna basın." },
      );
    };
    reader.readAsText(file, "utf-8");
  }

  async function save() {
    setMessage(null);
    if (!trainingId || !sessionDate) {
      setMessage({ type: "err", text: "Eğitim ve oturum tarihi seçmelisiniz." });
      return;
    }
    setLoading(true);
    const records = participants.map((p) => {
      const r = rowOf(p.volunteerId);
      const pctNum = r.percentage.trim() === "" ? null : parseInt(r.percentage, 10);
      return {
        volunteerId: p.volunteerId,
        status: r.status,
        attendancePercentage: pctNum != null && !isNaN(pctNum) ? pctNum : null,
        note: r.note || null,
      };
    });
    const res = await apiPost("/api/instructor/attendance", {
      trainingId,
      sessionDate,
      records,
    });
    setLoading(false);
    if (res.ok) {
      setMessage({ type: "ok", text: "Yoklama kaydedildi. İstatistikler güncellendi." });
      router.refresh();
    } else {
      setMessage({ type: "err", text: res.error ?? "Kayıt başarısız." });
    }
  }

  if (trainings.length === 0) {
    return <p className="text-sm text-slate-500">Yoklama girebileceğiniz atanmış eğitim bulunmuyor.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label>Eğitim Seçin</Label>
          <Select
            value={trainingId}
            onChange={(e) => {
              setTrainingId(e.target.value);
              setRows({});
              setMessage(null);
              setUploadErrors([]);
            }}
          >
            {trainings.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} · {t.city}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Oturum Tarihi</Label>
          <Input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
        </div>
        <div>
          <Label>Yoklama Dosyası Yükle (CSV)</Label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => e.target.files?.[0] && handleCsv(e.target.files[0])}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-2 file:text-sm file:text-white"
          />
        </div>
      </div>

      {training && training.sessions.length > 0 && (
        <p className="text-xs text-slate-400">
          Kayıtlı oturumlar: {training.sessions.map((s) => formatDate(s.date)).join(", ")} (aynı tarih tekrar
          girilirse güncellenir)
        </p>
      )}

      {uploadErrors.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardBody>
            <p className="mb-2 text-sm font-medium text-amber-800">Doğrulama Raporu — Hatalı Satırlar</p>
            <ul className="list-inside list-disc space-y-0.5 text-xs text-amber-700">
              {uploadErrors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      {message && (
        <div
          role={message.type === "err" ? "alert" : "status"}
          className={
            message.type === "ok"
              ? "rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 ring-1 ring-green-200"
              : "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200"
          }
        >
          {message.text}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs text-slate-500">
              <th className="px-3 py-2">Katılımcı</th>
              <th className="px-3 py-2">Kod</th>
              <th className="px-3 py-2">Katılım Durumu</th>
              <th className="px-3 py-2">Katılım %</th>
              <th className="px-3 py-2">Not</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((p) => {
              const r = rowOf(p.volunteerId);
              return (
                <tr key={p.volunteerId} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-700">{p.name}</td>
                  <td className="px-3 py-2 text-slate-400">{p.code}</td>
                  <td className="px-3 py-2">
                    <Select value={r.status} onChange={(e) => setRow(p.volunteerId, { status: e.target.value as AttStatus })}>
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      className="w-20"
                      value={r.percentage}
                      placeholder="oto"
                      onChange={(e) => setRow(p.volunteerId, { percentage: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input value={r.note} onChange={(e) => setRow(p.volunteerId, { note: e.target.value })} placeholder="-" />
                  </td>
                </tr>
              );
            })}
            {participants.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-400">
                  Bu eğitime kayıtlı katılımcı bulunmuyor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          Katılım yüzdesi boş bırakılırsa duruma göre otomatik hesaplanır.{" "}
          <Badge tone="gray">{participants.length} katılımcı</Badge>
        </p>
        <Button onClick={save} disabled={loading}>
          {loading ? <Spinner /> : null}
          Yoklamayı Kaydet
        </Button>
      </div>
    </div>
  );
}
