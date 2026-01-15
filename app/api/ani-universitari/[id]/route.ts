/**
 * @fileoverview API routes for managing individual academic years by ID
 *
 * This module handles GET, PUT, and DELETE operations for specific academic years.
 * Supports retrieving detailed information including associated events,
 * updating academic year properties, and deleting academic years with dependency checks.
 *
 * @module app/api/ani-universitari/[id]
 */

// app/api/ani-universitari/[id]/route.ts

import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
    successResponse,
    errorResponse,
    requireAuth,
    requireAdmin,
    API_ERRORS
} from "@/lib/api-utils"
import { yearSchema } from "@/schemas/year"
import { z } from "zod"

/**
 * Route parameters type definition
 *
 * @typedef {Object} RouteParams
 * @property {Promise<{id: string}>} params - Route parameters containing academic year ID
 */
type RouteParams = {
    params: Promise<{ id: string }>
}

/**
 * GET /api/ani-universitari/{id}
 *
 * Retrieves detailed information about a specific academic year including
 * recent events and statistics.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {RouteParams} params - Route parameters containing the academic year ID
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - id: Academic year ID
 *   - anInceput: Start year
 *   - anSfarsit: End year
 *   - perioada: Display period
 *   - publicat: Publication status
 *   - numarEvenimente: Total number of events
 *   - evenimenteRecente: Array of up to 10 recent events
 *   - createdAt: Creation timestamp
 *   - updatedAt: Last update timestamp
 *
 * @throws {401} If user is not authenticated
 * @throws {404} If academic year with given ID does not exist
 * @throws {500} If database operation fails
 *
 * @requires Authentication
 *
 * @example
 * // Request: GET /api/ani-universitari/cm123...
 * // Response: {
 * //   success: true,
 * //   data: {
 * //     id: "cm123...",
 * //     anInceput: 2024,
 * //     anSfarsit: 2025,
 * //     perioada: "2024-2025",
 * //     publicat: true,
 * //     numarEvenimente: 120,
 * //     evenimenteRecente: [{ id: "...", zi: "Luni", oraInceput: "08:00", ... }],
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

        const academicYear = await prisma.academicYear.findUnique({
            where: { id },
            include: {
                events: {
                    select: {
                        id: true,
                        day: true,
                        startHour: true,
                        endHour: true,
                        semester: true,
                        eventType: true
                    },
                    take: 10,
                    orderBy: { createdAt: 'desc' }
                },
                _count: {
                    select: { events: true }
                }
            }
        })

        if (!academicYear) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        const transformed = {
            id: academicYear.id,
            anInceput: academicYear.start,
            anSfarsit: academicYear.end,
            perioada: `${academicYear.start}-${academicYear.end}`,
            publicat: academicYear.published,
            numarEvenimente: academicYear._count.events,
            evenimenteRecente: academicYear.events.map(e => ({
                id: e.id,
                zi: e.day,
                oraInceput: e.startHour,
                oraSfarsit: e.endHour,
                semestru: e.semester,
                tipActivitate: e.eventType
            })),
            createdAt: academicYear.createdAt,
            updatedAt: academicYear.updatedAt
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
 * PUT /api/ani-universitari/{id}
 *
 * Updates an existing academic year's properties.
 * Validates the year range and prevents duplicate academic year periods.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {RouteParams} params - Route parameters containing the academic year ID
 *
 * @body {Object} [request.body] - Academic year update data (all fields optional)
 * @body {number} [request.body.anInceput] - New start year
 * @body {number} [request.body.anSfarsit] - New end year
 * @body {boolean} [request.body.publicat] - New publication status
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - success: true
 *   - data: { id, message }
 *
 * @throws {400} If validation fails (invalid year range)
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not an admin
 * @throws {404} If academic year does not exist
 * @throws {409} If updated period already exists for another academic year
 * @throws {500} If database operation fails
 *
 * @requires Admin role
 *
 * @example
 * // Request: PUT /api/ani-universitari/cm123...
 * // Body: { "publicat": true }
 * // Response: {
 * //   success: true,
 * //   data: { id: "cm123...", message: "An universitar actualizat cu succes" }
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

        const existing = await prisma.academicYear.findUnique({ where: { id } })
        if (!existing) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        const mappedData = {
            start: body.anInceput ?? existing.start,
            end: body.anSfarsit ?? existing.end,
            published: body.publicat ?? existing.published
        }

        const validation = yearSchema.safeParse(mappedData)

        if (!validation.success) {
            return errorResponse(
                "Eroare de validare: " + JSON.stringify(z.flattenError(validation.error).fieldErrors),
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Verifică dacă noua perioadă este folosită de alt an
        if (body.anInceput || body.anSfarsit) {
            const duplicate = await prisma.academicYear.findFirst({
                where: {
                    start: validation.data.start,
                    end: validation.data.end,
                    id: { not: id }
                }
            })
            if (duplicate) {
                return errorResponse(
                    "Există deja un an universitar cu această perioadă",
                    API_ERRORS.CONFLICT.status,
                    API_ERRORS.CONFLICT.code
                )
            }
        }

        await prisma.academicYear.update({
            where: { id },
            data: validation.data
        })

        return successResponse({
            id,
            message: "An universitar actualizat cu succes"
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
 * DELETE /api/ani-universitari/{id}
 *
 * Deletes an academic year if it has no dependencies (events).
 * Prevents deletion if the academic year is being used by any events.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {RouteParams} params - Route parameters containing the academic year ID
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - success: true
 *   - data: { id, message }
 *
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not an admin
 * @throws {404} If academic year does not exist
 * @throws {409} If academic year has associated events
 * @throws {500} If database operation fails
 *
 * @requires Admin role
 *
 * @example
 * // Request: DELETE /api/ani-universitari/cm123...
 * // Response: {
 * //   success: true,
 * //   data: { id: "cm123...", message: "An universitar șters cu succes" }
 * // }
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAdmin()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params

        const existing = await prisma.academicYear.findUnique({
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
                `Nu se poate șterge anul universitar. Are ${existing._count.events} evenimente asociate.`,
                API_ERRORS.CONFLICT.status,
                API_ERRORS.CONFLICT.code
            )
        }

        await prisma.academicYear.delete({ where: { id } })

        return successResponse({
            id,
            message: "An universitar șters cu succes"
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