/*
  Warnings:

  - You are about to drop the column `groupId` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `interval` on the `events` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `groups` table. All the data in the column will be lost.
  - You are about to drop the column `learningType` on the `groups` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `learning_types` table. All the data in the column will be lost.
  - You are about to drop the column `academicYearId` on the `study_years` table. All the data in the column will be lost.
  - You are about to drop the column `department` on the `teachers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[start,end]` on the table `academic_years` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[learningCycle]` on the table `learning_types` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[learningTypeId,year]` on the table `study_years` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email,phone]` on the table `teachers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `disciplines` table without a default value. This is not possible if the table is not empty.
  - Added the required column `disciplineId` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endHour` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `eventType` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startHour` to the `events` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `learningCycle` on the `learning_types` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MASCULIN', 'FEMININ');

-- CreateEnum
CREATE TYPE "StareCivila" AS ENUM ('NECASATORIT', 'CASATORIT', 'DIVORTAT', 'VADUV');

-- CreateEnum
CREATE TYPE "SituatieSociala" AS ENUM ('NORMALA', 'RISC_SOCIAL', 'PROTECTIE_SPECIALA');

-- CreateEnum
CREATE TYPE "Dizabilitate" AS ENUM ('NU', 'GRAD_1', 'GRAD_2', 'GRAD_3');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIV', 'SUSPENDAT', 'RETRAS', 'ABSOLVENT', 'EXMATRICULAT');

-- CreateEnum
CREATE TYPE "TipBursa" AS ENUM ('MERIT', 'SOCIALA', 'PERFORMANTA', 'MERIT_SI_SOCIALA');

-- CreateEnum
CREATE TYPE "TipNota" AS ENUM ('EXAMEN', 'COLOCVIU', 'LABORATOR', 'SEMINAR', 'PROIECT', 'REFERAT', 'ACTIVITATE');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIV', 'PROMOVAT', 'RESTANTA', 'NEPROMOVAT');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PREZENT', 'ABSENT', 'MOTIVAT', 'INTARZIERE');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'STUDENT';

-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_groupId_fkey";

-- DropForeignKey
ALTER TABLE "study_years" DROP CONSTRAINT "study_years_academicYearId_fkey";

-- DropIndex
DROP INDEX "events_classroomId_day_interval_idx";

-- DropIndex
DROP INDEX "events_day_interval_idx";

-- DropIndex
DROP INDEX "events_teacherId_day_interval_idx";

-- DropIndex
DROP INDEX "study_years_academicYearId_learningTypeId_year_key";

-- DropIndex
DROP INDEX "teachers_email_key";

-- AlterTable
ALTER TABLE "classrooms" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "updatedById" TEXT;

-- AlterTable
ALTER TABLE "disciplines" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "learningTypeId" TEXT,
ADD COLUMN     "semester" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedById" TEXT;

-- AlterTable
ALTER TABLE "events" DROP COLUMN "groupId",
DROP COLUMN "interval",
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "disciplineId" TEXT NOT NULL,
ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "endHour" TEXT NOT NULL,
ADD COLUMN     "eventRecurrence" TEXT,
ADD COLUMN     "eventType" TEXT NOT NULL,
ADD COLUMN     "semester" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "startHour" TEXT NOT NULL,
ADD COLUMN     "updatedById" TEXT;

-- AlterTable
ALTER TABLE "groups" DROP COLUMN "department",
DROP COLUMN "learningType",
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "group" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "learningTypeId" TEXT,
ADD COLUMN     "semester" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "updatedById" TEXT;

-- AlterTable
ALTER TABLE "learning_types" DROP COLUMN "department",
DROP COLUMN "learningCycle",
ADD COLUMN     "learningCycle" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "study_years" DROP COLUMN "academicYearId";

-- AlterTable
ALTER TABLE "teachers" DROP COLUMN "department",
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "updatedById" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "address" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "phone" TEXT;

-- DropEnum
DROP TYPE "Department";

-- DropEnum
DROP TYPE "LearningCycle";

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "nrMatricol" TEXT NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "sex" "Sex" NOT NULL,
    "cnp" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "birthPlace" TEXT NOT NULL,
    "etnie" TEXT,
    "religie" TEXT,
    "cetatenie" TEXT NOT NULL DEFAULT 'Română',
    "stareCivila" "StareCivila" NOT NULL DEFAULT 'NECASATORIT',
    "situatieSociala" "SituatieSociala",
    "statusOrfan" BOOLEAN NOT NULL DEFAULT false,
    "necesitaCSE" BOOLEAN NOT NULL DEFAULT false,
    "numeTata" TEXT,
    "numeMama" TEXT,
    "tutoreLegal" TEXT,
    "telefonTutor" TEXT,
    "adresaResidenta" TEXT,
    "orasResidenta" TEXT,
    "judetResidenta" TEXT,
    "taraDomiciliu" TEXT DEFAULT 'România',
    "stareMedicala" TEXT,
    "dizabilitate" "Dizabilitate" NOT NULL DEFAULT 'NU',
    "alergii" TEXT,
    "studyYearId" TEXT NOT NULL,
    "groupId" TEXT,
    "anAdmitere" INTEGER NOT NULL,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIV',
    "bursa" BOOLEAN NOT NULL DEFAULT false,
    "tipBursa" "TipBursa",
    "contactUrgentaNume" TEXT,
    "contactUrgentaTelefon" TEXT,
    "contactUrgentaRelatie" TEXT,
    "image" TEXT,
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_documents" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "tipDocument" TEXT NOT NULL,
    "numeDocument" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT,

    CONSTRAINT "student_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_disciplines" (
    "studentId" TEXT NOT NULL,
    "disciplineId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIV',

    CONSTRAINT "student_disciplines_pkey" PRIMARY KEY ("studentId","disciplineId")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "disciplineId" TEXT NOT NULL,
    "nota" DOUBLE PRECISION NOT NULL,
    "tipNota" "TipNota" NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observatii" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PREZENT',
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observatii" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_groups" (
    "eventId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "event_groups_pkey" PRIMARY KEY ("eventId","groupId")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_nrMatricol_key" ON "students"("nrMatricol");

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_cnp_key" ON "students"("cnp");

-- CreateIndex
CREATE INDEX "grades_studentId_disciplineId_idx" ON "grades"("studentId", "disciplineId");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_studentId_eventId_data_key" ON "attendances"("studentId", "eventId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_start_end_key" ON "academic_years"("start", "end");

-- CreateIndex
CREATE INDEX "events_day_startHour_idx" ON "events"("day", "startHour");

-- CreateIndex
CREATE INDEX "events_teacherId_day_startHour_idx" ON "events"("teacherId", "day", "startHour");

-- CreateIndex
CREATE INDEX "events_classroomId_day_startHour_idx" ON "events"("classroomId", "day", "startHour");

-- CreateIndex
CREATE UNIQUE INDEX "learning_types_learningCycle_key" ON "learning_types"("learningCycle");

-- CreateIndex
CREATE UNIQUE INDEX "study_years_learningTypeId_year_key" ON "study_years"("learningTypeId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_email_phone_key" ON "teachers"("email", "phone");

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers" ADD CONSTRAINT "teachers_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_studyYearId_fkey" FOREIGN KEY ("studyYearId") REFERENCES "study_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disciplines" ADD CONSTRAINT "disciplines_learningTypeId_fkey" FOREIGN KEY ("learningTypeId") REFERENCES "learning_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disciplines" ADD CONSTRAINT "disciplines_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disciplines" ADD CONSTRAINT "disciplines_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_disciplines" ADD CONSTRAINT "student_disciplines_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_disciplines" ADD CONSTRAINT "student_disciplines_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "disciplines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "disciplines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "disciplines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_learningTypeId_fkey" FOREIGN KEY ("learningTypeId") REFERENCES "learning_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_groups" ADD CONSTRAINT "event_groups_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_groups" ADD CONSTRAINT "event_groups_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
