/**
 * @fileoverview API routes for managing individual learning cycles by ID
 *
 * This module handles GET, PUT, and DELETE operations for specific learning cycles.
 * Supports retrieving detailed information including associated study years, disciplines, and groups,
 * updating learning cycle properties, and deleting learning cycles with comprehensive dependency checks.
 *
 * @module app/api/cicluri/[id]
 */

// app/api/cicluri/[id]/route.ts

import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
    successResponse,
    errorResponse,
    requireAuth,
    requireAdmin,
    API_ERRORS
} from "@/lib/api-utils"
import { z } from "zod"

/**
 * Validation schema for learning cycle updates
 *
 * @typedef {Object} LearningTypeSchema
 * @property {string} learningCycle - Learning cycle name
 */
const learningTypeSchema = z.object({
    learningCycle: z.string().min(1, "Numele ciclului este obligatoriu")
})

/**
 * Route parameters type definition
 *
 * @typedef {Object} RouteParams
 * @property {Promise<{id: string}>} params - Route parameters containing learning cycle ID
 */
type RouteParams = {
    params: Promise<{ id: string }>
}

/**
 * GET /api/cicluri/{id}
 *
 * Retrieves detailed information about a specific learning cycle including all associated
 * study years, disciplines, student groups, and comprehensive statistics.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {RouteParams} params - Route parameters containing the learning cycle ID
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - id: Learning cycle ID
 *   - nume: Cycle name
 *   - aniStudiu: Array of study years (id, an)
 *   - discipline: Array of first 20 disciplines (id, nume, semestru)
 *   - grupe: Array of first 20 student groups (id, nume, semestru)
 *   - statistici: Statistics (numarEvenimente, numarDiscipline, numarGrupe, numarAniStudiu)
 *   - createdAt: Creation timestamp
 *   - updatedAt: Last update timestamp
 *
 * @throws {401} If user is not authenticated
 * @throws {404} If learning cycle with given ID does not exist
 * @throws {500} If database operation fails
 *
 * @requires Authentication
 *
 * @example
 * // Request: GET /api/cicluri/cm123...
 * // Response: {
 * //   success: true,
 * //   data: {
 * //     id: "cm123...",
 * //     nume: "Licență",
 * //     aniStudiu: [{id: "...", an: 1}, {id: "...", an: 2}, ...],
 * //     discipline: [...],
 * //     grupe: [...],
 * //     statistici: { numarEvenimente: 150, numarDiscipline: 45, numarGrupe: 12, numarAniStudiu: 4 },
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

        const learningType = await prisma.learningType.findUnique({
            where: { id },
            include: {
                studyYears: {
                    select: {
                        id: true,
                        year: true
                    },
                    orderBy: { year: 'asc' }
                },
                disciplines: {
                    select: {
                        id: true,
                        name: true,
                        semester: true
                    },
                    take: 20
                },
                groups: {
                    select: {
                        id: true,
                        name: true,
                        semester: true
                    },
                    take: 20
                },
                _count: {
                    select: {
                        events: true,
                        disciplines: true,
                        groups: true,
                        studyYears: true
                    }
                }
            }
        })

        if (!learningType) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        const transformed = {
            id: learningType.id,
            nume: learningType.learningCycle,
            aniStudiu: learningType.studyYears.map(sy => ({
                id: sy.id,
                an: sy.year
            })),
            discipline: learningType.disciplines.map(d => ({
                id: d.id,
                nume: d.name,
                semestru: d.semester
            })),
            grupe: learningType.groups.map(g => ({
                id: g.id,
                nume: g.name,
                semestru: g.semester
            })),
            statistici: {
                numarEvenimente: learningType._count.events,
                numarDiscipline: learningType._count.disciplines,
                numarGrupe: learningType._count.groups,
                numarAniStudiu: learningType._count.studyYears
            },
            createdAt: learningType.createdAt,
            updatedAt: learningType.updatedAt
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
 * PUT /api/cicluri/{id}
 *
 * Updates an existing learning cycle's name.
 * Validates the new name and prevents duplicate learning cycle names (case-insensitive).
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {RouteParams} params - Route parameters containing the learning cycle ID
 *
 * @body {Object} [request.body] - Learning cycle update data
 * @body {string} [request.body.nume] - New learning cycle name
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - success: true
 *   - data: { id, message }
 *
 * @throws {400} If validation fails (empty or invalid name)
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not an admin
 * @throws {404} If learning cycle does not exist
 * @throws {409} If updated name already exists for another learning cycle
 * @throws {500} If database operation fails
 *
 * @requires Admin role
 *
 * @example
 * // Request: PUT /api/cicluri/cm123...
 * // Body: { "nume": "Licență (zi)" }
 * // Response: {
 * //   success: true,
 * //   data: { id: "cm123...", message: "Ciclu de învățământ actualizat cu succes" }
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

        const existing = await prisma.learningType.findUnique({ where: { id } })
        if (!existing) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        const mappedData = {
            learningCycle: body.nume ?? existing.learningCycle
        }

        const validation = learningTypeSchema.safeParse(mappedData)

        if (!validation.success) {
            return errorResponse(
                "Eroare de validare: " + JSON.stringify(z.flattenError(validation.error).fieldErrors),
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Verifică dacă noul nume este folosit de alt ciclu
        if (body.nume && body.nume !== existing.learningCycle) {
            const duplicate = await prisma.learningType.findFirst({
                where: {
                    learningCycle: {
                        equals: body.nume,
                        mode: 'insensitive'
                    },
                    id: { not: id }
                }
            })
            if (duplicate) {
                return errorResponse(
                    "Există deja un ciclu de învățământ cu acest nume",
                    API_ERRORS.CONFLICT.status,
                    API_ERRORS.CONFLICT.code
                )
            }
        }

        await prisma.learningType.update({
            where: { id },
            data: validation.data
        })

        return successResponse({
            id,
            message: "Ciclu de învățământ actualizat cu succes"
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
 * DELETE /api/cicluri/{id}
 *
 * Deletes a learning cycle if it has no dependencies.
 * Prevents deletion if the learning cycle is being used by any study years, disciplines, groups, or events.
 * Provides detailed information about dependencies if deletion is prevented.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {RouteParams} params - Route parameters containing the learning cycle ID
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - success: true
 *   - data: { id, message }
 *
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not an admin
 * @throws {404} If learning cycle does not exist
 * @throws {409} If learning cycle has associated study years, disciplines, groups, or events
 * @throws {500} If database operation fails
 *
 * @requires Admin role
 *
 * @example
 * // Request: DELETE /api/cicluri/cm123...
 * // Response: {
 * //   success: true,
 * //   data: { id: "cm123...", message: "Ciclu de învățământ șters cu succes" }
 * // }
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAdmin()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params

        const existing = await prisma.learningType.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        events: true,
                        disciplines: true,
                        groups: true,
                        studyYears: true
                    }
                }
            }
        })

        if (!existing) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        const totalDependencies =
            existing._count.events +
            existing._count.disciplines +
            existing._count.groups +
            existing._count.studyYears

        if (totalDependencies > 0) {
            return errorResponse(
                `Nu se poate șterge ciclul de învățământ. Are ${existing._count.studyYears} ani de studiu, ${existing._count.disciplines} discipline, ${existing._count.groups} grupe și ${existing._count.events} evenimente asociate.`,
                API_ERRORS.CONFLICT.status,
                API_ERRORS.CONFLICT.code
            )
        }

        await prisma.learningType.delete({ where: { id } })

        return successResponse({
            id,
            message: "Ciclu de învățământ șters cu succes"
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