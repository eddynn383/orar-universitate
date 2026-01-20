/**
 * @fileoverview API route for approving schedule events
 *
 * This endpoint allows SECRETAR role users to approve events that are in PENDING_APPROVAL status.
 * Approved events can then be published by the secretary.
 */

import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
    successResponse,
    errorResponse,
    requireAuth,
    API_ERRORS
} from "@/lib/api-utils"

/**
 * POST /api/orar/[id]/approve
 *
 * Approves a schedule event that is pending approval.
 * Only SECRETAR and ADMIN roles can approve events.
 *
 * @param request - The incoming request
 * @param params - Route parameters containing the event ID
 * @returns JSON response with success or error message
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    // Verifică autentificarea
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    const userRole = authResult.user.role

    // Doar SECRETAR și ADMIN pot aproba
    if (!["ADMIN", "SECRETAR"].includes(userRole)) {
        return errorResponse(
            "Nu aveți permisiunea de a aproba evenimente",
            403,
            "FORBIDDEN"
        )
    }

    try {
        const eventId = params.id

        // Verifică dacă evenimentul există și este în starea corectă
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            include: {
                teacher: true,
                discipline: true
            }
        })

        if (!event) {
            return errorResponse(
                "Evenimentul nu a fost găsit",
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        if (event.status !== "PENDING_APPROVAL") {
            return errorResponse(
                `Evenimentul nu poate fi aprobat. Status curent: ${event.status}`,
                400,
                "INVALID_STATUS"
            )
        }

        // Aprobă evenimentul
        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: {
                status: "APPROVED",
                approvedById: authResult.user.id,
                approvedAt: new Date(),
                updatedById: authResult.user.id
            }
        })

        return successResponse({
            id: updatedEvent.id,
            status: updatedEvent.status,
            message: "Eveniment aprobat cu succes. Poate fi acum publicat."
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
