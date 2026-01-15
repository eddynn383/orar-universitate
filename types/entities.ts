// types/entities.ts
// Shared entity types - safe to import in client components
// These mirror the Prisma schema but don't import from Prisma client

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
    learningTypeId: string
}

export type Discipline = {
    id: string
    name: string
    shortName: string | null
    teacherId: string
    learningTypeId: string
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

export type User = {
    id: string
    name: string | null
    email: string
    role: string
    image: string | null
}