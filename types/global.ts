// types/global.ts
export type UserRole = "ADMIN" | "SECRETAR" | "PROFESOR" | "STUDENT" | "USER"

export const DAYS = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri'] as const
export type Day = typeof DAYS[number]

export const PRISMA_DAYS = ['LUNI', 'MARTI', 'MIERCURI', 'JOI', 'VINERI'] as const
export type PrismaDay = typeof PRISMA_DAYS[number]

export const TIME_SLOTS = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
] as const
export type TimeSlot = typeof TIME_SLOTS[number]

// Audit user type
export type AuditUser = {
    id: string
    name: string | null
    email: string | null
    image: string | null
} | null

// CalendarEntry - formatul folosit de componenta Calendar
// Aliniat cu schema Prisma Event (many-to-many cu groups)
export interface CalendarEntry {
    id: string
    day: PrismaDay
    startHour: TimeSlot
    endHour: TimeSlot
    duration: number
    subject: string
    teacher: string
    room: string
    type: 'C' | 'S' | 'L' | 'P'
    groups: string[] // Group names for display
    weekType: 'toate' | 'para' | 'impara'
    // IDs for editing - populated from relations
    teacherId?: string
    disciplineId?: string
    classroomId?: string
    groupIds?: string[] // Group IDs for editing (many-to-many)
    studyYearId: string
    // Audit info
    createdBy?: AuditUser
    createdAt?: Date | string
    updatedBy?: AuditUser
    updatedAt?: Date | string
}

// Mapare zile din Prisma enum la Calendar display
export const DAY_PRISMA_TO_DISPLAY: Record<PrismaDay, Day> = {
    'LUNI': 'Luni',
    'MARTI': 'Marți',
    'MIERCURI': 'Miercuri',
    'JOI': 'Joi',
    'VINERI': 'Vineri',
}

export const DAY_DISPLAY_TO_PRISMA: Record<Day, PrismaDay> = {
    'Luni': 'LUNI',
    'Marți': 'MARTI',
    'Miercuri': 'MIERCURI',
    'Joi': 'JOI',
    'Vineri': 'VINERI',
}

// LearningType with study years
export type LearningTypeWithStudyYears = {
    id: string
    learningCycle: string
    studyYears: { id: string; year: number }[]
}