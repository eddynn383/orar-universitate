// types/entities.ts
// Shared entity types - safe to import in client components
// These mirror the Prisma schema but don't import from Prisma client

// DEPRECATED - folosit doar pentru compatibilitate
export type Teacher = {
    id: string
    firstname: string
    lastname: string
    grade: string | null
    title: string | null
    email: string
    phone: string | null
    image: string | null
}

export type Classroom = {
    id: string
    name: string
    building: string | null
    capacity: number | null
}

export type Group = {
    id: string
    name: string
    studyYearId: string
    learningTypeId: string | null
    semester: number
}

export type Discipline = {
    id: string
    name: string
    professorId: string | null
    teacherId: string | null // DEPRECATED
    learningTypeId: string | null
    studyYearId: string
    semester: number
}

export type LearningType = {
    id: string
    learningCycle: string
}

export type StudyYear = {
    id: string
    year: number
    learningTypeId: string
}

export type AcademicYear = {
    id: string
    start: number
    end: number
}

export type Event = {
    id: string
    day: string
    startHour: string
    endHour: string
    eventType: string
    eventRecurrence: string | null
    semester: number
    academicYearId: string
    learningId: string
    teacherId: string
    disciplineId: string
    classroomId: string
    groupId: string
    createdAt: Date
    updatedAt: Date
}

// User extins cu câmpuri pentru profesor și student
export type User = {
    id: string
    name: string | null
    email: string | null
    role: string
    image: string | null
    phone: string | null
    address: string | null
    city: string | null
    country: string | null
    bio: string | null

    // Câmpuri pentru PROFESOR
    firstname: string | null
    lastname: string | null
    title: string | null
    grade: string | null

    // Câmpuri pentru STUDENT
    publicId: string | null
    sex: string | null
    cnpEncrypted: string | null
    birthDate: Date | null
    birthPlace: string | null
    ethnicity: string | null
    religion: string | null
    citizenship: string | null
    maritalStatus: string | null
    socialSituation: string | null
    isOrphan: boolean | null
    needsSpecialConditions: boolean | null
    parentsNames: string | null
    residentialAddress: string | null
    specialMedicalCondition: string | null
    disability: string | null
    groupId: string | null

    createdAt: Date
    updatedAt: Date
}

// Profesor extins cu relații
export type UserProfessor = User & {
    role: 'PROFESOR'
    teachingDisciplines?: Discipline[]
}

// Student extins cu relații
export type UserStudent = User & {
    role: 'STUDENT'
    group?: Group
    grades?: Grade[]
    studentDisciplines?: StudentDiscipline[]
}

// Material de curs
export type CourseMaterial = {
    id: string
    title: string
    description: string | null
    disciplineId: string
    fileUrl: string
    fileName: string
    fileSize: number | null
    mimeType: string | null
    category: string
    isPublished: boolean
    uploadedById: string
    createdAt: Date
    updatedAt: Date
}

// Examen
export type Exam = {
    id: string
    title: string
    description: string | null
    disciplineId: string
    examDate: Date
    duration: number | null
    location: string | null
    examType: string
    maxScore: number
    instructions: string | null
    notes: string | null
    isPublished: boolean
    createdById: string
    createdAt: Date
    updatedAt: Date
}

// Notă
export type Grade = {
    id: string
    value: number
    gradeType: string
    date: Date
    feedback: string | null
    userId: string | null // Student
    studentId: string | null // DEPRECATED
    disciplineId: string
    examId: string | null
    professorId: string | null // Profesor care a dat nota
    createdAt: Date
    updatedAt: Date
}

// Asignare student-disciplină
export type StudentDiscipline = {
    id: string
    userId: string | null
    studentId: string | null // DEPRECATED
    disciplineId: string
    enrolledAt: Date
}