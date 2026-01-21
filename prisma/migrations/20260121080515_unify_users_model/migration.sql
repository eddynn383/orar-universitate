/*
  Warnings:

  - The primary key for the `student_disciplines` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[disciplineId,userId]` on the table `student_disciplines` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[disciplineId,studentId]` on the table `student_disciplines` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[publicId]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `student_disciplines` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE', 'VOICE');

-- CreateEnum
CREATE TYPE "AttachmentType" AS ENUM ('IMAGE', 'FILE', 'VOICE');

-- AlterTable
ALTER TABLE "disciplines" ADD COLUMN     "professorId" TEXT,
ALTER COLUMN "teacherId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "grades" ADD COLUMN     "examId" TEXT,
ADD COLUMN     "feedback" TEXT,
ADD COLUMN     "professorId" TEXT,
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "studentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "replyToId" TEXT,
ADD COLUMN     "type" "MessageType" NOT NULL DEFAULT 'TEXT';

-- AlterTable
ALTER TABLE "student_disciplines" DROP CONSTRAINT "student_disciplines_pkey",
ADD COLUMN     "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "studentId" DROP NOT NULL,
ADD CONSTRAINT "student_disciplines_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "birthPlace" TEXT,
ADD COLUMN     "citizenship" TEXT,
ADD COLUMN     "cnpEncrypted" TEXT,
ADD COLUMN     "disability" "Disability" DEFAULT 'NONE',
ADD COLUMN     "ethnicity" TEXT,
ADD COLUMN     "firstname" TEXT,
ADD COLUMN     "grade" TEXT,
ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "isOrphan" BOOLEAN DEFAULT false,
ADD COLUMN     "lastname" TEXT,
ADD COLUMN     "maritalStatus" TEXT,
ADD COLUMN     "needsSpecialConditions" BOOLEAN DEFAULT false,
ADD COLUMN     "parentsNames" TEXT,
ADD COLUMN     "publicId" TEXT,
ADD COLUMN     "religion" TEXT,
ADD COLUMN     "residentialAddress" TEXT,
ADD COLUMN     "sex" "Sex",
ADD COLUMN     "socialSituation" TEXT,
ADD COLUMN     "specialMedicalCondition" TEXT,
ADD COLUMN     "title" TEXT;

-- CreateTable
CREATE TABLE "course_materials" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "disciplineId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Curs',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exams" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "disciplineId" TEXT NOT NULL,
    "examDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "location" TEXT,
    "examType" TEXT NOT NULL DEFAULT 'Examen',
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "instructions" TEXT,
    "notes" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_attachments" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "type" "AttachmentType" NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "duration" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_reactions" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_materials_disciplineId_idx" ON "course_materials"("disciplineId");

-- CreateIndex
CREATE INDEX "course_materials_uploadedById_idx" ON "course_materials"("uploadedById");

-- CreateIndex
CREATE INDEX "exams_disciplineId_idx" ON "exams"("disciplineId");

-- CreateIndex
CREATE INDEX "exams_examDate_idx" ON "exams"("examDate");

-- CreateIndex
CREATE INDEX "exams_createdById_idx" ON "exams"("createdById");

-- CreateIndex
CREATE INDEX "message_attachments_messageId_idx" ON "message_attachments"("messageId");

-- CreateIndex
CREATE INDEX "message_reactions_messageId_idx" ON "message_reactions"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "message_reactions_messageId_userId_emoji_key" ON "message_reactions"("messageId", "userId", "emoji");

-- CreateIndex
CREATE INDEX "grades_userId_disciplineId_idx" ON "grades"("userId", "disciplineId");

-- CreateIndex
CREATE INDEX "grades_examId_idx" ON "grades"("examId");

-- CreateIndex
CREATE UNIQUE INDEX "student_disciplines_disciplineId_userId_key" ON "student_disciplines"("disciplineId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "student_disciplines_disciplineId_studentId_key" ON "student_disciplines"("disciplineId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "users_publicId_key" ON "users"("publicId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disciplines" ADD CONSTRAINT "disciplines_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_disciplines" ADD CONSTRAINT "student_disciplines_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_materials" ADD CONSTRAINT "course_materials_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "disciplines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_materials" ADD CONSTRAINT "course_materials_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "disciplines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
