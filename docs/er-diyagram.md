# ER Diyagramı

AFAD Gönüllü Eğitim Yönetim Sistemi ilişkisel veri modeli.

```mermaid
erDiagram
    User ||--o| VolunteerProfile : "1-1"
    User ||--o| InstructorProfile : "1-1"
    User ||--o| CoordinatorProfile : "1-1"
    User ||--o{ AuditLog : "yazar"
    User ||--o{ Announcement : "oluşturur"

    Region ||--o{ City : "içerir"
    Region ||--o{ VolunteerProfile : ""
    Region ||--o{ InstructorProfile : ""
    Region ||--o{ CoordinatorProfile : "sorumlu"
    Region ||--o{ Training : ""

    City ||--o{ VolunteerProfile : ""
    City ||--o{ InstructorProfile : ""
    City ||--o{ Training : ""
    City ||--o{ Exam : ""
    City ||--o{ Operation : ""

    TrainingCategory ||--o{ Training : ""
    TrainingCategory ||--o{ CertificateType : ""
    TrainingCategory ||--o{ InstructorExpertise : ""
    TrainingCategory ||--o{ Operation : "gerekli"

    CoordinatorProfile ||--o{ Training : "oluşturur"
    CoordinatorProfile ||--o{ Exam : "oluşturur"

    InstructorProfile ||--o{ TrainingInstructor : ""
    InstructorProfile ||--o{ InstructorExpertise : ""
    InstructorProfile ||--o{ InstructorCertificate : ""
    InstructorProfile ||--o{ Training : "baş eğitmen"
    InstructorProfile ||--o{ Exam : "sorumlu"
    InstructorProfile ||--o{ AttendanceSession : "oluşturur"

    Training ||--o{ TrainingInstructor : ""
    Training ||--o{ TrainingEnrollment : ""
    Training ||--o{ AttendanceSession : ""
    Training ||--o{ Exam : ""

    VolunteerProfile ||--o{ TrainingEnrollment : ""
    VolunteerProfile ||--o{ AttendanceRecord : ""
    VolunteerProfile ||--o{ ExamResult : ""
    VolunteerProfile ||--o{ VolunteerCertificate : ""
    VolunteerProfile ||--o{ OperationAssignment : ""

    AttendanceSession ||--o{ AttendanceRecord : ""

    Exam ||--o{ ExamResult : ""

    CertificateType ||--o{ VolunteerCertificate : ""
    CertificateType ||--o{ InstructorCertificate : ""

    Operation ||--o{ OperationAssignment : ""
```

## Temel İlişki Notları

- `User` ile üç profil tablosu (`VolunteerProfile`, `InstructorProfile`, `CoordinatorProfile`) arasında bire-bir ilişki vardır; `role` alanı hangi profilin geçerli olduğunu belirler.
- `Training` bir `TrainingCategory`, bir `City`/`Region`, opsiyonel bir `CoordinatorProfile` (oluşturan) ve opsiyonel bir baş eğitmene (`InstructorProfile`) bağlıdır.
- `TrainingInstructor` çoktan-çoğa eğitim-eğitmen ilişkisini (`@@unique([trainingId, instructorId])`) sağlar.
- `TrainingEnrollment` gönüllü-eğitim kaydını benzersiz tutar (`@@unique([trainingId, volunteerId])`).
- `AttendanceSession` + `AttendanceRecord` yoklama oturumlarını ve katılımcı kayıtlarını tutar; mükerrer engeli composite unique ile sağlanır.
- `Exam` bir eğitime bağlıdır; `ExamResult` sınav-gönüllü sonucunu benzersiz tutar (`@@unique([examId, volunteerId])`).
- Tüm kritik işlemler `AuditLog` tablosuna yazılır.
