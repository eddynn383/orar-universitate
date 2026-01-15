/**
 * @fileoverview API routes for managing learning cycles (Cicluri de Învățământ)
 *
 * This module handles CRUD operations for learning cycles, which represent
 * educational program types (Licență, Master, Doctorat, etc.).
 * Learning cycles organize study years, student groups, disciplines, and events.
 *
 * @module app/api/cicluri
 */

// app/api/cicluri/route.ts

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
 * Validation schema for learning cycle creation and updates
 *
 * @typedef {Object} LearningTypeSchema
 * @property {string} learningCycle - Learning cycle name (e.g., "Licență", "Master")
 */
const learningTypeSchema = z.object({
    learningCycle: z.string().min(1, "Numele ciclului este obligatoriu")
})

/**
 * GET /api/cicluri
 *
 * Retrieves a paginated list of learning cycles with their associated study years and statistics.
 * Learning cycles represent educational program types (Licență, Master, etc.) and organize
 * the entire academic structure.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 *
 * @query {number} [page=1] - Page number for pagination
 * @query {number} [limit=50] - Number of items per page (max: 100)
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - data: Array of learning cycle objects with:
 *     - id: Learning cycle ID
 *     - nume: Cycle name (e.g., "Licență", "Master")
 *     - aniStudiu: Array of associated study years (id, an)
 *     - statistici: Statistics (numarEvenimente, numarDiscipline, numarGrupe)
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
 * // Request: GET /api/cicluri?page=1&limit=10
 * // Response: {
 * //   success: true,
 * //   data: [{ id: "...", nume: "Licență", aniStudiu: [{id: "...", an: 1}, ...], statistici: {...}, ... }],
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

        const total = await prisma.learningType.count()

        const learningTypes = await prisma.learningType.findMany({
            include: {
                studyYears: {
                    select: {
                        id: true,
                        year: true
                    },
                    orderBy: { year: 'asc' }
                },
                _count: {
                    select: {
                        events: true,
                        disciplines: true,
                        groups: true
                    }
                }
            },
            orderBy: { learningCycle: 'asc' },
            skip: (params.page - 1) * params.limit,
            take: params.limit
        })

        const transformed = learningTypes.map(lt => ({
            id: lt.id,
            nume: lt.learningCycle,
            aniStudiu: lt.studyYears.map(sy => ({
                id: sy.id,
                an: sy.year
            })),
            statistici: {
                numarEvenimente: lt._count.events,
                numarDiscipline: lt._count.disciplines,
                numarGrupe: lt._count.groups
            },
            createdAt: lt.createdAt,
            updatedAt: lt.updatedAt
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
 * POST /api/cicluri
 *
 * Creates a new learning cycle with the specified name.
 * Validates the cycle name and prevents duplicate learning cycle names (case-insensitive).
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 *
 * @body {Object} request.body - The learning cycle data
 * @body {string} request.body.nume - Learning cycle name (e.g., "Licență", "Master", "Doctorat")
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - success: true
 *   - data: { id, nume, message }
 *
 * @throws {400} If validation fails (empty or invalid name)
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not an admin
 * @throws {409} If learning cycle with this name already exists
 * @throws {500} If database operation fails
 *
 * @requires Admin role
 *
 * @example
 * // Request: POST /api/cicluri
 * // Body: { "nume": "Licență" }
 * // Response: {
 * //   success: true,
 * //   data: { id: "...", nume: "Licență", message: "Ciclu de învățământ creat cu succes" }
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
            learningCycle: body.nume
        }

        const validation = learningTypeSchema.safeParse(mappedData)

        if (!validation.success) {
            return errorResponse(
                "Eroare de validare: " + JSON.stringify(z.flattenError(validation.error).fieldErrors),
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Verifică dacă există deja
        const existing = await prisma.learningType.findFirst({
            where: {
                learningCycle: {
                    equals: validation.data.learningCycle,
                    mode: 'insensitive'
                }
            }
        })

        if (existing) {
            return errorResponse(
                "Există deja un ciclu de învățământ cu acest nume",
                API_ERRORS.CONFLICT.status,
                API_ERRORS.CONFLICT.code
            )
        }

        const learningType = await prisma.learningType.create({
            data: validation.data
        })

        return successResponse({
            id: learningType.id,
            nume: learningType.learningCycle,
            message: "Ciclu de învățământ creat cu succes"
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