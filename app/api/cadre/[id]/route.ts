/**
 * @fileoverview API routes for managing individual teaching staff by ID
 *
 * This module handles GET, PUT, and DELETE operations for specific teachers.
 * Supports retrieving detailed information including all associated disciplines and recent events,
 * updating teacher properties, and deleting teachers with dependency checks.
 *
 * @module app/api/cadre/[id]
 */

// app/api/cadre/[id]/route.ts

import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
    successResponse,
    errorResponse,
    requireAuth,
    requireAdmin,
    API_ERRORS
} from "@/lib/api-utils"
import { teacherSchema } from "@/schemas/teacher"
import { z } from "zod"

/**
 * Route parameters type definition
 *
 * @typedef {Object} RouteParams
 * @property {Promise<{id: string}>} params - Route parameters containing teacher ID
 */
type RouteParams = {
    params: Promise<{ id: string }>
}

/**
 * GET /api/cadre/{id}
 *
 * Retrieves detailed information about a specific teacher including all associated
 * disciplines with their study year and cycle information, recent events, and statistics.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {RouteParams} params - Route parameters containing the teacher ID
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - id: Teacher ID
 *   - nume: Full name with grade
 *   - prenume: First name
 *   - numeFamilie: Last name
 *   - grad: Academic grade
 *   - titlu: Academic title
 *   - email: Email address
 *   - telefon: Phone number
 *   - imagine: Profile image URL
 *   - discipline: Array of all associated disciplines with details
 *   - evenimenteRecente: Array of up to 10 recent events
 *   - statistici: Statistics (numarEvenimente, numarDiscipline)
 *   - createdAt: Creation timestamp
 *   - updatedAt: Last update timestamp
 *
 * @throws {401} If user is not authenticated
 * @throws {404} If teacher with given ID does not exist
 * @throws {500} If database operation fails
 *
 * @requires Authentication
 *
 * @example
 * // Request: GET /api/cadre/cm123...
 * // Response: {
 * //   success: true,
 * //   data: {
 * //     id: "cm123...",
 * //     nume: "Prof. dr. Ion Popescu",
 * //     prenume: "Ion",
 * //     numeFamilie: "Popescu",
 * //     email: "ion.popescu@...",
 * //     discipline: [{id: "...", nume: "Programare Web", semestru: 1, ...}],
 * //     evenimenteRecente: [...],
 * //     statistici: { numarEvenimente: 45, numarDiscipline: 3 },
 * //     ...
 * //   }
 * // }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params

        const teacher = await prisma.teacher.findUnique({
            where: { id },
            include: {
                disciplines: {
                    include: {
                        studyYear: {
                            include: {
                                learningType: true
                            }
                        }
                    }
                },
                events: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        discipline: true,
                        classroom: true,
                        academicYear: true
                    }
                },
                _count: {
                    select: {
                        events: true,
                        disciplines: true
                    }
                }
            }
        })

        if (!teacher) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        const transformed = {
            id: teacher.id,
            nume: `${teacher.grade || ''} ${teacher.firstname} ${teacher.lastname}`.trim(),
            prenume: teacher.firstname,
            numeFamilie: teacher.lastname,
            grad: teacher.grade,
            titlu: teacher.title,
            email: teacher.email,
            telefon: teacher.phone,
            imagine: teacher.image,
            discipline: teacher.disciplines.map(d => ({
                id: d.id,
                nume: d.name,
                semestru: d.semester,
                anStudiu: d.studyYear?.year,
                ciclu: d.studyYear?.learningType?.learningCycle
            })),
            evenimenteRecente: teacher.events.map(e => ({
                id: e.id,
                zi: e.day,
                oraInceput: e.startHour,
                oraSfarsit: e.endHour,
                disciplina: e.discipline?.name,
                sala: e.classroom?.name,
                anUniversitar: e.academicYear ? `${e.academicYear.start}-${e.academicYear.end}` : null
            })),
            statistici: {
                numarEvenimente: teacher._count.events,
                numarDiscipline: teacher._count.disciplines
            },
            createdAt: teacher.createdAt,
            updatedAt: teacher.updatedAt
        }

        return successResponse(transformed)

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
 * PUT /api/cadre/{id}
 *
 * Updates an existing teacher's information.
 * Validates all fields and prevents duplicate email addresses.
 * The updating user's ID is automatically recorded.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {RouteParams} params - Route parameters containing the teacher ID
 *
 * @body {Object} [request.body] - Teacher update data (all fields optional)
 * @body {string} [request.body.prenume] - New first name
 * @body {string} [request.body.numeFamilie] - New last name
 * @body {string} [request.body.email] - New email address (must be unique)
 * @body {string} [request.body.telefon] - New phone number
 * @body {string} [request.body.grad] - New academic grade
 * @body {string} [request.body.titlu] - New academic title
 * @body {string} [request.body.imagine] - New profile image URL
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - success: true
 *   - data: { id, message }
 *
 * @throws {400} If validation fails
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not an admin
 * @throws {404} If teacher does not exist
 * @throws {409} If updated email already exists for another teacher
 * @throws {500} If database operation fails
 *
 * @requires Admin role
 *
 * @example
 * // Request: PUT /api/cadre/cm123...
 * // Body: { "grad": "Conf. dr.", "telefon": "0712345678" }
 * // Response: {
 * //   success: true,
 * //   data: { id: "cm123...", message: "Cadru didactic actualizat cu succes" }
 * // }
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAdmin()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params
        const body = await request.json()

        const existing = await prisma.teacher.findUnique({ where: { id } })
        if (!existing) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        const mappedData = {
            firstname: body.prenume ?? existing.firstname,
            lastname: body.numeFamilie ?? existing.lastname,
            email: body.email ?? existing.email,
            phone: body.telefon ?? existing.phone,
            grade: body.grad ?? existing.grade,
            title: body.titlu ?? existing.title,
            image: body.imagine ?? existing.image
        }

        const validation = teacherSchema.safeParse(mappedData)

        if (!validation.success) {
            return errorResponse(
                "Eroare de validare: " + JSON.stringify(z.flattenError(validation.error).fieldErrors),
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Verifică dacă noul email este folosit de alt cadru
        if (body.email && body.email !== existing.email) {
            const emailExists = await prisma.teacher.findFirst({
                where: { email: body.email, id: { not: id } }
            })
            if (emailExists) {
                return errorResponse(
                    "Această adresă de email este deja folosită",
                    API_ERRORS.CONFLICT.status,
                    API_ERRORS.CONFLICT.code
                )
            }
        }

        await prisma.teacher.update({
            where: { id },
            data: {
                ...validation.data,
                updatedById: authResult.user.id
            }
        })

        return successResponse({
            id,
            message: "Cadru didactic actualizat cu succes"
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
 * DELETE /api/cadre/{id}
 *
 * Deletes a teacher if they have no dependencies (events).
 * Prevents deletion if the teacher is assigned to any events.
 * Note: Disciplines are not checked as they can exist without a teacher.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {RouteParams} params - Route parameters containing the teacher ID
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - success: true
 *   - data: { id, message }
 *
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not an admin
 * @throws {404} If teacher does not exist
 * @throws {409} If teacher has associated events
 * @throws {500} If database operation fails
 *
 * @requires Admin role
 *
 * @example
 * // Request: DELETE /api/cadre/cm123...
 * // Response: {
 * //   success: true,
 * //   data: { id: "cm123...", message: "Cadru didactic șters cu succes" }
 * // }
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAdmin()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params

        const existing = await prisma.teacher.findUnique({
            where: { id },
            include: {
                _count: { select: { events: true } }
            }
        })

        if (!existing) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        if (existing._count.events > 0) {
            return errorResponse(
                `Nu se poate șterge cadrul didactic. Are ${existing._count.events} evenimente asociate.`,
                API_ERRORS.CONFLICT.status,
                API_ERRORS.CONFLICT.code
            )
        }

        await prisma.teacher.delete({ where: { id } })

        return successResponse({
            id,
            message: "Cadru didactic șters cu succes"
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