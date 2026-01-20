/**
 * @fileoverview API routes for managing university schedules (Orar)
 *
 * This module handles CRUD operations for schedule events, which represent
 * scheduled classes/activities in the university timetable. Each event includes
 * information about timing, location (classroom), teacher, discipline, groups,
 * and recurrence patterns. The module also implements schedule conflict detection
 * to prevent double-booking of teachers or classrooms.
 *
 * @module app/api/orar
 */

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
 *
 * Retrieves a paginated list of schedule events with comprehensive filtering options.
 * Events represent scheduled classes/activities including lectures, seminars, labs, and practicals.
 * Each event includes detailed information about the teacher, discipline, classroom, groups, and timing.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 *
 * @query {number} [page=1] - Page number for pagination
 * @query {number} [limit=50] - Number of items per page (max: 100)
 * @query {string} [anUniversitar] - Filter by academic year (e.g., "2024-2025")
 * @query {string} [ciclu] - Filter by learning type/cycle name (case-insensitive)
 * @query {number} [semestru] - Filter by semester (1 or 2)
 * @query {number} [an] - Filter by study year number (1-6)
 * @query {string} [profesor] - Filter by teacher ID
 * @query {string} [disciplina] - Filter by discipline ID
 * @query {string} [sala] - Filter by classroom ID
 * @query {string} [zi] - Filter by day of week (LUNI, MARTI, MIERCURI, JOI, VINERI)
 * @query {string} [grupa] - Filter by group ID
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - data: Array of event objects with:
 *     - id: Event ID
 *     - zi: Day of week
 *     - oraInceput: Start time (HH:MM format)
 *     - oraSfarsit: End time (HH:MM format)
 *     - durata: Duration in minutes
 *     - tipActivitate: Activity type (C=Curs/Lecture, S=Seminar, L=Laborator/Lab, P=Proiect/Practical)
 *     - frecventa: Recurrence pattern (toate=every week, para=even weeks, impara=odd weeks)
 *     - semestru: Semester number
 *     - anUniversitar: Academic year string
 *     - ciclu: Learning cycle name
 *     - profesor: Teacher details (id, name, email)
 *     - disciplina: Discipline details (id, name, study year)
 *     - sala: Classroom details (id, name, building, capacity)
 *     - grupe: Array of associated groups
 *     - createdAt: Creation timestamp
 *     - updatedAt: Last update timestamp
 *   - meta: Pagination metadata (total, page, limit, totalPages)
 *
 * @throws {401} If user is not authenticated
 * @throws {500} If database operation fails
 *
 * @requires Authentication
 *
 * @example
 * // Request: GET /api/orar?an=1&ciclu=licenta&semestru=1&zi=LUNI&page=1&limit=10
 * // Response: {
 * //   success: true,
 * //   data: [{
 * //     id: "...",
 * //     zi: "LUNI",
 * //     oraInceput: "08:00",
 * //     oraSfarsit: "10:00",
 * //     tipActivitate: "C",
 * //     frecventa: "toate",
 * //     profesor: { id: "...", nume: "Prof. Ion Popescu", email: "..." },
 * //     disciplina: { id: "...", nume: "Matematică", anStudiu: 1 },
 * //     sala: { id: "...", nume: "A101", cladire: "Corp A" },
 * //     grupe: [{ id: "...", nume: "A1", anStudiu: 1 }]
 * //   }],
 * //   meta: { total: 25, page: 1, limit: 10, totalPages: 3 }
 * // }
 */
export async function GET(request: NextRequest) {
    // Verifică autentificarea
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    const userRole = authResult.user.role
    const userId = authResult.user.id

    try {
        const { searchParams } = new URL(request.url)
        const params = parseQueryParams(searchParams)

        // Construiește where clause pentru filtrare
        const where: any = {}

        // Filtrare bazată pe rol și status
        if (userRole === "STUDENT") {
            // Studenții văd doar evenimentele publicate
            where.status = "PUBLISHED"
        } else if (userRole === "PROFESOR") {
            // Profesorii văd propriile evenimente (orice status) SAU evenimente publicate
            // Vom găsi mai întâi profesorul asociat cu userId
            const teacher = await prisma.teacher.findFirst({
                where: {
                    OR: [
                        { createdById: userId },
                        { email: authResult.user.email }
                    ]
                }
            })

            if (teacher) {
                where.OR = [
                    { status: "PUBLISHED" },
                    { teacherId: teacher.id }
                ]
            } else {
                // Dacă nu există un profesor asociat, vezi doar evenimentele publicate
                where.status = "PUBLISHED"
            }
        }
        // ADMIN și SECRETAR văd toate evenimentele (nu adăugăm filtru de status)

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
            status: event.status,
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
            approvedAt: event.approvedAt,
            publishedAt: event.publishedAt,
            rejectionReason: event.rejectionReason,
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
 *
 * Creates a new schedule event in the university timetable.
 * Validates the event data and checks for scheduling conflicts (teacher or classroom double-booking)
 * before creating the event. Automatically associates the event with specified student groups.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 *
 * @body {Object} request.body - The event data
 * @body {string} request.body.zi - Day of week (LUNI, MARTI, MIERCURI, JOI, VINERI)
 * @body {string} request.body.oraInceput - Start time in HH:MM format (e.g., "08:00")
 * @body {string} request.body.oraSfarsit - End time in HH:MM format (e.g., "10:00")
 * @body {string} request.body.tipActivitate - Activity type (C=Lecture, S=Seminar, L=Lab, P=Practical)
 * @body {string} [request.body.frecventa="toate"] - Recurrence (toate=all weeks, para=even weeks, impara=odd weeks)
 * @body {number} request.body.semestru - Semester (1 or 2)
 * @body {string} request.body.anUniversitarId - Academic year ID (must exist)
 * @body {string} request.body.cicluId - Learning type/cycle ID (must exist)
 * @body {string} request.body.profesorId - Teacher ID (must exist)
 * @body {string} request.body.disciplinaId - Discipline ID (must exist)
 * @body {string} request.body.salaId - Classroom ID (must exist)
 * @body {string[]} [request.body.grupeIds=[]] - Array of group IDs to associate with this event
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - success: true
 *   - data: { id, message }
 *
 * @throws {400} If validation fails (invalid time format, missing required fields)
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not an admin or secretary
 * @throws {409} If schedule conflict detected (teacher or classroom already booked)
 * @throws {500} If database operation fails
 *
 * @requires Admin or Secretary role
 *
 * @example
 * // Request: POST /api/orar
 * // Body: {
 * //   "zi": "LUNI",
 * //   "oraInceput": "08:00",
 * //   "oraSfarsit": "10:00",
 * //   "tipActivitate": "C",
 * //   "frecventa": "toate",
 * //   "semestru": 1,
 * //   "anUniversitarId": "cm123...",
 * //   "cicluId": "cm456...",
 * //   "profesorId": "cm789...",
 * //   "disciplinaId": "cm012...",
 * //   "salaId": "cm345...",
 * //   "grupeIds": ["cm678...", "cm901..."]
 * // }
 * // Response: {
 * //   success: true,
 * //   data: { id: "cm234...", message: "Eveniment creat cu succes" }
 * // }
 */
export async function POST(request: NextRequest) {
    // Verifică autorizarea (admin, secretar sau profesor)
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    const userRole = authResult.user.role

    // Profesorii pot crea evenimente, dar ele intră în workflow de aprobare
    if (!["ADMIN", "SECRETAR", "PROFESOR"].includes(userRole)) {
        return errorResponse(
            "Nu aveți permisiunea de a crea evenimente",
            403,
            "FORBIDDEN"
        )
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

        // Determină statusul inițial bazat pe rol
        let initialStatus: "DRAFT" | "PENDING_APPROVAL" | "PUBLISHED" = "DRAFT"
        const eventCreateData: any = {
            ...eventData,
            createdById: authResult.user.id,
            updatedById: authResult.user.id
        }

        if (userRole === "ADMIN") {
            // Administratorii pot publica direct
            initialStatus = "PUBLISHED"
            eventCreateData.status = "PUBLISHED"
            eventCreateData.publishedById = authResult.user.id
            eventCreateData.publishedAt = new Date()
        } else if (userRole === "PROFESOR") {
            // Profesorii creează evenimente care necesită aprobare
            initialStatus = "PENDING_APPROVAL"
            eventCreateData.status = "PENDING_APPROVAL"
        } else if (userRole === "SECRETAR") {
            // Secretarii pot crea evenimente publicate direct sau drafturi
            // Default este PENDING_APPROVAL, dar pot publica direct dacă doresc
            initialStatus = body.publishDirect ? "PUBLISHED" : "PENDING_APPROVAL"
            eventCreateData.status = initialStatus
            if (body.publishDirect) {
                eventCreateData.publishedById = authResult.user.id
                eventCreateData.publishedAt = new Date()
            }
        }

        // Creează evenimentul
        const event = await prisma.event.create({
            data: {
                ...eventCreateData,
                groups: {
                    create: groupIds.map(groupId => ({ groupId }))
                }
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

        const message = initialStatus === "PUBLISHED"
            ? "Eveniment creat și publicat cu succes"
            : initialStatus === "PENDING_APPROVAL"
            ? "Eveniment creat și trimis spre aprobare"
            : "Eveniment creat ca draft"

        return successResponse({
            id: event.id,
            status: initialStatus,
            message
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

/**
 * Checks for scheduling conflicts with existing events.
 *
 * Verifies that neither the teacher nor the classroom are already booked
 * for the specified time slot, day, semester, and academic year. Takes into
 * account the recurrence pattern (toate/para/impara) to avoid false conflicts
 * between alternating weeks.
 *
 * @async
 * @param {Object} data - The event data to check for conflicts
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
 * const conflicts = await checkScheduleConflicts({
 *   day: "LUNI",
 *   startHour: "08:00",
 *   endHour: "10:00",
 *   semester: 1,
 *   academicYearId: "cm123...",
 *   teacherId: "cm456...",
 *   classroomId: "cm789...",
 *   learningId: "cm012...",
 *   eventRecurrence: "toate"
 * })
 * // Returns: [] if no conflicts, or ["Profesorul este ocupat în intervalul 08:00-10:00"] if conflict exists
 */
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