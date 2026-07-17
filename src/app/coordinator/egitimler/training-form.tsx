"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Select, Textarea, Spinner } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { apiPost } from "@/lib/client-api";

interface Category {
  id: string;
  name: string;
  groupName: string;
  level: number | null;
}
interface City {
  id: string;
  name: string;
}
interface Instructor {
  id: string;
  name: string;
  city: string;
  categoryIds: string[];
  hasValidCert: boolean;
}

export function TrainingCreateButton({
  categories,
  cities,
  instructors,
}: {
  categories: Category[];
  cities: City[];
  instructors: Instructor[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Yeni Eğitim Oluştur</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Yeni Eğitim Oluştur" maxWidth="max-w-2xl">
        <TrainingForm
          categories={categories}
          cities={cities}
          instructors={instructors}
          onDone={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Modal>
    </>
  );
}

function TrainingForm({
  categories,
  cities,
  instructors,
  onDone,
}: {
  categories: Category[];
  cities: City[];
  instructors: Instructor[];
  onDone: () => void;
}) {
  const [categoryId, setCategoryId] = useState("");
  const [form, setForm] = useState({
    name: "",
    scope: "İl Bazlı",
    cityId: "",
    location: "",
    startAt: "",
    endAt: "",
    capacity: "20",
    instructorId: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);

  const eligibleInstructors = useMemo(
    () => instructors.filter((i) => categoryId && i.categoryIds.includes(categoryId) && i.hasValidCert),
    [instructors, categoryId],
  );

  function set(k: string, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function submit(confirm = false) {
    setLoading(true);
    setError(null);
    const payload = {
      name: form.name,
      categoryId,
      scope: form.scope,
      cityId: form.cityId,
      location: form.location,
      startAt: form.startAt ? new Date(form.startAt).toISOString() : "",
      endAt: form.endAt ? new Date(form.endAt).toISOString() : "",
      capacity: parseInt(form.capacity, 10) || 0,
      instructorId: form.instructorId,
      description: form.description || null,
      confirm,
    };
    const res = await apiPost<{ trainingId: string }>("/api/coordinator/trainings", payload);
    setLoading(false);
    if (res.ok) {
      onDone();
    } else if ((res as { requiresConfirm?: boolean }).requiresConfirm) {
      setConfirmMsg(res.error ?? "Eğitmen tarih çakışması var. Devam edilsin mi?");
    } else {
      setError(res.error ?? "İşlem başarısız.");
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(false);
      }}
      className="space-y-4"
    >
      {error && (
        <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Eğitim Kategorisi</Label>
          <Select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              set("instructorId", "");
              const cat = categories.find((c) => c.id === e.target.value);
              if (cat && !form.name) set("name", cat.name);
            }}
            required
          >
            <option value="" disabled>
              Seçiniz
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Eğitim Adı</Label>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label>Kapsam</Label>
          <Select value={form.scope} onChange={(e) => set("scope", e.target.value)}>
            <option value="İl Bazlı">İl Bazlı</option>
            <option value="Ulusal">Ulusal</option>
          </Select>
        </div>
        <div>
          <Label>İl (Sorumlu Bölgeniz)</Label>
          <Select value={form.cityId} onChange={(e) => set("cityId", e.target.value)} required>
            <option value="" disabled>
              Seçiniz
            </option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label>Konum</Label>
        <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Örn. Kayseri Koordinasyon Merkezi" required />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <Label>Başlangıç</Label>
          <Input type="datetime-local" value={form.startAt} onChange={(e) => set("startAt", e.target.value)} required />
        </div>
        <div>
          <Label>Bitiş</Label>
          <Input type="datetime-local" value={form.endAt} onChange={(e) => set("endAt", e.target.value)} required />
        </div>
        <div>
          <Label>Kontenjan</Label>
          <Input type="number" min={1} value={form.capacity} onChange={(e) => set("capacity", e.target.value)} required />
        </div>
      </div>

      <div>
        <Label>Eğitmen (uzman + geçerli belge)</Label>
        <Select value={form.instructorId} onChange={(e) => set("instructorId", e.target.value)} required disabled={!categoryId}>
          <option value="" disabled>
            {categoryId ? "Seçiniz" : "Önce kategori seçin"}
          </option>
          {eligibleInstructors.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name} · {i.city}
            </option>
          ))}
        </Select>
        {categoryId && eligibleInstructors.length === 0 && (
          <p className="mt-1 text-xs text-amber-600">Bu alanda geçerli belgeye sahip uygun eğitmen bulunamadı.</p>
        )}
      </div>

      <div>
        <Label>Açıklama</Label>
        <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? <Spinner /> : null}
          Eğitim Oluştur
        </Button>
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
    </form>
  );
}
