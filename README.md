# İHH Merkezi Eğitim Sistemi

İHH Arama Kurtarma için; gönüllülerin, eğitmenlerin ve merkez eğitim sorumlularının; eğitimleri, katılımları, yoklamaları, sınavları, sertifikaları ve operasyon çağrılarını tek sistemden yönettiği **rol bazlı, uçtan uca çalışan** bir eğitim yönetim platformu.

> Bu depo bir vaka çalışmasıdır. Tüm veriler sentetiktir. Uygulama dili Türkçe'dir.

## İçindekiler

- [Projenin Amacı](#projenin-amacı)
- [Teknoloji Yığını](#teknoloji-yığını)
- [Kurulum](#kurulum)
- [Environment Variables](#environment-variables)
- [Database Migration](#database-migration)
- [Excel/CSV Import ve Seed](#excelcsv-import-ve-seed)
- [Uygulamayı Çalıştırma](#uygulamayı-çalıştırma)
- [Docker ile Çalıştırma](#docker-ile-çalıştırma)
- [Testleri Çalıştırma](#testleri-çalıştırma)
- [Demo Hesaplar](#demo-hesaplar)
- [Rol ve Yetkiler](#rol-ve-yetkiler)
- [Veri Modeli](#veri-modeli)
- [Kritik İş Kuralları](#kritik-iş-kuralları)
- [API / Servis Katmanı](#api--servis-katmanı)
- [Varsayımlar](#varsayımlar)
- [Production Deployment Notları](#production-deployment-notları)

## Projenin Amacı

Sistemde üç kullanıcı rolü bulunur: **Gönüllü**, **Eğitmen**, **Merkez Eğitim Sorumlusu**. Kullanıcı giriş yaptıktan sonra rolüne uygun panele yönlendirilir (`/volunteer`, `/instructor`, `/coordinator`). Tüm istatistikler PostgreSQL veritabanından gerçek zamanlı hesaplanır; sabit/örnek sayı kullanılmaz.

## Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind CSS |
| Grafikler | Recharts |
| Form & Doğrulama | React Hook Form yaklaşımı + Zod şema doğrulama |
| İstemci veri yönetimi | TanStack Query (cache invalidation), `router.refresh()` ile sunucu bileşeni yenileme |
| Backend | Next.js Route Handlers (REST) + Server Actions, servis katmanı |
| Veritabanı | PostgreSQL + Prisma ORM (ilişkisel, foreign key, transaction) |
| Kimlik doğrulama | JWT (jose) tabanlı httpOnly session cookie, `bcryptjs` parola hash |
| Test | Vitest (birim + entegrasyon) |
| Harita | SVG tabanlı Türkiye il bazlı ısı haritası (koordinat projeksiyonu) |

## Kurulum

Ön koşullar: **Node.js 22+**, **pnpm 10+**, çalışan bir **PostgreSQL 16** sunucusu.

```bash
# 1. Bağımlılıkları kur
pnpm install

# 2. Ortam değişkenlerini hazırla
cp .env.example .env
# .env içindeki DATABASE_URL ve AUTH_SECRET değerlerini düzenleyin

# 3. Prisma client üret
pnpm prisma generate

# 4. Migration'ları uygula
pnpm prisma migrate deploy   # veya geliştirme için: pnpm prisma migrate dev

# 5. Veri setini içe aktar (seed)
pnpm db:seed

# 6. Geliştirme sunucusunu başlat
pnpm dev
# http://localhost:3000
```

Yerel PostgreSQL yoksa Docker ile: `docker compose up -d db` ile sadece veritabanını ayağa kaldırabilirsiniz.

## Environment Variables

`.env.example` dosyasına bakınız.

| Değişken | Açıklama |
|---|---|
| `DATABASE_URL` | PostgreSQL bağlantı adresi |
| `AUTH_SECRET` | JWT imzalama anahtarı (production'da min 32 karakter güçlü rastgele değer) |
| `NODE_ENV` | `development` / `production` |
| `TZ` | `Europe/Istanbul` |

## Database Migration

```bash
pnpm prisma migrate dev       # yeni migration oluştur + uygula (geliştirme)
pnpm prisma migrate deploy    # mevcut migration'ları uygula (production)
pnpm prisma studio            # veritabanını görsel inceleme (opsiyonel)
```

## Excel/CSV Import ve Seed

Kaynak veri seti `data/veri_seti.csv` dosyasındadır (noktalı virgülle ayrılmış, çok bölümlü).

```bash
pnpm db:import   # veya: pnpm db:seed
```

Import mekanizması (`scripts/import-csv.ts`):

- **Idempotent**: aynı dosya tekrar çalıştırıldığında mükerrer kayıt oluşmaz (kod bazlı `upsert`).
- Gönüllü, eğitmen ve merkez sorumlusu **hesapları** oluşturulur; **şifreler bcrypt ile hash'lenir**.
- Eğitimler, eğitmen atamaları, katılımlar, sınavlar ve sınav sonuçları **ilişkileri korunarak** aktarılır.
- Eksik foreign key durumları **uyarı olarak raporlanır** (sessizce başarısız olmaz), terminale özet basılır.
- CSV'deki ID'ler (`GNL-`, `EGT-`, `MES-`, `EĞT-`, `SNV-`, `GSRT-` ...) benzersiz kod alanı olarak korunur.

Örnek çıktı: `Gönüllüler: 80`, `Eğitmenler: 12`, `Eğitimler: 45`, `Katılım kayıtları: 787`, `Sınavlar: 29`, `Sınav sonuçları: 504`, `Uyarı yok.`

## Uygulamayı Çalıştırma

```bash
pnpm dev      # geliştirme (http://localhost:3000)
pnpm build    # production derleme (prisma generate + next build)
pnpm start    # production sunucu
pnpm lint     # ESLint
pnpm typecheck# TypeScript tip kontrolü
```

## Docker ile Çalıştırma

```bash
docker compose up --build
# db (postgres:16) + app servisleri ayağa kalkar
# app konteyneri: migrate deploy + seed + dev sunucusu
# http://localhost:3000
```

## Testleri Çalıştırma

```bash
pnpm test        # tüm testler (Vitest)
pnpm test:watch  # izleme modu
```

Kapsanan senaryolar: parola hash (düz metin saklanmaması), gönüllü kayıt doğrulaması (şifre gücü, telefon, kimlik, onay), seviye bağımlılığı, sertifika/telefon güncellik durumu, geçti/kaldı tutarlılığı, katılım/kayıt benzersizliği, FK bütünlüğü.

## Demo Hesaplar

> Parolalar yalnızca geliştirme ortamı içindir (veri seti sentetiktir).

| Rol | E-posta | Şifre |
|---|---|---|
| Gönüllü | `tolga.ozturk.1@ornek.org` | `GNLByupdi926!001` |
| Eğitmen | `furkan.ozturk.1@egitmen.ornek.org` | `EGTWzcnrb223!001` |
| Merkez Eğitim Sorumlusu | `emre.kara.1@merkez.ornek.org` | `MESOrmcrj331!001` |

Diğer tüm hesapların e-posta/şifre bilgileri `data/veri_seti.csv` "Hesap" bölümündedir. Ayrıca `/register` sayfasından yeni gönüllü hesabı açabilirsiniz.

## Rol ve Yetkiler

Ayrıntılı matris: [`docs/rol-yetki-matrisi.md`](docs/rol-yetki-matrisi.md).

- Gönüllü → `/volunteer`, Eğitmen → `/instructor`, Merkez Sorumlusu → `/coordinator`.
- Yetki kontrolü **hem frontend (middleware + rol menüsü) hem backend (`requireRole`/`requireApiRole` + kaynak sahipliği)** katmanında uygulanır.
- Merkez Eğitim Sorumlusu panelinde **Sertifikalar menüsü bulunmaz**.

## Veri Modeli

İlişkisel şema `prisma/schema.prisma` dosyasındadır. ER diyagramı: [`docs/er-diyagram.md`](docs/er-diyagram.md).

Ana tablolar: `User`, `VolunteerProfile`, `InstructorProfile`, `CoordinatorProfile`, `Region`, `City`, `TrainingCategory`, `Training`, `TrainingInstructor`, `TrainingEnrollment`, `AttendanceSession`, `AttendanceRecord`, `Exam`, `ExamResult`, `CertificateType`, `VolunteerCertificate`, `InstructorCertificate`, `InstructorExpertise`, `Operation`, `OperationAssignment`, `Announcement`, `AuditLog`.

## Kritik İş Kuralları

- **Seviye bağımlılığı**: Seviye 2 alınmadan Seviye 3 tamamlanmış sayılmaz; bir sonraki önerilen eğitim, tamamlanan en yüksek seviyeye göre belirlenir.
- **Telefon güncelliği**: 0–180 gün Güncel · 181–365 gün Kontrol edilmeli · 365+ gün Güncellenmesi gerekiyor.
- **Sertifika durumu**: Geçerli · 60 gün içinde sona erecek · Süresi dolmuş.
- **Eğitim önerisi (duyurular)**: yalnızca tamamlanmamış, kayıt dönemi açık (Planlandı + gelecek tarih), kontenjanı dolmamış ve gönüllünün il/bölgesine uygun eğitimler önerilir.
- **Kontenjan**: kayıt işlemi transaction içinde kontenjan kontrolüyle yapılır (aşım engellenir, mükerrer kayıt engellenir).
- **Yoklama**: aynı eğitim+oturum tarihine tekrar giriş yapılırsa mükerrer satır yerine güncelleme yapılır; katılım yüzdesi girilebilir veya durumdan otomatik hesaplanır; CSV yükleme ön izleme + doğrulama raporu üretir.
- **Sınav sonucu**: geçti/kaldı `passingScore`'a göre otomatik; sınava girmeyen için puan boş, sonuç "Değerlendirilmedi"; aynı sınav+gönüllü için tek aktif sonuç kaydı; tüm işlem transaction içinde.
- **Eğitim oluşturma**: yalnızca sorumlunun bölgesi, uzman + geçerli belgeli eğitmen; eğitmen tarih çakışmasında uyarı; Training + TrainingInstructor + Announcement transaction içinde.
- **Sınav oluşturma**: eğitime bağlı; alan/seviye eğitimden otomatik; katılımcılar aday olarak otomatik bağlanır; aynı eğitim+türde mükerrer sınav engeli; eğitim tamamlanmadıysa uyarı.
- **Audit log**: login/logout, kayıt, kayıt olma, telefon güncelleme, operasyon yanıtı, yoklama, sınav sonucu, eğitim/sınav oluşturma işlemleri kaydedilir.
- **Anlık güncelleme**: mutasyonlardan sonra `router.refresh()` ve/veya TanStack Query invalidation ile ilgili ekranlar sayfa yenilenmeden güncellenir.
- **Tarih/saat**: veritabanında UTC saklanır, arayüzde `gg.aa.yyyy` / `gg.aa.yyyy ss:dd` ve `Europe/Istanbul` ile gösterilir.

## API / Servis Katmanı

Servisler `src/lib/services/*` altında (volunteer, instructor, coordinator). Ortak yardımcılar: `auth`, `session`, `password`, `audit`, `business`, `datetime`, `validation`, `api`. Route handler'ları `src/app/api/*` altında rol koruması, input doğrulama (Zod), güvenli hata yönetimi ve transaction ile yazılmıştır.

## Varsayımlar

- **Kimlik numarası** veri setinde bulunmadığından, import sırasında role göre benzersiz sentetik 11 haneli numaralar üretilir.
- **Bir gönüllünün tamamladığı eğitimler**; tamamlanmış katılım kayıtları (`TrainingEnrollment.completionStatus = COMPLETED`) ve sahip olduğu sertifikaların katalog eğitim adına eşlenmesinden hesaplanır.
- **Katılım tamamlama**: eğitim durumu "Tamamlandı" ve katılım yüzdesi ≥ %70 ise ilgili kayıt tamamlanmış sayılır.
- **Operasyon çağrıları** veri setinde bulunmadığından, gönüllü operasyon akışını göstermek için bölge bazlı örnek aktif operasyonlar deterministik olarak seed edilir.
- **Merkez sorumlusu analiz/harita** görünümü ülke genelini kapsar (filtrelerle daraltılabilir); eğitim/sınav oluşturma ve gönüllü/eğitmen listeleri sorumlunun bölgesine göre yönetilir.

## Production Deployment Notları

- `AUTH_SECRET` güçlü ve gizli bir değer olmalı; cookie `secure` bayrağı production'da aktif olur.
- `pnpm build` öncesi `prisma generate` çalışır; deploy adımında `prisma migrate deploy` kullanılmalıdır.
- Veritabanı bağlantı havuzu (PgBouncer vb.) ve okuma replikaları büyük ölçek için önerilir.
- Rate limiting, HTTPS, CSRF (SameSite=Lax cookie) ve güvenli hata yönetimi uygulanmıştır; production'da ek WAF/oran sınırlama önerilir.
