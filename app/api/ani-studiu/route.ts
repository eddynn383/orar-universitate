/**
 * @fileoverview API routes for managing study years (Ani de Studiu)
 *
 * This module handles CRUD operations for study years, which represent
 * the academic years within a learning cycle (e.g., Year 1, Year 2, Year 3).
 * Each study year is associated with a learning type (Licență, Master, etc.).
 *
 * @module app/api/ani-studiu
 */

// app/api/ani-studiu/route.ts

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
import { z } from "zod"

/**
 * Validation schema for study year creation and updates
 *
 * @typedef {Object} StudyYearSchema
 * @property {number} year - Year number (1-6)
 * @property {string} learningTypeId - Learning type (cycle) ID
 */
const studyYearSchema = z.object({
    year: z.number().int().min(1).max(6),
    learningTypeId: z.string().min(1, "Ciclul de învățământ este obligatoriu")
})

/**
 * GET /api/ani-studiu
 *
 * Retrieves a paginated list of study years with their associated learning types and statistics.
 * Study years represent academic years (Year 1, Year 2, etc.) within a learning cycle.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 *
 * @query {number} [page=1] - Page number for pagination
 * @query {number} [limit=50] - Number of items per page (max: 100)
 * @query {string} [cicluId] - Filter by learning type ID
 * @query {string} [ciclu] - Filter by learning type name (case-insensitive)
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - data: Array of study year objects with:
 *     - id: Study year ID
 *     - an: Year number (1-6)
 *     - nume: Display name (e.g., "Anul 1")
 *     - ciclu: Learning type information (id, nume)
 *     - statistici: Statistics (numarGrupe, numarDiscipline)
 *   - meta: Pagination metadata (total, page, limit, totalPages)
 *
 * @throws {401} If user is not authenticated
 * @throws {500} If database operation fails
 *
 * @requires Authentication
 *
 * @example
 * // Request: GET /api/ani-studiu?ciclu=licenta&page=1&limit=10
 * // Response: {
 * //   success: true,
 * //   data: [{ id: "...", an: 1, nume: "Anul 1", ciclu: {...}, statistici: {...} }],
 * //   meta: { total: 3, page: 1, limit: 10, totalPages: 1 }
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
        const cicluId = searchParams.get("cicluId") || undefined
        const cicluNume = searchParams.get("ciclu") || undefined

        const where: any = {}

        if (cicluId) {
            where.learningTypeId = cicluId
        } else if (cicluNume) {
            where.learningType = {
                learningCycle: {
                    equals: cicluNume.charAt(0).toUpperCase() + cicluNume.slice(1),
                    mode: 'insensitive'
                }
            }
        }

        const total = await prisma.studyYear.count({ where })

        const studyYears = await prisma.studyYear.findMany({
            where,
            include: {
                learningType: {
                    select: {
                        id: true,
                        learningCycle: true
                    }
                },
                _count: {
                    select: {
                        studentGroups: true,
                        disciplines: true
                    }
                }
            },
            orderBy: [
                { learningType: { learningCycle: 'asc' } },
                { year: 'asc' }
            ],
            skip: (params.page - 1) * params.limit,
            take: params.limit
        })

        const transformed = studyYears.map(sy => ({
            id: sy.id,
            an: sy.year,
            nume: `Anul ${sy.year}`,
            ciclu: sy.learningType ? {
                id: sy.learningType.id,
                nume: sy.learningType.learningCycle
            } : null,
            statistici: {
                numarGrupe: sy._count.studentGroups,
                numarDiscipline: sy._count.disciplines
            }
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
 * POST /api/ani-studiu
 *
 * Creates a new study year for a specific learning type.
 * Validates that the learning type exists and prevents duplicate year-cycle combinations.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 *
 * @body {Object} request.body - The study year data
 * @body {number} request.body.an - Year number (1-6)
 * @body {string} request.body.cicluId - Learning type ID (must exist)
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - success: true
 *   - data: { id, an, ciclu, message }
 *
 * @throws {400} If validation fails (invalid year number or missing cicluId)
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not an admin
 * @throws {404} If learning type (ciclu) does not exist
 * @throws {409} If study year already exists for this learning type
 * @throws {500} If database operation fails
 *
 * @requires Admin role
 *
 * @example
 * // Request: POST /api/ani-studiu
 * // Body: { "an": 1, "cicluId": "cm123..." }
 * // Response: {
 * //   success: true,
 * //   data: { id: "...", an: 1, ciclu: "Licență", message: "An de studiu creat cu succes" }
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
            year: body.an,
            learningTypeId: body.cicluId
        }

        const validation = studyYearSchema.safeParse(mappedData)

        if (!validation.success) {
            return errorResponse(
                "Eroare de validare: " + JSON.stringify(z.flattenError(validation.error).fieldErrors),
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Verifică dacă ciclul există
        const learningType = await prisma.learningType.findUnique({
            where: { id: validation.data.learningTypeId }
        })

        if (!learningType) {
            return errorResponse(
                "Ciclul de învățământ specificat nu există",
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        // Verifică dacă există deja acest an pentru ciclu
        const existing = await prisma.studyYear.findFirst({
            where: {
                learningTypeId: validation.data.learningTypeId,
                year: validation.data.year
            }
        })

        if (existing) {
            return errorResponse(
                `Anul ${validation.data.year} există deja pentru ${learningType.learningCycle}`,
                API_ERRORS.CONFLICT.status,
                API_ERRORS.CONFLICT.code
            )
        }

        const studyYear = await prisma.studyYear.create({
            data: validation.data,
            include: {
                learningType: true
            }
        })

        return successResponse({
            id: studyYear.id,
            an: studyYear.year,
            ciclu: studyYear.learningType?.learningCycle,
            message: "An de studiu creat cu succes"
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