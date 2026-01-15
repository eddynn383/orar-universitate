/**
 * @fileoverview API routes for managing individual schedule events by ID
 *
 * This module handles GET, PUT, and DELETE operations for specific schedule events.
 * Supports retrieving detailed event information including all relationships,
 * updating event properties with conflict checking, and deleting events.
 *
 * @module app/api/orar/[id]
 */

// app/api/orar/[id]/route.ts

import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
    successResponse,
    errorResponse,
    requireAuth,
    requireAdminOrSecretar,
    API_ERRORS
} from "@/lib/api-utils"
import { eventSchema } from "@/schemas/event"
import { z } from "zod"

/**
 * Route parameters type definition
 *
 * @typedef {Object} RouteParams
 * @property {Promise<{id: string}>} params - Route parameters containing event ID
 */
type RouteParams = {
    params: Promise<{ id: string }>
}

/**
 * GET /api/orar/{id}
 *
 * Retrieves comprehensive details for a specific schedule event including all associated
 * entities (teacher, discipline, classroom, groups, academic year) and audit information.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {RouteParams} params - Route parameters containing the event ID
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - id: Event ID
 *   - zi: Day of week
 *   - oraInceput: Start time
 *   - oraSfarsit: End time
 *   - durata: Duration in minutes
 *   - tipActivitate: Activity type (C/S/L/P)
 *   - frecventa: Recurrence pattern
 *   - semestru: Semester number
 *   - anUniversitar: Academic year details (id, period, published status)
 *   - ciclu: Learning cycle details
 *   - profesor: Full teacher details (name, grade, contact info)
 *   - disciplina: Discipline details with study year info
 *   - sala: Classroom details (name, building, capacity)
 *   - grupe: Array of associated groups
 *   - audit: Creation and modification metadata (user, timestamp)
 *
 * @throws {401} If user is not authenticated
 * @throws {404} If event with given ID does not exist
 * @throws {500} If database operation fails
 *
 * @requires Authentication
 *
 * @example
 * // Request: GET /api/orar/cm123...
 * // Response: {
 * //   success: true,
 * //   data: {
 * //     id: "cm123...",
 * //     zi: "LUNI",
 * //     oraInceput: "08:00",
 * //     oraSfarsit: "10:00",
 * //     profesor: { id: "...", nume: "Prof. Ion Popescu", email: "...", telefon: "..." },
 * //     disciplina: { id: "...", nume: "Matematică", anStudiu: 1 },
 * //     sala: { id: "...", nume: "A101", cladire: "Corp A" },
 * //     grupe: [{ id: "...", nume: "A1" }],
 * //     audit: { creatDe: {...}, creatLa: "...", modificatDe: {...}, modificatLa: "..." }
 * //   }
 * // }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    // Verifică autentificarea
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params

        const event = await prisma.event.findUnique({
            where: { id },
            include: {
                teacher: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        grade: true,
                        email: true,
                        phone: true
                    }
                },
                discipline: {
                    select: {
                        id: true,
                        name: true,
                        semester: true,
                        studyYear: {
                            select: {
                                id: true,
                                year: true,
                                learningType: {
                                    select: {
                                        id: true,
                                        learningCycle: true
                                    }
                                }
                            }
                        }
                    }
                },
                classroom: {
                    select: {
                        id: true,
                        name: true,
                        building: true,
                        capacity: true
                    }
                },
                groups: {
                    select: {
                        group: {
                            select: {
                                id: true,
                                name: true,
                                semester: true,
                                studyYear: {
                                    select: {
                                        year: true
                                    }
                                }
                            }
                        }
                    }
                },
                learnings: {
                    select: {
                        id: true,
                        learningCycle: true
                    }
                },
                academicYear: {
                    select: {
                        id: true,
                        start: true,
                        end: true,
                        published: true
                    }
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                updatedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        })

        if (!event) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        // Transformă datele pentru răspuns
        const transformedEvent = {
            id: event.id,
            zi: event.day,
            oraInceput: event.startHour,
            oraSfarsit: event.endHour,
            durata: event.duration,
            tipActivitate: event.eventType,
            frecventa: event.eventRecurrence,
            semestru: event.semester,
            anUniversitar: event.academicYear ? {
                id: event.academicYear.id,
                perioada: `${event.academicYear.start}-${event.academicYear.end}`,
                publicat: event.academicYear.published
            } : null,
            ciclu: event.learnings ? {
                id: event.learnings.id,
                nume: event.learnings.learningCycle
            } : null,
            profesor: event.teacher ? {
                id: event.teacher.id,
                nume: `${event.teacher.grade || ''} ${event.teacher.firstname} ${event.teacher.lastname}`.trim(),
                prenume: event.teacher.firstname,
                numeFamilie: event.teacher.lastname,
                grad: event.teacher.grade,
                email: event.teacher.email,
                telefon: event.teacher.phone
            } : null,
            disciplina: event.discipline ? {
                id: event.discipline.id,
                nume: event.discipline.name,
                semestru: event.discipline.semester,
                anStudiu: event.discipline.studyYear?.year,
                ciclu: event.discipline.studyYear?.learningType?.learningCycle
            } : null,
            sala: event.classroom ? {
                id: event.classroom.id,
                nume: event.classroom.name,
                cladire: event.classroom.building,
                capacitate: event.classroom.capacity
            } : null,
            grupe: event.groups.map(g => ({
                id: g.group.id,
                nume: g.group.name,
                semestru: g.group.semester,
                anStudiu: g.group.studyYear?.year
            })),
            audit: {
                creatDe: event.createdBy ? {
                    id: event.createdBy.id,
                    nume: event.createdBy.name,
                    email: event.createdBy.email
                } : null,
                creatLa: event.createdAt,
                modificatDe: event.updatedBy ? {
                    id: event.updatedBy.id,
                    nume: event.updatedBy.name,
                    email: event.updatedBy.email
                } : null,
                modificatLa: event.updatedAt
            }
        }

        return successResponse(transformedEvent)

    } catch (error) {
        console.error("API Error:", error)
        return errorResponse(
            API_ERRORS.INTERNAL_ERROR.message,
            API_ERRORS.INTERNAL_ERROR.status,
            API_ERRORS.INTERNAL_ERROR.code
        )
    }
}

/**
 * PUT /api/orar/{id}
 *
 * Updates an existing schedule event with new data.
 * Validates the updated data and checks for scheduling conflicts (excluding the current event).
 * Updates group associations by removing old ones and creating new ones.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {RouteParams} params - Route parameters containing the event ID
 *
 * @body {Object} [request.body] - Event update data (all fields optional)
 * @body {string} [request.body.zi] - New day of week
 * @body {string} [request.body.oraInceput] - New start time
 * @body {string} [request.body.oraSfarsit] - New end time
 * @body {string} [request.body.tipActivitate] - New activity type
 * @body {string} [request.body.frecventa] - New recurrence pattern
 * @body {number} [request.body.semestru] - New semester
 * @body {string} [request.body.anUniversitarId] - New academic year ID
 * @body {string} [request.body.cicluId] - New learning type ID
 * @body {string} [request.body.profesorId] - New teacher ID
 * @body {string} [request.body.disciplinaId] - New discipline ID
 * @body {string} [request.body.salaId] - New classroom ID
 * @body {string[]} [request.body.grupeIds] - New array of group IDs
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - success: true
 *   - data: { id, message }
 *
 * @throws {400} If validation fails
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not an admin or secretary
 * @throws {404} If event does not exist
 * @throws {409} If updated schedule creates conflicts
 * @throws {500} If database operation fails
 *
 * @requires Admin or Secretary role
 *
 * @example
 * // Request: PUT /api/orar/cm123...
 * // Body: { "zi": "MARTI", "oraInceput": "10:00", "oraSfarsit": "12:00" }
 * // Response: {
 * //   success: true,
 * //   data: { id: "cm123...", message: "Eveniment actualizat cu succes" }
 * // }
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    // Verifică autorizarea
    const authResult = await requireAdminOrSecretar()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params
        const body = await request.json()

        // Verifică dacă evenimentul există
        const existingEvent = await prisma.event.findUnique({
            where: { id }
        })

        if (!existingEvent) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        // Mapare din format API în format intern
        const mappedData = {
            day: body.zi || existingEvent.day,
            startHour: body.oraInceput || existingEvent.startHour,
            endHour: body.oraSfarsit || existingEvent.endHour,
            eventType: body.tipActivitate || existingEvent.eventType,
            eventRecurrence: body.frecventa || existingEvent.eventRecurrence,
            semester: (body.semestru || existingEvent.semester).toString(),
            academicYearId: body.anUniversitarId || existingEvent.academicYearId,
            learningId: body.cicluId || existingEvent.learningId,
            teacherId: body.profesorId || existingEvent.teacherId,
            disciplineId: body.disciplinaId || existingEvent.disciplineId,
            classroomId: body.salaId || existingEvent.classroomId,
            groupIds: body.grupeIds || []
        }

        // Validare
        const validation = eventSchema.safeParse(mappedData)

        if (!validation.success) {
            return errorResponse(
                "Eroare de validare: " + JSON.stringify(z.flattenError(validation.error).fieldErrors),
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Verifică conflicte (excluzând evenimentul curent)
        const conflicts = await checkScheduleConflictsForUpdate(id, validation.data)
        if (conflicts.length > 0) {
            return errorResponse(
                `Conflict de orar detectat: ${conflicts.join(", ")}`,
                API_ERRORS.CONFLICT.status,
                API_ERRORS.CONFLICT.code
            )
        }

        const { groupIds, duration, ...eventData } = validation.data

        // Actualizează evenimentul
        const event = await prisma.event.update({
            where: { id },
            data: {
                ...eventData,
                groups: {
                    deleteMany: {},
                    create: groupIds.map(groupId => ({ groupId }))
                },
                updatedById: authResult.user.id
            }
        })

        return successResponse({
            id: event.id,
            message: "Eveniment actualizat cu succes"
        })

    } catch (error) {
        console.error("API Error:", error)
        return errorResponse(
            API_ERRORS.INTERNAL_ERROR.message,
            API_ERRORS.INTERNAL_ERROR.status,
            API_ERRORS.INTERNAL_ERROR.code
        )
    }
}

/**
 * DELETE /api/orar/{id}
 *
 * Deletes a schedule event from the timetable.
 * Associated group relations are automatically deleted via cascade.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {RouteParams} params - Route parameters containing the event ID
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - success: true
 *   - data: { id, message }
 *
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not an admin or secretary
 * @throws {404} If event does not exist
 * @throws {500} If database operation fails
 *
 * @requires Admin or Secretary role
 *
 * @example
 * // Request: DELETE /api/orar/cm123...
 * // Response: {
 * //   success: true,
 * //   data: { id: "cm123...", message: "Eveniment șters cu succes" }
 * // }
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    // Verifică autorizarea
    const authResult = await requireAdminOrSecretar()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params

        // Verifică dacă evenimentul există
        const existingEvent = await prisma.event.findUnique({
            where: { id }
        })

        if (!existingEvent) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        // Șterge evenimentul (grupele se șterg automat prin cascade)
        await prisma.event.delete({
            where: { id }
        })

        return successResponse({
            id,
            message: "Eveniment șters cu succes"
        })

    } catch (error) {
        console.error("API Error:", error)
        return errorResponse(
            API_ERRORS.INTERNAL_ERROR.message,
            API_ERRORS.INTERNAL_ERROR.status,
            API_ERRORS.INTERNAL_ERROR.code
        )
    }
}

/**
 * Checks for scheduling conflicts when updating an event.
 *
 * Similar to checkScheduleConflicts but excludes the current event from conflict detection.
 * This allows updating an event without it conflicting with itself.
 *
 * @async
 * @param {string} excludeEventId - The ID of the event being updated (to exclude from checks)
 * @param {Object} data - The updated event data to check for conflicts
 * @param {string} data.day - Day of week
 * @param {string} data.startHour - Start time in HH:MM format
 * @param {string} data.endHour - End time in HH:MM format
 * @param {number} data.semester - Semester number
 * @param {string} data.academicYearId - Academic year ID
 * @param {string} data.teacherId - Teacher ID
 * @param {string} data.classroomId - Classroom ID
 * @param {string} data.learningId - Learning type ID
 * @param {string} [data.eventRecurrence] - Recurrence pattern (toate/para/impara)
 *
 * @returns {Promise<string[]>} Array of conflict messages (empty if no conflicts)
 *
 * @example
 * const conflicts = await checkScheduleConflictsForUpdate("cm123...", {
 *   day: "MARTI",
 *   startHour: "10:00",
 *   endHour: "12:00",
 *   semester: 1,
 *   academicYearId: "cm456...",
 *   teacherId: "cm789...",
 *   classroomId: "cm012...",
 *   learningId: "cm345...",
 *   eventRecurrence: "toate"
 * })
 */
async function checkScheduleConflictsForUpdate(
    excludeEventId: string,
    data: {
        day: string
        startHour: string
        endHour: string
        semester: number
        academicYearId: string
        teacherId: string
        classroomId: string
        learningId: string
        eventRecurrence?: string
    }
): Promise<string[]> {
    const conflicts: string[] = []

    // Verifică conflict pentru profesor
    const teacherConflict = await prisma.event.findFirst({
        where: {
            id: { not: excludeEventId },
            teacherId: data.teacherId,
            academicYearId: data.academicYearId,
            semester: data.semester,
            day: data.day as any,
            OR: [
                {
                    AND: [
                        { startHour: { lte: data.startHour } },
                        { endHour: { gt: data.startHour } }
                    ]
                },
                {
                    AND: [
                        { startHour: { lt: data.endHour } },
                        { endHour: { gte: data.endHour } }
                    ]
                },
                {
                    AND: [
                        { startHour: { gte: data.startHour } },
                        { endHour: { lte: data.endHour } }
                    ]
                }
            ]
        }
    })

    if (teacherConflict) {
        if (data.eventRecurrence === "toate" ||
            teacherConflict.eventRecurrence === "toate" ||
            data.eventRecurrence === teacherConflict.eventRecurrence) {
            conflicts.push(`Profesorul este ocupat în intervalul ${teacherConflict.startHour}-${teacherConflict.endHour}`)
        }
    }

    // Verifică conflict pentru sală
    const classroomConflict = await prisma.event.findFirst({
        where: {
            id: { not: excludeEventId },
            classroomId: data.classroomId,
            academicYearId: data.academicYearId,
            semester: data.semester,
            day: data.day as any,
            OR: [
                {
                    AND: [
                        { startHour: { lte: data.startHour } },
                        { endHour: { gt: data.startHour } }
                    ]
                },
                {
                    AND: [
                        { startHour: { lt: data.endHour } },
                        { endHour: { gte: data.endHour } }
                    ]
                },
                {
                    AND: [
                        { startHour: { gte: data.startHour } },
                        { endHour: { lte: data.endHour } }
                    ]
                }
            ]
        }
    })

    if (classroomConflict) {
        if (data.eventRecurrence === "toate" ||
            classroomConflict.eventRecurrence === "toate" ||
            data.eventRecurrence === classroomConflict.eventRecurrence) {
            conflicts.push(`Sala este ocupată în intervalul ${classroomConflict.startHour}-${classroomConflict.endHour}`)
        }
    }

    return conflicts
}