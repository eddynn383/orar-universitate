// app/api/orar/route.ts

import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
    successResponse,
    errorResponse,
    requireAuth,
    requireAdminOrSecretar,
    parseQueryParams,
    API_ERRORS
} from "@/lib/api-utils"
import { eventSchema } from "@/schemas/event"
import { z } from "zod"

/**
 * GET /api/orar
 * Returnează lista completă a intrărilor din orar
 * 
 * Query params:
 * - page: numărul paginii (default: 1)
 * - limit: numărul de rezultate per pagină (default: 50, max: 100)
 * - an: anul de studiu (1, 2, 3)
 * - ciclu: tipul de învățământ (licenta, master)
 * - semestru: semestrul (1, 2)
 * - grupa: ID-ul sau numele grupei
 * - profesor: ID-ul profesorului
 * - disciplina: ID-ul disciplinei
 * - sala: ID-ul sălii
 * - zi: ziua săptămânii (LUNI, MARTI, etc.)
 * - anUniversitar: anul universitar (ex: "2024-2025")
 * 
 * Requires: Authenticated user
 */
export async function GET(request: NextRequest) {
    // Verifică autentificarea
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { searchParams } = new URL(request.url)
        const params = parseQueryParams(searchParams)

        // Construiește where clause pentru filtrare
        const where: any = {}

        // Filtrare după an universitar
        if (params.anUniversitar) {
            const [start, end] = params.anUniversitar.split("-").map(Number)
            const academicYear = await prisma.academicYear.findFirst({
                where: { start, end }
            })
            if (academicYear) {
                where.academicYearId = academicYear.id
            }
        }

        // Filtrare după ciclu (learning type)
        if (params.ciclu) {
            const learningType = await prisma.learningType.findFirst({
                where: {
                    learningCycle: {
                        equals: params.ciclu.charAt(0).toUpperCase() + params.ciclu.slice(1),
                        mode: 'insensitive'
                    }
                }
            })
            if (learningType) {
                where.learningId = learningType.id
            }
        }

        // Filtrare după semestru
        if (params.semestru) {
            where.semester = params.semestru
        }

        // Filtrare după an de studiu (prin discipline)
        if (params.an) {
            where.discipline = {
                studyYear: {
                    year: params.an
                }
            }
        }

        // Filtrare după profesor
        if (params.profesor) {
            where.teacherId = params.profesor
        }

        // Filtrare după disciplină
        if (params.disciplina) {
            where.disciplineId = params.disciplina
        }

        // Filtrare după sală
        if (params.sala) {
            where.classroomId = params.sala
        }

        // Filtrare după zi
        if (params.zi) {
            where.day = params.zi.toUpperCase()
        }

        // Filtrare după grupă
        if (params.grupa) {
            where.groups = {
                some: {
                    groupId: params.grupa
                }
            }
        }

        // Calculează total pentru paginare
        const total = await prisma.event.count({ where })

        // Fetch events cu paginare
        const events = await prisma.event.findMany({
            where,
            include: {
                teacher: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        grade: true,
                        email: true
                    }
                },
                discipline: {
                    select: {
                        id: true,
                        name: true,
                        studyYear: {
                            select: {
                                id: true,
                                year: true
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
                        end: true
                    }
                }
            },
            orderBy: [
                { day: 'asc' },
                { startHour: 'asc' }
            ],
            skip: (params.page - 1) * params.limit,
            take: params.limit
        })

        // Transformă datele pentru răspuns
        const transformedEvents = events.map(event => ({
            id: event.id,
            zi: event.day,
            oraInceput: event.startHour,
            oraSfarsit: event.endHour,
            durata: event.duration,
            tipActivitate: event.eventType,
            frecventa: event.eventRecurrence,
            semestru: event.semester,
            anUniversitar: event.academicYear ? `${event.academicYear.start}-${event.academicYear.end}` : null,
            ciclu: event.learnings?.learningCycle,
            profesor: event.teacher ? {
                id: event.teacher.id,
                nume: `${event.teacher.grade || ''} ${event.teacher.firstname} ${event.teacher.lastname}`.trim(),
                email: event.teacher.email
            } : null,
            disciplina: event.discipline ? {
                id: event.discipline.id,
                nume: event.discipline.name,
                anStudiu: event.discipline.studyYear?.year
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
                anStudiu: g.group.studyYear?.year
            })),
            createdAt: event.createdAt,
            updatedAt: event.updatedAt
        }))

        return successResponse(transformedEvents, {
            total,
            page: params.page,
            limit: params.limit,
            totalPages: Math.ceil(total / params.limit)
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
 * POST /api/orar
 * Creează o nouă intrare în orar
 * 
 * Body:
 * {
 *   zi: "LUNI" | "MARTI" | "MIERCURI" | "JOI" | "VINERI",
 *   oraInceput: "08:00",
 *   oraSfarsit: "10:00",
 *   tipActivitate: "C" | "S" | "L" | "P",
 *   frecventa: "toate" | "para" | "impara",
 *   semestru: 1 | 2,
 *   anUniversitarId: "...",
 *   cicluId: "...",
 *   profesorId: "...",
 *   disciplinaId: "...",
 *   salaId: "...",
 *   grupeIds: ["...", "..."]
 * }
 * 
 * Requires: ADMIN or SECRETAR role
 */
export async function POST(request: NextRequest) {
    // Verifică autorizarea (admin sau secretar)
    const authResult = await requireAdminOrSecretar()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const body = await request.json()

        // Mapare din format API în format intern
        const mappedData = {
            day: body.zi,
            startHour: body.oraInceput,
            endHour: body.oraSfarsit,
            eventType: body.tipActivitate,
            eventRecurrence: body.frecventa || "toate",
            semester: body.semestru?.toString(),
            academicYearId: body.anUniversitarId,
            learningId: body.cicluId,
            teacherId: body.profesorId,
            disciplineId: body.disciplinaId,
            classroomId: body.salaId,
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

        // Verifică conflicte de orar (opțional - pentru același profesor sau sală)
        const conflicts = await checkScheduleConflicts(validation.data)
        if (conflicts.length > 0) {
            return errorResponse(
                `Conflict de orar detectat: ${conflicts.join(", ")}`,
                API_ERRORS.CONFLICT.status,
                API_ERRORS.CONFLICT.code
            )
        }

        const { groupIds, duration, ...eventData } = validation.data

        // Creează evenimentul
        const event = await prisma.event.create({
            data: {
                ...eventData,
                groups: {
                    create: groupIds.map(groupId => ({ groupId }))
                },
                createdById: authResult.user.id,
                updatedById: authResult.user.id
            },
            include: {
                teacher: true,
                discipline: { include: { studyYear: true } },
                classroom: true,
                groups: { include: { group: true } },
                learnings: true,
                academicYear: true
            }
        })

        return successResponse({
            id: event.id,
            message: "Eveniment creat cu succes"
        }, undefined, 201)

    } catch (error) {
        console.error("API Error:", error)
        return errorResponse(
            API_ERRORS.INTERNAL_ERROR.message,
            API_ERRORS.INTERNAL_ERROR.status,
            API_ERRORS.INTERNAL_ERROR.code
        )
    }
}

// Helper pentru verificarea conflictelor de orar
async function checkScheduleConflicts(data: {
    day: string
    startHour: string
    endHour: string
    semester: number
    academicYearId: string
    teacherId: string
    classroomId: string
    learningId: string
    eventRecurrence?: string
}): Promise<string[]> {
    const conflicts: string[] = []

    // Verifică conflict pentru profesor
    const teacherConflict = await prisma.event.findFirst({
        where: {
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
        },
        include: { teacher: true }
    })

    if (teacherConflict) {
        // Verifică dacă conflictul este real (săptămâni diferite pot coexista)
        if (data.eventRecurrence === "toate" ||
            teacherConflict.eventRecurrence === "toate" ||
            data.eventRecurrence === teacherConflict.eventRecurrence) {
            conflicts.push(`Profesorul este ocupat în intervalul ${teacherConflict.startHour}-${teacherConflict.endHour}`)
        }
    }

    // Verifică conflict pentru sală
    const classroomConflict = await prisma.event.findFirst({
        where: {
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
        },
        include: { classroom: true }
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