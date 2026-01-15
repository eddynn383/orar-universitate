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

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

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
export async function GET(request: NextRequest, ctx: RouteContext<'/api/classroom/[id]'>) {
    const { id } = await ctx.params

    const classroom = await prisma.classroom.findUnique({
        where: {
            id
        },
    })
    return NextResponse.json(classroom, { status: 200 })
}

/**
 * PATCH /api/sali/{id}
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
export async function PATCH(request: NextRequest, ctx: RouteContext<'/api/classroom/[id]'>) {
    const body = await request.json()
    const { id } = await ctx.params

    const updatedClassroom = await prisma.classroom.update({
        where: {
            id
        },
        data: body
    })
    return NextResponse.json(updatedClassroom, { status: 200 })
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
export async function DELETE(request: NextRequest, ctx: RouteContext<'/api/classroom/[id]'>) {
    const { id } = await ctx.params

    const deletedClassroom = await prisma.classroom.delete({
        where: {
            id
        },
    })
    return NextResponse.json(deletedClassroom, { status: 204 })
}