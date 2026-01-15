/**
 * @fileoverview API routes for managing student groups (Grupe de Studiu)
 *
 * This module handles CRUD operations for student groups, which represent
 * organized sets of students within a study year and semester. Each group
 * is associated with a study year, learning type (cycle), and has schedule events.
 *
 * @module app/api/grupe
 */

// app/api/grupe/route.ts

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
import { groupSchema } from "@/schemas/group"
import { z } from "zod"

/**
 * GET /api/grupe
 *
 * Retrieves a paginated list of student groups with their associated metadata and statistics.
 * Student groups represent organized sets of students within a study year, semester, and learning cycle.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 *
 * @query {number} [page=1] - Page number for pagination
 * @query {number} [limit=50] - Number of items per page (max: 100)
 * @query {number} [an] - Filter by study year number (1-6)
 * @query {string} [ciclu] - Filter by learning type/cycle name (case-insensitive)
 * @query {number} [semestru] - Filter by semester (1 or 2)
 * @query {string} [search] - Search by group name (case-insensitive)
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - data: Array of group objects with:
 *     - id: Group ID
 *     - nume: Group name
 *     - numarGrupa: Group number
 *     - semestru: Semester number
 *     - anStudiu: Study year number
 *     - anStudiuId: Study year ID
 *     - ciclu: Learning cycle name
 *     - cicluId: Learning type ID
 *     - numarEvenimente: Number of associated schedule events
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
 * // Request: GET /api/grupe?ciclu=licenta&an=1&semestru=1&page=1&limit=10
 * // Response: {
 * //   success: true,
 * //   data: [{
 * //     id: "...",
 * //     nume: "A1",
 * //     numarGrupa: "1",
 * //     semestru: 1,
 * //     anStudiu: 1,
 * //     ciclu: "Licență",
 * //     numarEvenimente: 15
 * //   }],
 * //   meta: { total: 5, page: 1, limit: 10, totalPages: 1 }
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

        const total = await prisma.group.count({ where })

        const groups = await prisma.group.findMany({
            where,
            include: {
                studyYear: {
                    include: { learningType: true }
                },
                learningType: true,
                _count: {
                    select: { events: true }
                }
            },
            orderBy: [
                { studyYear: { year: 'asc' } },
                { name: 'asc' }
            ],
            skip: (params.page - 1) * params.limit,
            take: params.limit
        })

        const transformed = groups.map(g => ({
            id: g.id,
            nume: g.name,
            numarGrupa: g.group,
            semestru: g.semester,
            anStudiu: g.studyYear?.year,
            anStudiuId: g.studyYearId,
            ciclu: g.learningType?.learningCycle || g.studyYear?.learningType?.learningCycle,
            cicluId: g.learningTypeId,
            numarEvenimente: g._count.events,
            createdAt: g.createdAt,
            updatedAt: g.updatedAt
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
 * POST /api/grupe
 *
 * Creates a new student group within a study year and learning cycle.
 * Validates that the group name is unique within the specified study year.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 *
 * @body {Object} request.body - The group data
 * @body {string} request.body.nume - Group name (e.g., "A1", "B2")
 * @body {number} request.body.numarGrupa - Group number
 * @body {number} request.body.semestru - Semester (1 or 2)
 * @body {string} request.body.anStudiuId - Study year ID (must exist)
 * @body {string} request.body.cicluId - Learning type/cycle ID (must exist)
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - success: true
 *   - data: { id, message }
 *
 * @throws {400} If validation fails (missing required fields or invalid format)
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not an admin
 * @throws {409} If a group with the same name already exists for the study year
 * @throws {500} If database operation fails
 *
 * @requires Admin role
 *
 * @example
 * // Request: POST /api/grupe
 * // Body: {
 * //   "nume": "A1",
 * //   "numarGrupa": 1,
 * //   "semestru": 1,
 * //   "anStudiuId": "cm123...",
 * //   "cicluId": "cm456..."
 * // }
 * // Response: {
 * //   success: true,
 * //   data: { id: "cm789...", message: "Grupă creată cu succes" }
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
            group: body.numarGrupa?.toString(),
            semester: body.semestru?.toString(),
            studyYearId: body.anStudiuId,
            learningTypeId: body.cicluId
        }

        const validation = groupSchema.safeParse(mappedData)

        if (!validation.success) {
            return errorResponse(
                "Eroare de validare: " + JSON.stringify(z.flattenError(validation.error).fieldErrors),
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Verifică unicitatea numelui pentru studyYear
        const existing = await prisma.group.findFirst({
            where: {
                studyYearId: validation.data.studyYearId,
                name: validation.data.name
            }
        })

        if (existing) {
            return errorResponse(
                "Există deja o grupă cu acest nume pentru anul de studiu selectat",
                API_ERRORS.CONFLICT.status,
                API_ERRORS.CONFLICT.code
            )
        }

        const group = await prisma.group.create({
            data: {
                ...validation.data,
                createdById: authResult.user.id,
                updatedById: authResult.user.id
            }
        })

        return successResponse({
            id: group.id,
            message: "Grupă creată cu succes"
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