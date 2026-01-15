/**
 * @fileoverview API routes for managing academic years (Ani Universitari)
 *
 * This module handles CRUD operations for academic years, which represent
 * the calendar years for an academic period (e.g., 2024-2025).
 * Each academic year has a start year, end year, and publication status.
 * Academic years are used to organize events and schedules.
 *
 * @module app/api/ani-universitari
 */

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
import { yearSchema } from "@/schemas/year"
import { z } from "zod"

/**
 * GET /api/ani-universitari
 *
 * Retrieves a paginated list of academic years with their publication status and statistics.
 * Academic years represent calendar periods (e.g., 2024-2025) and can be filtered by publication status.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 *
 * @query {number} [page=1] - Page number for pagination
 * @query {number} [limit=50] - Number of items per page (max: 100)
 * @query {string} [publicat] - Filter by publication status ("true" or "false")
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - data: Array of academic year objects with:
 *     - id: Academic year ID
 *     - anInceput: Start year
 *     - anSfarsit: End year
 *     - perioada: Display period (e.g., "2024-2025")
 *     - publicat: Publication status
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
 * // Request: GET /api/ani-universitari?publicat=true&page=1&limit=10
 * // Response: {
 * //   success: true,
 * //   data: [{ id: "...", anInceput: 2024, anSfarsit: 2025, perioada: "2024-2025", publicat: true, numarEvenimente: 120, ... }],
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
        const publicat = searchParams.get("publicat")

        const where: any = {}

        if (publicat !== null) {
            where.published = publicat === "true"
        }

        const total = await prisma.academicYear.count({ where })

        const academicYears = await prisma.academicYear.findMany({
            where,
            include: {
                _count: {
                    select: { events: true }
                }
            },
            orderBy: { start: 'desc' },
            skip: (params.page - 1) * params.limit,
            take: params.limit
        })

        const transformed = academicYears.map(ciclu => ({
            id: ciclu.id,
            anInceput: ciclu.start,
            anSfarsit: ciclu.end,
            perioada: `${ciclu.start}-${ciclu.end}`,
            publicat: ciclu.published,
            numarEvenimente: ciclu._count.events,
            createdAt: ciclu.createdAt,
            updatedAt: ciclu.updatedAt
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
 * POST /api/ani-universitari
 *
 * Creates a new academic year with the specified period and publication status.
 * Validates the year range and prevents duplicate academic year periods.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 *
 * @body {Object} request.body - The academic year data
 * @body {number} request.body.anInceput - Start year (e.g., 2024)
 * @body {number} request.body.anSfarsit - End year (must be greater than start year)
 * @body {boolean} [request.body.publicat=false] - Publication status
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - success: true
 *   - data: { id, perioada, message }
 *
 * @throws {400} If validation fails (invalid year range or format)
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not an admin
 * @throws {409} If academic year with this period already exists
 * @throws {500} If database operation fails
 *
 * @requires Admin role
 *
 * @example
 * // Request: POST /api/ani-universitari
 * // Body: { "anInceput": 2024, "anSfarsit": 2025, "publicat": false }
 * // Response: {
 * //   success: true,
 * //   data: { id: "...", perioada: "2024-2025", message: "An universitar creat cu succes" }
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
            start: body.anInceput,
            end: body.anSfarsit,
            published: body.publicat ?? false
        }

        const validation = yearSchema.safeParse(mappedData)

        if (!validation.success) {
            return errorResponse(
                "Eroare de validare: " + JSON.stringify(z.flattenError(validation.error).fieldErrors),
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Verifică dacă există deja
        const existing = await prisma.academicYear.findFirst({
            where: {
                start: validation.data.start,
                end: validation.data.end
            }
        })

        if (existing) {
            return errorResponse(
                "Există deja un an universitar cu această perioadă",
                API_ERRORS.CONFLICT.status,
                API_ERRORS.CONFLICT.code
            )
        }

        const academicYear = await prisma.academicYear.create({
            data: validation.data
        })

        return successResponse({
            id: academicYear.id,
            perioada: `${academicYear.start}-${academicYear.end}`,
            message: "An universitar creat cu succes"
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