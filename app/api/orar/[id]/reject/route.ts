/**
 * @fileoverview API route for rejecting schedule events
 *
 * This endpoint allows SECRETAR role users to reject events that are in PENDING_APPROVAL status.
 * A rejection reason can be provided to inform the teacher why the event was rejected.
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
 * POST /api/orar/[id]/reject
 *
 * Rejects a schedule event that is pending approval.
 * Only SECRETAR and ADMIN roles can reject events.
 *
 * @param request - The incoming request with optional rejection reason in body
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

    // Doar SECRETAR și ADMIN pot respinge
    if (!["ADMIN", "SECRETAR"].includes(userRole)) {
        return errorResponse(
            "Nu aveți permisiunea de a respinge evenimente",
            403,
            "FORBIDDEN"
        )
    }

    try {
        const eventId = params.id
        const body = await request.json()
        const rejectionReason = body.rejectionReason || "Fără motiv specificat"

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

        if (!["PENDING_APPROVAL", "APPROVED"].includes(event.status)) {
            return errorResponse(
                `Evenimentul nu poate fi respins. Status curent: ${event.status}`,
                400,
                "INVALID_STATUS"
            )
        }

        // Respinge evenimentul
        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: {
                status: "REJECTED",
                rejectionReason,
                updatedById: authResult.user.id
            }
        })

        return successResponse({
            id: updatedEvent.id,
            status: updatedEvent.status,
            rejectionReason,
            message: "Eveniment respins cu succes"
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
