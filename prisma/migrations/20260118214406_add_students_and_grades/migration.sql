/*
  Warnings:

  - The values [STUDENT] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `createdById` on the `grades` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `grades` table. All the data in the column will be lost.
  - You are about to drop the column `nota` on the `grades` table. All the data in the column will be lost.
  - You are about to drop the column `observatii` on the `grades` table. All the data in the column will be lost.
  - You are about to drop the column `tipNota` on the `grades` table. All the data in the column will be lost.
  - You are about to drop the column `enrolledAt` on the `student_disciplines` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `student_disciplines` table. All the data in the column will be lost.
  - You are about to drop the column `adresaResidenta` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `alergii` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `anAdmitere` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `bursa` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `cetatenie` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `cnp` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `contactUrgentaNume` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `contactUrgentaRelatie` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `contactUrgentaTelefon` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `dizabilitate` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `etnie` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `judetResidenta` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `necesitaCSE` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `nrMatricol` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `numeMama` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `numeTata` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `orasResidenta` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `religie` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `situatieSociala` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `stareCivila` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `stareMedicala` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `statusOrfan` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `studyYearId` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `taraDomiciliu` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `telefonTutor` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `tipBursa` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `tutoreLegal` on the `students` table. All the data in the column will be lost.
  - You are about to drop the `attendances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_documents` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[publicId]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `gradeType` to the `grades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `grades` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cnpEncrypted` to the `students` table without a default value. This is not possible if the table is not empty.
  - Added the required column `publicId` to the `students` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Disability" AS ENUM ('NONE', 'GRAD_1', 'GRAD_2');

-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('ADMIN', 'SECRETAR', 'PROFESOR', 'USER');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;

-- DropForeignKey
ALTER TABLE "attendances" DROP CONSTRAINT "attendances_eventId_fkey";

-- DropForeignKey
ALTER TABLE "attendances" DROP CONSTRAINT "attendances_studentId_fkey";

-- DropForeignKey
ALTER TABLE "grades" DROP CONSTRAINT "grades_createdById_fkey";

-- DropForeignKey
ALTER TABLE "student_documents" DROP CONSTRAINT "student_documents_studentId_fkey";

-- DropForeignKey
ALTER TABLE "student_documents" DROP CONSTRAINT "student_documents_uploadedById_fkey";

-- DropForeignKey
ALTER TABLE "students" DROP CONSTRAINT "students_studyYearId_fkey";

-- DropIndex
DROP INDEX "students_cnp_key";

-- DropIndex
DROP INDEX "students_nrMatricol_key";

-- AlterTable
ALTER TABLE "grades" DROP COLUMN "createdById",
DROP COLUMN "data",
DROP COLUMN "nota",
DROP COLUMN "observatii",
DROP COLUMN "tipNota",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "gradeType" TEXT NOT NULL,
ADD COLUMN     "value" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "student_disciplines" DROP COLUMN "enrolledAt",
DROP COLUMN "status";

-- AlterTable
ALTER TABLE "students" DROP COLUMN "adresaResidenta",
DROP COLUMN "alergii",
DROP COLUMN "anAdmitere",
DROP COLUMN "bursa",
DROP COLUMN "cetatenie",
DROP COLUMN "cnp",
DROP COLUMN "contactUrgentaNume",
DROP COLUMN "contactUrgentaRelatie",
DROP COLUMN "contactUrgentaTelefon",
DROP COLUMN "dizabilitate",
DROP COLUMN "etnie",
DROP COLUMN "judetResidenta",
DROP COLUMN "necesitaCSE",
DROP COLUMN "nrMatricol",
DROP COLUMN "numeMama",
DROP COLUMN "numeTata",
DROP COLUMN "orasResidenta",
DROP COLUMN "phone",
DROP COLUMN "religie",
DROP COLUMN "situatieSociala",
DROP COLUMN "stareCivila",
DROP COLUMN "stareMedicala",
DROP COLUMN "status",
DROP COLUMN "statusOrfan",
DROP COLUMN "studyYearId",
DROP COLUMN "taraDomiciliu",
DROP COLUMN "telefonTutor",
DROP COLUMN "tipBursa",
DROP COLUMN "tutoreLegal",
ADD COLUMN     "citizenship" TEXT NOT NULL DEFAULT 'Română',
ADD COLUMN     "cnpEncrypted" TEXT NOT NULL,
ADD COLUMN     "disability" "Disability" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "ethnicity" TEXT,
ADD COLUMN     "isOrphan" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maritalStatus" TEXT NOT NULL DEFAULT 'Necăsătorit/ă',
ADD COLUMN     "needsSpecialConditions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentsNames" TEXT,
ADD COLUMN     "publicId" TEXT NOT NULL,
ADD COLUMN     "religion" TEXT,
ADD COLUMN     "residentialAddress" TEXT,
ADD COLUMN     "socialSituation" TEXT,
ADD COLUMN     "specialMedicalCondition" TEXT;

-- DropTable
DROP TABLE "attendances";

-- DropTable
DROP TABLE "student_documents";

-- DropEnum
DROP TYPE "AttendanceStatus";

-- DropEnum
DROP TYPE "Dizabilitate";

-- DropEnum
DROP TYPE "EnrollmentStatus";

-- DropEnum
DROP TYPE "SituatieSociala";

-- DropEnum
DROP TYPE "StareCivila";

-- DropEnum
DROP TYPE "StudentStatus";

-- DropEnum
DROP TYPE "TipBursa";

-- DropEnum
DROP TYPE "TipNota";

-- CreateIndex
CREATE UNIQUE INDEX "students_publicId_key" ON "students"("publicId");
