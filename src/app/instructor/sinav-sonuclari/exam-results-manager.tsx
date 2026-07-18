"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button, Select, Input, Label, Badge, Spinner } from "@/components/ui";
import { apiPost } from "@/lib/client-api";
import { formatDateTime } from "@/lib/datetime";

interface Candidate {
  volunteerId: string;
  name: string;
  code: string;
  attended: boolean;
  score: number | null;
  note: string | null;
  resultStatus: string;
}
interface Exam {
  id: string;
  name: string;
  training: string;
  examDate: string;
  maxScore: number;
  passingScore: number;
  candidates: Candidate[];
}

interface RowState {
  attended: boolean;
  score: string;
  note: string;
}

export function ExamResultsManager({ exams }: { exams: Exam[] }) {
  const router = useRouter();
  const [examId, setExamId] = useState(exams[0]?.id ?? "");
  const exam = useMemo(() => exams.find((e) => e.id === examId), [exams, examId]);
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  function rowOf(c: Candidate): RowState {
    return (
      rows[c.volunteerId] ?? {
        attended: c.attended,
        score: c.score != null ? String(c.score) : "",
        note: c.note ?? "",
      }
    );
  }
  function setRow(vId: string, patch: Partial<RowState>, base: Candidate) {
    setRows((prev) => ({ ...prev, [vId]: { ...rowOf(base), ...patch } }));
  }

  function previewResult(r: RowState): { label: string; tone: "green" | "red" | "gray" } {
    if (!r.attended) return { label: "Değerlendirilmedi", tone: "gray" };
    if (r.score.trim() === "") return { label: "Puan bekleniyor", tone: "gray" };
    const s = parseInt(r.score, 10);
    if (isNaN(s)) return { label: "Geçersiz puan", tone: "gray" };
    return s >= (exam?.passingScore ?? 60) ? { label: "Geçti", tone: "green" } : { label: "Kaldı", tone: "red" };
  }

  async function save() {
    if (!exam) return;
    setLoading(true);
    setMessage(null);
    const results = exam.candidates.map((c) => {
      const r = rowOf(c);
      const scoreNum = r.score.trim() === "" ? null : parseInt(r.score, 10);
      return {
        volunteerId: c.volunteerId,
        attended: r.attended,
        score: scoreNum != null && !isNaN(scoreNum) ? scoreNum : null,
        note: r.note || null,
      };
    });
    const res = await apiPost("/api/instructor/exam-results", { examId, results });
    setLoading(false);
    if (res.ok) {
      setMessage({ type: "ok", text: "Sınav sonuçları kaydedildi. Geçti/kaldı bilgisi otomatik hesaplandı." });
      router.refresh();
    } else {
      setMessage({ type: "err", text: res.error ?? "Kayıt başarısız." });
    }
  }

  if (exams.length === 0) {
    return <p className="text-sm text-slate-500">Size atanmış sınav bulunmuyor.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Sınav Seçin</Label>
          <Select
            value={examId}
            onChange={(e) => {
              setExamId(e.target.value);
              setRows({});
              setMessage(null);
            }}
          >
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </Select>
        </div>
        {exam && (
          <div className="flex items-end text-sm text-slate-500">
            <div>
              <p>
                <span className="font-medium text-slate-700">Eğitim:</span> {exam.training}
              </p>
              <p>
                {formatDateTime(exam.examDate)} · Geçme Puanı: {exam.passingScore}/{exam.maxScore}
              </p>
            </div>
          </div>
        )}
      </div>

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
              <th className="px-3 py-2">Sınava Girdi</th>
              <th className="px-3 py-2">Puan</th>
              <th className="px-3 py-2">Sonuç (otomatik)</th>
              <th className="px-3 py-2">Not</th>
            </tr>
          </thead>
          <tbody>
            {exam?.candidates.map((c) => {
              const r = rowOf(c);
              const preview = previewResult(r);
              return (
                <tr key={c.volunteerId} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-700">{c.name}</td>
                  <td className="px-3 py-2 text-slate-400">{c.code}</td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={r.attended}
                      onChange={(e) => setRow(c.volunteerId, { attended: e.target.checked }, c)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      type="number"
                      min={0}
                      max={exam.maxScore}
                      className="w-24"
                      value={r.score}
                      disabled={!r.attended}
                      onChange={(e) => setRow(c.volunteerId, { score: e.target.value }, c)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={preview.tone}>{preview.label}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Input value={r.note} onChange={(e) => setRow(c.volunteerId, { note: e.target.value }, c)} placeholder="-" />
                  </td>
                </tr>
              );
            })}
            {exam?.candidates.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-sm text-slate-400">
                  Bu sınava bağlı katılımcı bulunmuyor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={loading}>
          {loading ? <Spinner /> : null}
          Sonuçları Kaydet
        </Button>
      </div>
    </div>
  );
}
