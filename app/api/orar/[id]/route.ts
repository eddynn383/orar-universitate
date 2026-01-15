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

type RouteParams = {
    params: Promise<{ id: string }>
}

/**
 * GET /api/orar/{id}
 * Returnează detaliile pentru o înregistrare specifică
 * 
 * Requires: Authenticated user
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
 * Actualizează o intrare existentă
 * 
 * Body: Same as POST /api/orar
 * 
 * Requires: ADMIN or SECRETAR role
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
 * Șterge o intrare de orar
 * 
 * Requires: ADMIN or SECRETAR role
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

// Helper pentru verificarea conflictelor la update (exclude evenimentul curent)
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