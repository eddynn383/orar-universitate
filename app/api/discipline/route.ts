/**
 * @fileoverview API routes for managing academic disciplines (Discipline)
 *
 * This module handles CRUD operations for academic disciplines (courses/subjects),
 * including their associations with teachers, study years, learning cycles, and semesters.
 * Supports advanced filtering by multiple criteria and searching by name.
 *
 * @module app/api/discipline
 */

// app/api/discipline/route.ts

import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
    successResponse,
    errorResponse,
    requireAuth,
    requireAdmin,
    parseQueryParams,
    API_ERRORS
} from "@/lib/api-utils"
import { disciplineSchema } from "@/schemas/discipline"
import { z } from "zod"

/**
 * GET /api/discipline
 *
 * Retrieves a paginated list of academic disciplines with comprehensive filtering options.
 * Each discipline includes teacher information, study year, learning cycle, and event statistics.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 *
 * @query {number} [page=1] - Page number for pagination
 * @query {number} [limit=50] - Number of items per page (max: 100)
 * @query {string} [search] - Search term for filtering by discipline name (case-insensitive)
 * @query {number} [semestru] - Filter by semester (1 or 2)
 * @query {string} [profesor] - Filter by teacher ID
 * @query {number} [an] - Filter by study year (1, 2, 3, 4, 5, 6)
 * @query {string} [ciclu] - Filter by learning cycle name (e.g., "licenta", "master")
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - data: Array of discipline objects with:
 *     - id: Discipline ID
 *     - nume: Discipline name
 *     - semestru: Semester (1 or 2)
 *     - anStudiu: Study year number
 *     - ciclu: Learning cycle name
 *     - cicluId: Learning cycle ID
 *     - anStudiuId: Study year ID
 *     - profesor: Teacher object with id and full name (or null)
 *     - numarEvenimente: Number of associated events
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
 * // Request: GET /api/discipline?an=2&ciclu=licenta&semestru=1&page=1&limit=10
 * // Response: {
 * //   success: true,
 * //   data: [{ id: "...", nume: "Programare Web", semestru: 1, anStudiu: 2, ciclu: "Licență", profesor: {...}, ... }],
 * //   meta: { total: 15, page: 1, limit: 10, totalPages: 2 }
 * // }
 */
export async function GET(request: NextRequest) {
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { searchParams } = new URL(request.url)
        const params = parseQueryParams(searchParams)
        const search = searchParams.get("search") || undefined

        const where: any = {}

        if (search) {
            where.name = { contains: search, mode: 'insensitive' }
        }

        if (params.semestru) {
            where.semester = params.semestru
        }

        if (params.profesor) {
            where.teacherId = params.profesor
        }

        if (params.an) {
            where.studyYear = { year: params.an }
        }

        if (params.ciclu) {
            where.learningType = {
                learningCycle: {
                    equals: params.ciclu.charAt(0).toUpperCase() + params.ciclu.slice(1),
                    mode: 'insensitive'
                }
            }
        }

        const total = await prisma.discipline.count({ where })

        const disciplines = await prisma.discipline.findMany({
            where,
            include: {
                teacher: {
                    select: {
                        id: true,
                        grade: true,
                        user: {
                            select: {
                                firstname: true,
                                lastname: true
                            }
                        }
                    }
                },
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
                },
                learningType: {
                    select: {
                        id: true,
                        learningCycle: true
                    }
                },
                _count: {
                    select: { events: true }
                }
            },
            orderBy: { name: 'asc' },
            skip: (params.page - 1) * params.limit,
            take: params.limit
        })

        const transformed = disciplines.map(d => ({
            id: d.id,
            nume: d.name,
            semestru: d.semester,
            anStudiu: d.studyYear?.year,
            ciclu: d.learningType?.learningCycle || d.studyYear?.learningType?.learningCycle,
            cicluId: d.learningTypeId || d.studyYear?.learningType?.id,
            anStudiuId: d.studyYearId,
            profesor: d.teacher ? {
                id: d.teacher.id,
                nume: `${d.teacher.grade || ''} ${d.teacher.user?.firstname} ${d.teacher.user?.lastname}`.trim()
            } : null,
            numarEvenimente: d._count.events,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt
        }))

        return successResponse(transformed, {
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
 * POST /api/discipline
 *
 * Creates a new academic discipline with the specified properties.
 * Validates all required fields and associations.
 * The creating user's ID is automatically recorded.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 *
 * @body {Object} request.body - The discipline data
 * @body {string} request.body.nume - Discipline name (required)
 * @body {number} request.body.semestru - Semester (1 or 2, required)
 * @body {string} [request.body.profesorId] - Teacher ID (optional, can be null)
 * @body {string} [request.body.anStudiuId] - Study year ID (optional)
 * @body {string} [request.body.cicluId] - Learning cycle ID (optional)
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - success: true
 *   - data: { id, message }
 *
 * @throws {400} If validation fails (missing required fields or invalid values)
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not an admin
 * @throws {500} If database operation fails
 *
 * @requires Admin role
 *
 * @example
 * // Request: POST /api/discipline
 * // Body: { "nume": "Programare Web", "semestru": 1, "profesorId": "cm123...", "anStudiuId": "cm456...", "cicluId": "cm789..." }
 * // Response: {
 * //   success: true,
 * //   data: { id: "...", message: "Disciplină creată cu succes" }
 * // }
 */
export async function POST(request: NextRequest) {
    const authResult = await requireAdmin()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const body = await request.json()

        const mappedData = {
            name: body.nume,
            semester: body.semestru?.toString(),
            teacherId: body.profesorId,
            studyYearId: body.anStudiuId,
            learningTypeId: body.cicluId
        }

        const validation = disciplineSchema.safeParse(mappedData)

        if (!validation.success) {
            return errorResponse(
                "Eroare de validare: " + JSON.stringify(z.flattenError(validation.error).fieldErrors),
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        const discipline = await prisma.discipline.create({
            data: {
                ...validation.data,
                createdById: authResult.user.id,
                updatedById: authResult.user.id
            }
        })

        return successResponse({
            id: discipline.id,
            message: "Disciplină creată cu succes"
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