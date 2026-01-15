// lib/event-utils.ts

import { CalendarEntry, PRISMA_DAYS, TIME_SLOTS } from "@/types/global"

// Type pentru audit user
type AuditUser = {
    id: string
    name: string | null
    email: string | null
    image: string | null
} | null

// Type pentru event-ul cu relații din Prisma (many-to-many cu groups)
type EventWithRelations = {
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
    studyYearId?: string
    teacher: {
        id: string
        firstname: string
        lastname: string
        grade: string | null
    } | null
    discipline: {
        id: string
        name: string
    } | null
    classroom: {
        id: string
        name: string
        building: string | null
    } | null
    // Many-to-many relation through EventGroup - can be different structures
    groups?: Array<{
        group?: {
            id: string
            name: string
        }
        // Or direct group properties if flattened
        id?: string
        name?: string
        groupId?: string
    }>
    // Audit fields
    createdBy?: AuditUser
    createdById?: string | null
    updatedBy?: AuditUser
    updatedById?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
}

/**
 * Transformă un eveniment din DB în formatul CalendarEntry
 */
export function transformEventToCalendarEntry(event: EventWithRelations): CalendarEntry {
    const startHourNum = parseInt(event.startHour.split(':')[0], 10)
    const endHourNum = parseInt(event.endHour.split(':')[0], 10)
    const duration = endHourNum - startHourNum

    // Build teacher name safely
    const teacherName = event.teacher
        ? `${event.teacher.grade || ''} ${event.teacher.firstname} ${event.teacher.lastname}`.trim()
        : ''

    // Build room name safely
    const roomName = event.classroom
        ? event.classroom.building
            ? `${event.classroom.name} (${event.classroom.building})`
            : event.classroom.name
        : ''

    // Extract groups from many-to-many relation - handle different structures
    let groupNames: string[] = []
    let groupIds: string[] = []

    if (event.groups && Array.isArray(event.groups)) {
        event.groups.forEach(eg => {
            // Structure 1: { group: { id, name } } (nested from include)
            if (eg.group && eg.group.id && eg.group.name) {
                groupIds.push(eg.group.id)
                groupNames.push(eg.group.name)
            }
            // Structure 2: { id, name } (direct properties)
            else if (eg.id && eg.name && !eg.groupId) {
                groupIds.push(eg.id)
                groupNames.push(eg.name)
            }
            // Structure 3: { groupId, ... } with separate group data
            else if (eg.groupId) {
                groupIds.push(eg.groupId)
            }
        })
    }

    return {
        id: event.id,
        day: event.day as typeof PRISMA_DAYS[number],
        startHour: event.startHour as typeof TIME_SLOTS[number],
        endHour: event.endHour as typeof TIME_SLOTS[number],
        duration,
        subject: event.discipline?.name || 'Necunoscut',
        type: event.eventType as 'C' | 'S' | 'L' | 'P',
        teacher: teacherName,
        room: roomName,
        groups: groupNames,
        weekType: (event.eventRecurrence as 'toate' | 'para' | 'impara') || 'toate',
        // Include IDs for editing
        teacherId: event.teacherId,
        disciplineId: event.disciplineId,
        classroomId: event.classroomId,
        studyYearId: "",
        groupIds,
        // Audit info
        createdBy: event.createdBy || null,
        createdAt: event.createdAt,
        updatedBy: event.updatedBy || null,
        updatedAt: event.updatedAt,
    }
}

/**
 * Transformă o listă de evenimente din DB în formatul CalendarEntry[]
 */
export function transformEventsToCalendarEntries(events: EventWithRelations[]): CalendarEntry[] {
    return events.map(transformEventToCalendarEntry)
}