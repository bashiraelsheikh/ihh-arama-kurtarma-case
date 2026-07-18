"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Select, Textarea, Spinner, Badge } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { apiPost } from "@/lib/client-api";

interface Training {
  id: string;
  name: string;
  categoryId: string;
  category: string;
  city: string;
  location: string;
  endAt: string;
  status: string;
  examCount: number;
  enrolled: number;
}

/** ISO tarihi datetime-local input değerine çevirir (YYYY-MM-DDTHH:mm) */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
interface Instructor {
  id: string;
  name: string;
  city: string;
  categoryIds: string[];
  hasValidCert: boolean;
}

const STEPS = ["Temel Bilgiler", "Sınav İçeriği", "Eğitmene Ata"];

export function ExamWizard({
  trainings,
  instructors,
  preselectedTrainingId,
}: {
  trainings: Training[];
  instructors: Instructor[];
  preselectedTrainingId?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [trainingId, setTrainingId] = useState(preselectedTrainingId ?? "");
  const [form, setForm] = useState({
    name: "",
    examType: "Yazılı",
    examDate: "",
    location: "",
    maxScore: "100",
    passingScore: "60",
    content: "",
    scope: "",
    learningObjectives: "",
    instructions: "",
    questionCount: "",
    durationMinutes: "",
    responsibleInstructorId: "",
    assignmentNote: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const training = useMemo(() => trainings.find((t) => t.id === trainingId), [trainings, trainingId]);
  const eligibleInstructors = useMemo(
    () => (training ? instructors.filter((i) => i.categoryIds.includes(training.categoryId) && i.hasValidCert) : []),
    [instructors, training],
  );

  function set(k: string, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  function next() {
    setError(null);
    if (step === 0) {
      if (!trainingId || !form.name || !form.examDate || !form.location) {
        setError("Lütfen zorunlu alanları doldurun (eğitim, sınav adı, tarih, yer).");
        return;
      }
    }
    if (step === 2) return;
    setStep((s) => s + 1);
  }

  async function submit(confirm = false) {
    setLoading(true);
    setError(null);
    const payload = {
      trainingId,
      name: form.name,
      examType: form.examType,
      examDate: form.examDate ? new Date(form.examDate).toISOString() : "",
      location: form.location,
      maxScore: parseInt(form.maxScore, 10) || 100,
      passingScore: parseInt(form.passingScore, 10) || 60,
      content: form.content || null,
      scope: form.scope || null,
      learningObjectives: form.learningObjectives || null,
      instructions: form.instructions || null,
      questionCount: form.questionCount ? parseInt(form.questionCount, 10) : null,
      durationMinutes: form.durationMinutes ? parseInt(form.durationMinutes, 10) : null,
      responsibleInstructorId: form.responsibleInstructorId,
      assignmentNote: form.assignmentNote || null,
      confirm,
    };
    const res = await apiPost<{ examId: string; candidates: number }>("/api/coordinator/exams", payload);
    setLoading(false);
    if (res.ok) {
      setSuccess(`Sınav oluşturuldu ve ${res.data?.candidates ?? 0} katılımcı aday olarak bağlandı.`);
      router.refresh();
    } else if ((res as { requiresConfirm?: boolean }).requiresConfirm) {
      setConfirmMsg(res.error ?? "Eğitim tamamlanmadı. Devam edilsin mi?");
    } else {
      setError(res.error ?? "İşlem başarısız.");
    }
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div role="status" className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800 ring-1 ring-green-200">
          {success}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push("/coordinator/sinavlarim")}>Sınavlarıma Git</Button>
          <Button
            variant="outline"
            onClick={() => {
              setSuccess(null);
              setStep(0);
              setForm((p) => ({ ...p, name: "", examDate: "", location: "", responsibleInstructorId: "" }));
            }}
          >
            Yeni Sınav Oluştur
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Adım göstergesi */}
      <ol className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                i <= step ? "bg-brand text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {i + 1}
            </span>
            <span className={`text-sm ${i === step ? "font-semibold text-slate-800" : "text-slate-400"}`}>{label}</span>
            {i < STEPS.length - 1 && <span className="mx-2 h-px flex-1 bg-slate-200" />}
          </li>
        ))}
      </ol>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      {/* Adım 1 */}
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <Label>Eğitim Seçimi</Label>
            <Select
              value={trainingId}
              onChange={(e) => {
                setTrainingId(e.target.value);
                const t = trainings.find((x) => x.id === e.target.value);
                if (t) {
                  // Eğitimden akıllı varsayılanlar (kullanıcı değiştirebilir)
                  setForm((p) => ({
                    ...p,
                    name: `${t.name} Değerlendirme Sınavı`,
                    scope: t.category,
                    location: p.location || t.city,
                    examDate: p.examDate || toLocalInput(t.endAt),
                  }));
                }
              }}
              required
            >
              <option value="" disabled>
                Seçiniz
              </option>
              {trainings.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} · {t.city} · {t.status === "COMPLETED" ? "Tamamlandı" : "Devam/Planlı"}
                </option>
              ))}
            </Select>
            {training && training.status !== "COMPLETED" && (
              <p className="mt-1 text-xs text-amber-600">
                Uyarı: Bu eğitim henüz tamamlanmadı. Sınav oluşturulabilir ancak tamamlanması önerilir.
              </p>
            )}
            {training && training.examCount > 0 && (
              <p className="mt-1 text-xs text-amber-600">Bu eğitim için zaten {training.examCount} sınav mevcut.</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Sınav Adı</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </div>
            <div>
              <Label>Sınav Türü</Label>
              <Select value={form.examType} onChange={(e) => set("examType", e.target.value)}>
                <option>Yazılı</option>
                <option>Uygulamalı</option>
                <option>Karma</option>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Sınav Tarihi</Label>
              <Input type="datetime-local" value={form.examDate} onChange={(e) => set("examDate", e.target.value)} required />
            </div>
            <div>
              <Label>Sınav Yeri</Label>
              <Input value={form.location} onChange={(e) => set("location", e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Azami Puan</Label>
              <Input type="number" value={form.maxScore} onChange={(e) => set("maxScore", e.target.value)} />
            </div>
            <div>
              <Label>Geçme Puanı</Label>
              <Input type="number" value={form.passingScore} onChange={(e) => set("passingScore", e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Adım 2 */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <Label>Sınav Açıklaması</Label>
            <Textarea value={form.content} onChange={(e) => set("content", e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Sınav Kapsamı (otomatik: alan)</Label>
              <Input value={form.scope} onChange={(e) => set("scope", e.target.value)} />
            </div>
            <div>
              <Label>Öğrenme Hedefleri</Label>
              <Input value={form.learningObjectives} onChange={(e) => set("learningObjectives", e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Talimatlar</Label>
            <Textarea value={form.instructions} onChange={(e) => set("instructions", e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Soru Sayısı</Label>
              <Input type="number" value={form.questionCount} onChange={(e) => set("questionCount", e.target.value)} />
            </div>
            <div>
              <Label>Süre (dakika)</Label>
              <Input type="number" value={form.durationMinutes} onChange={(e) => set("durationMinutes", e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Adım 3 */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <Label>Sınavdan Sorumlu Eğitmen</Label>
            <Select value={form.responsibleInstructorId} onChange={(e) => set("responsibleInstructorId", e.target.value)} required>
              <option value="" disabled>
                Seçiniz
              </option>
              {eligibleInstructors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} · {i.city}
                </option>
              ))}
            </Select>
            {eligibleInstructors.length === 0 && (
              <p className="mt-1 text-xs text-amber-600">
                Bu sınavın alanında ({training?.category}) geçerli belgeye sahip uygun eğitmen bulunamadı.
              </p>
            )}
            {training && (
              <p className="mt-2 text-xs text-slate-400">
                Alan/uzmanlık kontrolü: yalnızca <Badge tone="blue">{training.category}</Badge> alanında uzman eğitmenler
                listelenir.
              </p>
            )}
          </div>
          <div>
            <Label>Atama Notu</Label>
            <Textarea value={form.assignmentNote} onChange={(e) => set("assignmentNote", e.target.value)} rows={2} />
          </div>
        </div>
      )}

      {/* Navigasyon */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || loading}>
          Geri
        </Button>
        {step < 2 ? (
          <Button onClick={next}>İleri</Button>
        ) : (
          <Button onClick={() => submit(false)} disabled={loading || !form.responsibleInstructorId}>
            {loading ? <Spinner /> : null}
            Sınavı Oluştur
          </Button>
        )}
      </div>

      <Modal open={!!confirmMsg} onClose={() => setConfirmMsg(null)} title="Uyarı" maxWidth="max-w-md">
        <p className="text-sm text-slate-600">{confirmMsg}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirmMsg(null)} disabled={loading}>
            Vazgeç
          </Button>
          <Button
            onClick={() => {
              setConfirmMsg(null);
              submit(true);
            }}
            disabled={loading}
          >
            Yine de Oluştur
          </Button>
        </div>
      </Modal>
    </div>
  );
}
