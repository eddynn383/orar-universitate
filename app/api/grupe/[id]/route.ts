/**
 * @fileoverview API routes for managing individual student groups by ID
 *
 * This module handles GET, PUT, and DELETE operations for specific student groups.
 * Supports retrieving detailed group information including associated events,
 * updating group properties, and deleting groups with dependency checks.
 *
 * @module app/api/grupe/[id]
 */

// app/api/grupe/[id]/route.ts

import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
    successResponse,
    errorResponse,
    requireAuth,
    requireAdmin,
    API_ERRORS
} from "@/lib/api-utils"
import { groupSchema } from "@/schemas/group"
import { z } from "zod"

/**
 * Route parameters type definition
 *
 * @typedef {Object} RouteParams
 * @property {Promise<{id: string}>} params - Route parameters containing group ID
 */
type RouteParams = {
    params: Promise<{ id: string }>
}

/**
 * GET /api/grupe/{id}
 *
 * Retrieves detailed information about a specific student group including
 * study year, learning cycle, and event count.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {RouteParams} params - Route parameters containing the group ID
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - id: Group ID
 *   - nume: Group name
 *   - numarGrupa: Group number
 *   - semestru: Semester number
 *   - anStudiu: Study year number
 *   - anStudiuId: Study year ID
 *   - ciclu: Learning cycle name
 *   - cicluId: Learning type ID
 *   - numarEvenimente: Number of associated schedule events
 *   - createdAt: Creation timestamp
 *   - updatedAt: Last update timestamp
 *
 * @throws {401} If user is not authenticated
 * @throws {404} If group with given ID does not exist
 * @throws {500} If database operation fails
 *
 * @requires Authentication
 *
 * @example
 * // Request: GET /api/grupe/cm123...
 * // Response: {
 * //   success: true,
 * //   data: {
 * //     id: "cm123...",
 * //     nume: "A1",
 * //     numarGrupa: "1",
 * //     semestru: 1,
 * //     anStudiu: 1,
 * //     ciclu: "Licență",
 * //     numarEvenimente: 15
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

        const group = await prisma.group.findUnique({
            where: { id },
            include: {
                studyYear: {
                    include: { learningType: true }
                },
                learningType: true,
                _count: { select: { events: true } }
            }
        })

        if (!group) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        const transformed = {
            id: group.id,
            nume: group.name,
            numarGrupa: group.group,
            semestru: group.semester,
            anStudiu: group.studyYear?.year,
            anStudiuId: group.studyYearId,
            ciclu: group.learningType?.learningCycle || group.studyYear?.learningType?.learningCycle,
            cicluId: group.learningTypeId,
            numarEvenimente: group._count.events,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt
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
 * PUT /api/grupe/{id}
 *
 * Updates an existing student group's properties.
 * Validates that the new group name (if changed) is unique within the study year.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {RouteParams} params - Route parameters containing the group ID
 *
 * @body {Object} [request.body] - Group update data (all fields optional)
 * @body {string} [request.body.nume] - New group name
 * @body {number} [request.body.numarGrupa] - New group number
 * @body {number} [request.body.semestru] - New semester (1 or 2)
 * @body {string} [request.body.anStudiuId] - New study year ID
 * @body {string} [request.body.cicluId] - New learning type ID
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - success: true
 *   - data: { id, message }
 *
 * @throws {400} If validation fails
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not an admin
 * @throws {404} If group does not exist
 * @throws {409} If updated name already exists for the study year
 * @throws {500} If database operation fails
 *
 * @requires Admin role
 *
 * @example
 * // Request: PUT /api/grupe/cm123...
 * // Body: { "nume": "A2", "semestru": 2 }
 * // Response: {
 * //   success: true,
 * //   data: { id: "cm123...", message: "Grupă actualizată cu succes" }
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

        const existing = await prisma.group.findUnique({ where: { id } })
        if (!existing) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        const mappedData = {
            name: body.nume ?? existing.name,
            group: (body.numarGrupa ?? existing.group).toString(),
            semester: (body.semestru ?? existing.semester).toString(),
            studyYearId: body.anStudiuId ?? existing.studyYearId,
            learningTypeId: body.cicluId ?? existing.learningTypeId
        }

        const validation = groupSchema.safeParse(mappedData)

        if (!validation.success) {
            return errorResponse(
                "Eroare de validare: " + JSON.stringify(z.flattenError(validation.error).fieldErrors),
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Verifică unicitatea numelui pentru studyYear (excluzând grupa curentă)
        if (body.nume && body.nume !== existing.name) {
            const nameExists = await prisma.group.findFirst({
                where: {
                    studyYearId: validation.data.studyYearId,
                    name: body.nume,
                    id: { not: id }
                }
            })
            if (nameExists) {
                return errorResponse(
                    "Există deja o grupă cu acest nume pentru anul de studiu selectat",
                    API_ERRORS.CONFLICT.status,
                    API_ERRORS.CONFLICT.code
                )
            }
        }

        await prisma.group.update({
            where: { id },
            data: {
                ...validation.data,
                updatedById: authResult.user.id
            }
        })

        return successResponse({
            id,
            message: "Grupă actualizată cu succes"
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
 * DELETE /api/grupe/{id}
 *
 * Deletes a student group if it has no dependencies (schedule events).
 * Prevents deletion if the group is being used by any schedule events.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {RouteParams} params - Route parameters containing the group ID
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - success: true
 *   - data: { id, message }
 *
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not an admin
 * @throws {404} If group does not exist
 * @throws {409} If group has associated schedule events
 * @throws {500} If database operation fails
 *
 * @requires Admin role
 *
 * @example
 * // Request: DELETE /api/grupe/cm123...
 * // Response: {
 * //   success: true,
 * //   data: { id: "cm123...", message: "Grupă ștearsă cu succes" }
 * // }
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAdmin()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params

        const existing = await prisma.group.findUnique({
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
                `Nu se poate șterge grupa. Are ${existing._count.events} evenimente asociate.`,
                API_ERRORS.CONFLICT.status,
                API_ERRORS.CONFLICT.code
            )
        }

        await prisma.group.delete({ where: { id } })

        return successResponse({
            id,
            message: "Grupă ștearsă cu succes"
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