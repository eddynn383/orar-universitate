
/**
 * @fileoverview API routes for managing individual classrooms by ID
 *
 * This module handles GET, PATCH, and DELETE operations for specific classrooms.
 * Provides direct database operations without the full validation and authorization
 * layer present in the main /api/sali collection routes.
 *
 * Note: This endpoint lacks authentication, validation, and dependency checking.
 * Consider enhancing with requireAuth/requireAdmin for production use, similar
 * to the grupe/[id] and ani-studiu/[id] patterns.
 *
 * @module app/api/sali/[id]
 */

import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
    successResponse,
    errorResponse,
    requireAuth,
    requireAdmin,
    API_ERRORS
} from "@/lib/api-utils"
import { classroomSchema } from "@/schemas/classroom"
import { z } from "zod"

type RouteParams = {
    params: Promise<{ id: string }>
}

/**
 * GET /api/sali/{id}
 *
 * Retrieves detailed information about a specific classroom by ID.
 * Returns the classroom data without authentication checks.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {Object} ctx - Route context
 * @param {Object} ctx.params - Route parameters
 * @param {string} ctx.params.id - Classroom ID
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - id: Classroom ID
 *   - name: Classroom name/number
 *   - building: Building name
 *   - capacity: Maximum seating capacity
 *   - createdAt: Creation timestamp
 *   - updatedAt: Last update timestamp
 *   - createdById: ID of user who created the classroom
 *   - updatedById: ID of user who last updated the classroom
 *
 * @throws {404} If classroom not found (handled by Prisma)
 * @throws {500} If database operation fails
 *
 * @requires None - No authentication required (consider adding for production)
 *
 * @example
 * // Request: GET /api/sali/cm123...
 * // Response: {
 * //   id: "cm123...",
 * //   name: "A101",
 * //   building: "Corp A",
 * //   capacity: 100,
 * //   createdAt: "2024-01-15T10:00:00.000Z",
 * //   updatedAt: "2024-01-15T10:00:00.000Z"
 * // }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params

        const classroom = await prisma.classroom.findUnique({
            where: { id },
            include: {
                _count: { select: { events: true } }
            }
        })

        if (!classroom) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        const transformed = {
            id: classroom.id,
            nume: classroom.name,
            cladire: classroom.building,
            capacitate: classroom.capacity,
            numarEvenimente: classroom._count.events,
            createdAt: classroom.createdAt,
            updatedAt: classroom.updatedAt
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
 * PUT /api/sali/{id}
 *
 * Updates a classroom's properties without validation or authentication.
 * Accepts any fields in the request body and applies them directly to the database.
 *
 * Warning: This endpoint performs no validation on input data. Consider adding
 * classroomSchema validation and requireAdmin authorization for production use.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {Object} ctx - Route context
 * @param {Object} ctx.params - Route parameters
 * @param {string} ctx.params.id - Classroom ID
 *
 * @body {Object} request.body - Classroom update data (any fields, no validation)
 * @body {string} [request.body.name] - New classroom name
 * @body {string} [request.body.building] - New building name
 * @body {number} [request.body.capacity] - New capacity
 *
 * @returns {Promise<Response>} JSON response containing updated classroom data
 *
 * @throws {404} If classroom not found
 * @throws {500} If database operation fails
 *
 * @requires None - No authentication or validation (consider adding for production)
 *
 * @example
 * // Request: PATCH /api/sali/cm123...
 * // Body: { "capacity": 120, "building": "Corp B" }
 * // Response: {
 * //   id: "cm123...",
 * //   name: "A101",
 * //   building: "Corp B",
 * //   capacity: 120,
 * //   ...
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

        const existing = await prisma.classroom.findUnique({ where: { id } })
        if (!existing) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        const mappedData = {
            name: body.nume ?? existing.name,
            building: body.cladire ?? existing.building,
            capacity: (body.capacitate ?? existing.capacity)?.toString()
        }

        const validation = classroomSchema.safeParse(mappedData)

        if (!validation.success) {
            return errorResponse(
                "Eroare de validare: " + JSON.stringify(z.flattenError(validation.error).fieldErrors),
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Verifică dacă noul nume este folosit de altă sală
        if (body.nume && body.nume !== existing.name) {
            const nameExists = await prisma.classroom.findFirst({
                where: { name: body.nume, id: { not: id } }
            })
            if (nameExists) {
                return errorResponse(
                    "Există deja o sală cu acest nume",
                    API_ERRORS.CONFLICT.status,
                    API_ERRORS.CONFLICT.code
                )
            }
        }

        await prisma.classroom.update({
            where: { id },
            data: {
                ...validation.data,
                updatedById: authResult.user.id
            }
        })

        return successResponse({
            id,
            message: "Sală actualizată cu succes"
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
 * DELETE /api/sali/{id}
 *
 * Deletes a classroom without checking for dependencies or authentication.
 *
 * Warning: This endpoint performs no dependency checking. If the classroom has
 * associated schedule events, the deletion will fail due to database foreign key
 * constraints. Consider adding dependency checking similar to grupe/[id] DELETE
 * which checks for associated events before deletion.
 *
 * Note: Returns 204 status but still includes the deleted object in response body,
 * which is not standard REST practice. Consider returning empty body with 204.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {Object} ctx - Route context
 * @param {Object} ctx.params - Route parameters
 * @param {string} ctx.params.id - Classroom ID
 *
 * @returns {Promise<Response>} JSON response with deleted classroom data and 204 status
 *
 * @throws {404} If classroom not found
 * @throws {500} If database operation fails (e.g., foreign key constraint violation)
 *
 * @requires None - No authentication or dependency checking (consider adding for production)
 *
 * @example
 * // Request: DELETE /api/sali/cm123...
 * // Response (Status 204): {
 * //   id: "cm123...",
 * //   name: "A101",
 * //   building: "Corp A",
 * //   capacity: 100,
 * //   ...
 * // }
 */

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAdmin()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params

        const existing = await prisma.classroom.findUnique({
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
                `Nu se poate șterge sala. Are ${existing._count.events} evenimente asociate.`,
                API_ERRORS.CONFLICT.status,
                API_ERRORS.CONFLICT.code
            )
        }

        await prisma.classroom.delete({ where: { id } })

        return successResponse({
            id,
            message: "Sală ștearsă cu succes"
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