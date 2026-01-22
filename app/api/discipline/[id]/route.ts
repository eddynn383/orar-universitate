/**
 * @fileoverview API routes for managing individual disciplines by ID
 *
 * This module handles GET, PUT, and DELETE operations for specific academic disciplines.
 * Supports retrieving detailed information including teacher and study year associations,
 * updating discipline properties, and deleting disciplines with dependency checks.
 *
 * @module app/api/discipline/[id]
 */

// app/api/discipline/[id]/route.ts

import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
    successResponse,
    errorResponse,
    requireAuth,
    requireAdmin,
    API_ERRORS
} from "@/lib/api-utils"
import { disciplineSchema } from "@/schemas/discipline"
import { z } from "zod"

/**
 * Route parameters type definition
 *
 * @typedef {Object} RouteParams
 * @property {Promise<{id: string}>} params - Route parameters containing discipline ID
 */
type RouteParams = {
    params: Promise<{ id: string }>
}

/**
 * GET /api/discipline/{id}
 *
 * Retrieves detailed information about a specific discipline including
 * teacher details, study year, learning cycle, and event statistics.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {RouteParams} params - Route parameters containing the discipline ID
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - id: Discipline ID
 *   - nume: Discipline name
 *   - semestru: Semester (1 or 2)
 *   - anStudiu: Study year number
 *   - anStudiuId: Study year ID
 *   - ciclu: Learning cycle name
 *   - cicluId: Learning cycle ID
 *   - profesor: Teacher object with id, full name, and email (or null)
 *   - numarEvenimente: Number of associated events
 *   - createdAt: Creation timestamp
 *   - updatedAt: Last update timestamp
 *
 * @throws {401} If user is not authenticated
 * @throws {404} If discipline with given ID does not exist
 * @throws {500} If database operation fails
 *
 * @requires Authentication
 *
 * @example
 * // Request: GET /api/discipline/cm123...
 * // Response: {
 * //   success: true,
 * //   data: {
 * //     id: "cm123...",
 * //     nume: "Programare Web",
 * //     semestru: 1,
 * //     anStudiu: 2,
 * //     ciclu: "Licență",
 * //     profesor: { id: "...", nume: "Prof. dr. Ion Popescu", email: "ion.popescu@..." },
 * //     numarEvenimente: 24,
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

        const discipline = await prisma.discipline.findUnique({
            where: { id },
            include: {
                teacher: {
                    include: {
                        user: {
                            select: {
                                firstname: true,
                                lastname: true
                            }
                        }
                    }
                },
                studyYear: {
                    include: { learningType: true }
                },
                learningType: true,
                _count: { select: { events: true } }
            }
        })

        if (!discipline) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        const transformed = {
            id: discipline.id,
            nume: discipline.name,
            semestru: discipline.semester,
            anStudiu: discipline.studyYear?.year,
            anStudiuId: discipline.studyYearId,
            ciclu: discipline.learningType?.learningCycle || discipline.studyYear?.learningType?.learningCycle,
            cicluId: discipline.learningTypeId,
            profesor: discipline.teacher ? {
                id: discipline.teacher.id,
                nume: `${discipline.teacher.grade || ''} ${discipline.teacher.user?.firstname} ${discipline.teacher.user?.lastname}`.trim(),
                email: discipline.teacher.email
            } : null,
            numarEvenimente: discipline._count.events,
            createdAt: discipline.createdAt,
            updatedAt: discipline.updatedAt
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
 * PUT /api/discipline/{id}
 *
 * Updates an existing discipline's properties.
 * Validates all fields and updates associations with teachers, study years, and learning cycles.
 * The updating user's ID is automatically recorded.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {RouteParams} params - Route parameters containing the discipline ID
 *
 * @body {Object} [request.body] - Discipline update data (all fields optional)
 * @body {string} [request.body.nume] - New discipline name
 * @body {number} [request.body.semestru] - New semester (1 or 2)
 * @body {string} [request.body.profesorId] - New teacher ID (can be null)
 * @body {string} [request.body.anStudiuId] - New study year ID
 * @body {string} [request.body.cicluId] - New learning cycle ID
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - success: true
 *   - data: { id, message }
 *
 * @throws {400} If validation fails
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not an admin
 * @throws {404} If discipline does not exist
 * @throws {500} If database operation fails
 *
 * @requires Admin role
 *
 * @example
 * // Request: PUT /api/discipline/cm123...
 * // Body: { "nume": "Programare Web Avansată", "semestru": 2 }
 * // Response: {
 * //   success: true,
 * //   data: { id: "cm123...", message: "Disciplină actualizată cu succes" }
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

        const existing = await prisma.discipline.findUnique({ where: { id } })
        if (!existing) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        const mappedData = {
            name: body.nume ?? existing.name,
            semester: (body.semestru ?? existing.semester).toString(),
            teacherId: body.profesorId ?? existing.teacherId,
            studyYearId: body.anStudiuId ?? existing.studyYearId,
            learningTypeId: body.cicluId ?? existing.learningTypeId
        }

        const validation = disciplineSchema.safeParse(mappedData)

        if (!validation.success) {
            return errorResponse(
                "Eroare de validare: " + JSON.stringify(z.flattenError(validation.error).fieldErrors),
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        await prisma.discipline.update({
            where: { id },
            data: {
                ...validation.data,
                updatedById: authResult.user.id
            }
        })

        return successResponse({
            id,
            message: "Disciplină actualizată cu succes"
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
 * DELETE /api/discipline/{id}
 *
 * Deletes a discipline if it has no dependencies (events).
 * Prevents deletion if the discipline is being used by any events in the schedule.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {RouteParams} params - Route parameters containing the discipline ID
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - success: true
 *   - data: { id, message }
 *
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not an admin
 * @throws {404} If discipline does not exist
 * @throws {409} If discipline has associated events
 * @throws {500} If database operation fails
 *
 * @requires Admin role
 *
 * @example
 * // Request: DELETE /api/discipline/cm123...
 * // Response: {
 * //   success: true,
 * //   data: { id: "cm123...", message: "Disciplină ștearsă cu succes" }
 * // }
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAdmin()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params

        const existing = await prisma.discipline.findUnique({
            where: { id },
            include: { _count: { select: { events: true } } }
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
                `Nu se poate șterge disciplina. Are ${existing._count.events} evenimente asociate.`,
                API_ERRORS.CONFLICT.status,
                API_ERRORS.CONFLICT.code
            )
        }

        await prisma.discipline.delete({ where: { id } })

        return successResponse({
            id,
            message: "Disciplină ștearsă cu succes"
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