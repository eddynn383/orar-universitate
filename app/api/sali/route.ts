/**
 * @fileoverview API routes for managing classrooms (Săli)
 *
 * This module handles CRUD operations for classrooms/rooms where classes are held.
 * Each classroom has a name, building location, capacity, and tracks associated
 * schedule events. Classrooms are essential resources in the scheduling system.
 *
 * @module app/api/sali
 */

// app/api/sali/route.ts

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
import { classroomSchema } from "@/schemas/classroom"
import { z } from "zod"

/**
 * GET /api/sali
 *
 * Retrieves a paginated list of classrooms with their details and usage statistics.
 * Classrooms represent physical locations where classes are held.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 *
 * @query {number} [page=1] - Page number for pagination
 * @query {number} [limit=50] - Number of items per page (max: 100)
 * @query {string} [search] - Search by classroom name (case-insensitive)
 * @query {string} [cladire] - Filter by building name (case-insensitive)
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - data: Array of classroom objects with:
 *     - id: Classroom ID
 *     - nume: Classroom name/number
 *     - cladire: Building name
 *     - capacitate: Maximum capacity (number of seats)
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
 * // Request: GET /api/sali?cladire=Corp%20A&search=A1&page=1&limit=10
 * // Response: {
 * //   success: true,
 * //   data: [{
 * //     id: "...",
 * //     nume: "A101",
 * //     cladire: "Corp A",
 * //     capacitate: 100,
 * //     numarEvenimente: 25
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
        const cladire = searchParams.get("cladire") || undefined

        const where: any = {}

        if (search) {
            where.name = { contains: search, mode: 'insensitive' }
        }

        if (cladire) {
            where.building = { contains: cladire, mode: 'insensitive' }
        }

        const total = await prisma.classroom.count({ where })

        const classrooms = await prisma.classroom.findMany({
            where,
            include: {
                _count: { select: { events: true } }
            },
            orderBy: [
                { building: 'asc' },
                { name: 'asc' }
            ],
            skip: (params.page - 1) * params.limit,
            take: params.limit
        })

        const transformed = classrooms.map(c => ({
            id: c.id,
            nume: c.name,
            cladire: c.building,
            capacitate: c.capacity,
            numarEvenimente: c._count.events,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt
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
 * POST /api/sali
 *
 * Creates a new classroom in the system.
 * Validates that the classroom name is unique across all classrooms.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 *
 * @body {Object} request.body - The classroom data
 * @body {string} request.body.nume - Classroom name/number (e.g., "A101", "B203")
 * @body {string} request.body.cladire - Building name (e.g., "Corp A", "Corp B")
 * @body {number} request.body.capacitate - Maximum seating capacity
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - success: true
 *   - data: { id, message }
 *
 * @throws {400} If validation fails (missing required fields)
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not an admin
 * @throws {409} If a classroom with the same name already exists
 * @throws {500} If database operation fails
 *
 * @requires Admin role
 *
 * @example
 * // Request: POST /api/sali
 * // Body: {
 * //   "nume": "A101",
 * //   "cladire": "Corp A",
 * //   "capacitate": 100
 * // }
 * // Response: {
 * //   success: true,
 * //   data: { id: "cm123...", message: "Sală creată cu succes" }
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
            building: body.cladire,
            capacity: body.capacitate?.toString()
        }

        const validation = classroomSchema.safeParse(mappedData)

        if (!validation.success) {
            return errorResponse(
                "Eroare de validare: " + JSON.stringify(z.flattenError(validation.error).fieldErrors),
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Verifică dacă există deja o sală cu acest nume
        const existing = await prisma.classroom.findFirst({
            where: { name: validation.data.name }
        })

        if (existing) {
            return errorResponse(
                "Există deja o sală cu acest nume",
                API_ERRORS.CONFLICT.status,
                API_ERRORS.CONFLICT.code
            )
        }

        const classroom = await prisma.classroom.create({
            data: {
                ...validation.data,
                createdById: authResult.user.id,
                updatedById: authResult.user.id
            }
        })

        return successResponse({
            id: classroom.id,
            message: "Sală creată cu succes"
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