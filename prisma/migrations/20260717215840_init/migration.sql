-- CreateEnum
CREATE TYPE "Role" AS ENUM ('VOLUNTEER', 'INSTRUCTOR', 'COORDINATOR');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'PASSIVE');

-- CreateEnum
CREATE TYPE "TrainingStatus" AS ENUM ('PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('PENDING', 'ENROLLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CompletionStatus" AS ENUM ('NOT_COMPLETED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'LEFT_EARLY', 'ABSENT', 'EXCUSED');

-- CreateEnum
CREATE TYPE "ExamAttendanceStatus" AS ENUM ('ATTENDED', 'NOT_ATTENDED');

-- CreateEnum
CREATE TYPE "ExamResultStatus" AS ENUM ('PASSED', 'FAILED', 'NOT_EVALUATED');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('VALID', 'EXPIRING_SOON', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OperationStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('INVITED', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "AnnouncementStatus" AS ENUM ('ACTIVE', 'PASSIVE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "volunteerCode" TEXT NOT NULL,
    "nationalIdentityNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "phoneUpdatedAt" TIMESTAMP(3) NOT NULL,
    "cityId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VolunteerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstructorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "instructorCode" TEXT NOT NULL,
    "nationalIdentityNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstructorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoordinatorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coordinatorCode" TEXT NOT NULL,
    "nationalIdentityNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "responsibleRegionId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoordinatorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "level" INTEGER,
    "passingScore" INTEGER,
    "durationDays" INTEGER,
    "areaCode" TEXT,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "TrainingCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Training" (
    "id" TEXT NOT NULL,
    "trainingCode" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "durationDays" INTEGER,
    "capacity" INTEGER NOT NULL,
    "status" "TrainingStatus" NOT NULL DEFAULT 'PLANNED',
    "coordinatorId" TEXT,
    "primaryInstructorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Training_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingInstructor" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "TrainingInstructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingEnrollment" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "enrollmentStatus" "EnrollmentStatus" NOT NULL DEFAULT 'ENROLLED',
    "attendancePercentage" INTEGER,
    "completionStatus" "CompletionStatus" NOT NULL DEFAULT 'NOT_COMPLETED',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceSession" (
    "id" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "createdByInstructorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL,
    "attendanceSessionId" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "attendancePercentage" INTEGER,
    "note" TEXT,
    "enteredByInstructorId" TEXT,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "examCode" TEXT NOT NULL,
    "trainingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "examType" TEXT NOT NULL,
    "content" TEXT,
    "instructions" TEXT,
    "scope" TEXT,
    "learningObjectives" TEXT,
    "questionCount" INTEGER,
    "durationMinutes" INTEGER,
    "examDate" TIMESTAMP(3) NOT NULL,
    "cityId" TEXT,
    "location" TEXT,
    "maxScore" INTEGER NOT NULL DEFAULT 100,
    "passingScore" INTEGER NOT NULL DEFAULT 60,
    "responsibleInstructorId" TEXT,
    "createdByCoordinatorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamResult" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "attended" "ExamAttendanceStatus" NOT NULL DEFAULT 'NOT_ATTENDED',
    "score" INTEGER,
    "passed" BOOLEAN,
    "resultStatus" "ExamResultStatus" NOT NULL DEFAULT 'NOT_EVALUATED',
    "note" TEXT,
    "enteredByInstructorId" TEXT,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificateType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trainingCategoryId" TEXT,
    "validityMonths" INTEGER NOT NULL DEFAULT 36,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CertificateType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerCertificate" (
    "id" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "certificateTypeId" TEXT NOT NULL,
    "trainingId" TEXT,
    "area" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "status" "CertificateStatus" NOT NULL DEFAULT 'VALID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VolunteerCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstructorCertificate" (
    "id" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "certificateTypeId" TEXT NOT NULL,
    "area" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "status" "CertificateStatus" NOT NULL DEFAULT 'VALID',

    CONSTRAINT "InstructorCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstructorExpertise" (
    "id" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "trainingCategoryId" TEXT NOT NULL,
    "level" TEXT,

    CONSTRAINT "InstructorExpertise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cityId" TEXT,
    "regionId" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "status" "OperationStatus" NOT NULL DEFAULT 'ACTIVE',
    "requiredTrainingCategoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Operation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationAssignment" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "volunteerId" TEXT NOT NULL,
    "invitationStatus" "InvitationStatus" NOT NULL DEFAULT 'INVITED',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "OperationAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "cityId" TEXT,
    "regionId" TEXT,
    "trainingCategoryId" TEXT,
    "trainingId" TEXT,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "status" "AnnouncementStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldData" JSONB,
    "newData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Region_name_key" ON "Region"("name");

-- CreateIndex
CREATE UNIQUE INDEX "City_name_key" ON "City"("name");

-- CreateIndex
CREATE INDEX "City_regionId_idx" ON "City"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "VolunteerProfile_userId_key" ON "VolunteerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VolunteerProfile_volunteerCode_key" ON "VolunteerProfile"("volunteerCode");

-- CreateIndex
CREATE UNIQUE INDEX "VolunteerProfile_nationalIdentityNumber_key" ON "VolunteerProfile"("nationalIdentityNumber");

-- CreateIndex
CREATE INDEX "VolunteerProfile_cityId_idx" ON "VolunteerProfile"("cityId");

-- CreateIndex
CREATE INDEX "VolunteerProfile_regionId_idx" ON "VolunteerProfile"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "InstructorProfile_userId_key" ON "InstructorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InstructorProfile_instructorCode_key" ON "InstructorProfile"("instructorCode");

-- CreateIndex
CREATE UNIQUE INDEX "InstructorProfile_nationalIdentityNumber_key" ON "InstructorProfile"("nationalIdentityNumber");

-- CreateIndex
CREATE INDEX "InstructorProfile_cityId_idx" ON "InstructorProfile"("cityId");

-- CreateIndex
CREATE INDEX "InstructorProfile_regionId_idx" ON "InstructorProfile"("regionId");

-- CreateIndex
CREATE UNIQUE INDEX "CoordinatorProfile_userId_key" ON "CoordinatorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CoordinatorProfile_coordinatorCode_key" ON "CoordinatorProfile"("coordinatorCode");

-- CreateIndex
CREATE UNIQUE INDEX "CoordinatorProfile_nationalIdentityNumber_key" ON "CoordinatorProfile"("nationalIdentityNumber");

-- CreateIndex
CREATE INDEX "CoordinatorProfile_responsibleRegionId_idx" ON "CoordinatorProfile"("responsibleRegionId");

-- CreateIndex
CREATE INDEX "CoordinatorProfile_cityId_idx" ON "CoordinatorProfile"("cityId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingCategory_name_key" ON "TrainingCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Training_trainingCode_key" ON "Training"("trainingCode");

-- CreateIndex
CREATE INDEX "Training_categoryId_idx" ON "Training"("categoryId");

-- CreateIndex
CREATE INDEX "Training_cityId_idx" ON "Training"("cityId");

-- CreateIndex
CREATE INDEX "Training_regionId_idx" ON "Training"("regionId");

-- CreateIndex
CREATE INDEX "Training_status_idx" ON "Training"("status");

-- CreateIndex
CREATE INDEX "TrainingInstructor_instructorId_idx" ON "TrainingInstructor"("instructorId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingInstructor_trainingId_instructorId_key" ON "TrainingInstructor"("trainingId", "instructorId");

-- CreateIndex
CREATE INDEX "TrainingEnrollment_volunteerId_idx" ON "TrainingEnrollment"("volunteerId");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingEnrollment_trainingId_volunteerId_key" ON "TrainingEnrollment"("trainingId", "volunteerId");

-- CreateIndex
CREATE INDEX "AttendanceSession_trainingId_idx" ON "AttendanceSession"("trainingId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceSession_trainingId_sessionDate_key" ON "AttendanceSession"("trainingId", "sessionDate");

-- CreateIndex
CREATE INDEX "AttendanceRecord_volunteerId_idx" ON "AttendanceRecord"("volunteerId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_attendanceSessionId_volunteerId_key" ON "AttendanceRecord"("attendanceSessionId", "volunteerId");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_examCode_key" ON "Exam"("examCode");

-- CreateIndex
CREATE INDEX "Exam_trainingId_idx" ON "Exam"("trainingId");

-- CreateIndex
CREATE INDEX "Exam_responsibleInstructorId_idx" ON "Exam"("responsibleInstructorId");

-- CreateIndex
CREATE INDEX "ExamResult_volunteerId_idx" ON "ExamResult"("volunteerId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamResult_examId_volunteerId_key" ON "ExamResult"("examId", "volunteerId");

-- CreateIndex
CREATE UNIQUE INDEX "CertificateType_name_key" ON "CertificateType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "VolunteerCertificate_certificateNumber_key" ON "VolunteerCertificate"("certificateNumber");

-- CreateIndex
CREATE INDEX "VolunteerCertificate_volunteerId_idx" ON "VolunteerCertificate"("volunteerId");

-- CreateIndex
CREATE UNIQUE INDEX "InstructorCertificate_certificateNumber_key" ON "InstructorCertificate"("certificateNumber");

-- CreateIndex
CREATE INDEX "InstructorCertificate_instructorId_idx" ON "InstructorCertificate"("instructorId");

-- CreateIndex
CREATE UNIQUE INDEX "InstructorExpertise_instructorId_trainingCategoryId_key" ON "InstructorExpertise"("instructorId", "trainingCategoryId");

-- CreateIndex
CREATE INDEX "OperationAssignment_volunteerId_idx" ON "OperationAssignment"("volunteerId");

-- CreateIndex
CREATE UNIQUE INDEX "OperationAssignment_operationId_volunteerId_key" ON "OperationAssignment"("operationId", "volunteerId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerProfile" ADD CONSTRAINT "VolunteerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerProfile" ADD CONSTRAINT "VolunteerProfile_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerProfile" ADD CONSTRAINT "VolunteerProfile_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorProfile" ADD CONSTRAINT "InstructorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorProfile" ADD CONSTRAINT "InstructorProfile_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorProfile" ADD CONSTRAINT "InstructorProfile_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoordinatorProfile" ADD CONSTRAINT "CoordinatorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoordinatorProfile" ADD CONSTRAINT "CoordinatorProfile_responsibleRegionId_fkey" FOREIGN KEY ("responsibleRegionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoordinatorProfile" ADD CONSTRAINT "CoordinatorProfile_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Training" ADD CONSTRAINT "Training_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TrainingCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Training" ADD CONSTRAINT "Training_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Training" ADD CONSTRAINT "Training_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Training" ADD CONSTRAINT "Training_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "CoordinatorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Training" ADD CONSTRAINT "Training_primaryInstructorId_fkey" FOREIGN KEY ("primaryInstructorId") REFERENCES "InstructorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingInstructor" ADD CONSTRAINT "TrainingInstructor_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingInstructor" ADD CONSTRAINT "TrainingInstructor_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "InstructorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingEnrollment" ADD CONSTRAINT "TrainingEnrollment_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingEnrollment" ADD CONSTRAINT "TrainingEnrollment_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "VolunteerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_createdByInstructorId_fkey" FOREIGN KEY ("createdByInstructorId") REFERENCES "InstructorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_attendanceSessionId_fkey" FOREIGN KEY ("attendanceSessionId") REFERENCES "AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "VolunteerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_enteredByInstructorId_fkey" FOREIGN KEY ("enteredByInstructorId") REFERENCES "InstructorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_responsibleInstructorId_fkey" FOREIGN KEY ("responsibleInstructorId") REFERENCES "InstructorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_createdByCoordinatorId_fkey" FOREIGN KEY ("createdByCoordinatorId") REFERENCES "CoordinatorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "VolunteerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResult" ADD CONSTRAINT "ExamResult_enteredByInstructorId_fkey" FOREIGN KEY ("enteredByInstructorId") REFERENCES "InstructorProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificateType" ADD CONSTRAINT "CertificateType_trainingCategoryId_fkey" FOREIGN KEY ("trainingCategoryId") REFERENCES "TrainingCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerCertificate" ADD CONSTRAINT "VolunteerCertificate_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "VolunteerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerCertificate" ADD CONSTRAINT "VolunteerCertificate_certificateTypeId_fkey" FOREIGN KEY ("certificateTypeId") REFERENCES "CertificateType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VolunteerCertificate" ADD CONSTRAINT "VolunteerCertificate_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorCertificate" ADD CONSTRAINT "InstructorCertificate_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "InstructorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorCertificate" ADD CONSTRAINT "InstructorCertificate_certificateTypeId_fkey" FOREIGN KEY ("certificateTypeId") REFERENCES "CertificateType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorExpertise" ADD CONSTRAINT "InstructorExpertise_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "InstructorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructorExpertise" ADD CONSTRAINT "InstructorExpertise_trainingCategoryId_fkey" FOREIGN KEY ("trainingCategoryId") REFERENCES "TrainingCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_requiredTrainingCategoryId_fkey" FOREIGN KEY ("requiredTrainingCategoryId") REFERENCES "TrainingCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationAssignment" ADD CONSTRAINT "OperationAssignment_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationAssignment" ADD CONSTRAINT "OperationAssignment_volunteerId_fkey" FOREIGN KEY ("volunteerId") REFERENCES "VolunteerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_trainingCategoryId_fkey" FOREIGN KEY ("trainingCategoryId") REFERENCES "TrainingCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "Training"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
