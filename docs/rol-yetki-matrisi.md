# Rol ve Yetki Matrisi

Sistemde üç kullanıcı rolü vardır: **Gönüllü (VOLUNTEER)**, **Eğitmen (INSTRUCTOR)**, **Merkez Eğitim Sorumlusu (COORDINATOR)**.

Yetkiler hem **frontend** (middleware + rol bazlı yönlendirme + rol bazlı menü) hem de **backend** (her API/route ve server action içinde `requireRole` / `requireApiRole` + kaynak sahipliği kontrolü) katmanında uygulanır.

| İşlem | Gönüllü | Eğitmen | Merkez Sorumlusu |
|---|:---:|:---:|:---:|
| Giriş / kendi paneline erişim | ✅ `/volunteer` | ✅ `/instructor` | ✅ `/coordinator` |
| Gönüllü olarak kayıt olma | ✅ | — | — |
| Kendi dashboard verilerini görme | ✅ | ✅ | ✅ (bölge) |
| Eğitime kaydolma | ✅ | ❌ | ❌ |
| Telefon bilgisini güncelleme | ✅ | ❌ | ❌ |
| Operasyon çağrısına yanıt | ✅ | ❌ | ❌ |
| Kendi sertifikalarını görme | ✅ | ✅ (belgeler) | ❌ (menüde yok) |
| Yoklama girme / dosya yükleme | ❌ | ✅ (sadece kendi eğitimi) | ❌ |
| Sınav sonucu girme | ❌ | ✅ (sadece atanmış sınav) | ❌ |
| Eğitim oluşturma | ❌ | ❌ | ✅ (sadece kendi bölgesi) |
| Eğitmene sınav atama / sınav oluşturma | ❌ | ❌ | ✅ |
| Gönüllü / eğitmen listeleri, analiz, harita | ❌ | ❌ | ✅ |
| Şifre değiştirme (kendi hesabı) | ✅ | ✅ | ✅ |

## Kaynak Sahipliği (Resource Ownership) Kuralları

- **Eğitmen** yalnızca `TrainingInstructor` tablosunda kendisine atanmış eğitimlere yoklama girebilir (`instructorOwnsTraining`).
- **Eğitmen** yalnızca `responsibleInstructorId` kendisi olan sınavlara sonuç girebilir (`instructorOwnsExam`).
- **Merkez Sorumlusu** yalnızca `responsibleRegionId` bölgesindeki illerde eğitim oluşturabilir (başka bölge reddedilir).
- **Gönüllü** yalnızca kendisine ait `OperationAssignment` kaydına yanıt verebilir.

## Yetkisiz Erişim Davranışı

- Oturum yoksa `/login`'e yönlendirilir (middleware).
- Yanlış role ait sayfaya erişimde kullanıcı kendi paneline yönlendirilir (middleware + `requireRole`).
- Yetkisiz API çağrısı `403` (Türkçe hata mesajı) döner.
