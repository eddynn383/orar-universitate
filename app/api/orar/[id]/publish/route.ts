/**
 * @fileoverview API route for publishing schedule events
 *
 * This endpoint allows SECRETAR role users to publish events that have been approved.
 * Only published events are visible to students.
 * ADMIN users can publish events directly without approval.
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
 * POST /api/orar/[id]/publish
 *
 * Publishes a schedule event, making it visible to students.
 * - ADMIN can publish any event
 * - SECRETAR can publish APPROVED or PENDING_APPROVAL events
 *
 * @param request - The incoming request
 * @param params - Route parameters containing the event ID
 * @returns JSON response with success or error message
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // Verifică autentificarea
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    const userRole = authResult.user.role

    // Doar SECRETAR și ADMIN pot publica
    if (!["ADMIN", "SECRETAR"].includes(userRole)) {
        return errorResponse(
            "Nu aveți permisiunea de a publica evenimente",
            403,
            "FORBIDDEN"
        )
    }

    try {
        const { id: eventId } = await params

        // Verifică dacă evenimentul există
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

        // Verifică dacă evenimentul poate fi publicat
        if (userRole === "SECRETAR") {
            // Secretarii pot publica doar evenimente APPROVED sau PENDING_APPROVAL
            if (!["APPROVED", "PENDING_APPROVAL"].includes(event.status)) {
                return errorResponse(
                    `Evenimentul nu poate fi publicat. Status curent: ${event.status}. Evenimentul trebuie să fie aprobat mai întâi.`,
                    400,
                    "INVALID_STATUS"
                )
            }
        }

        // Verifică dacă evenimentul este deja publicat
        if (event.status === "PUBLISHED") {
            return errorResponse(
                "Evenimentul este deja publicat",
                400,
                "ALREADY_PUBLISHED"
            )
        }

        // Publică evenimentul
        const updateData: any = {
            status: "PUBLISHED",
            publishedById: authResult.user.id,
            publishedAt: new Date(),
            updatedById: authResult.user.id
        }

        // Dacă evenimentul nu a fost aprobat încă, aprobă-l automat la publicare
        if (event.status !== "APPROVED") {
            updateData.approvedById = authResult.user.id
            updateData.approvedAt = new Date()
        }

        const updatedEvent = await prisma.event.update({
            where: { id: eventId },
            data: updateData
        })

        return successResponse({
            id: updatedEvent.id,
            status: updatedEvent.status,
            message: "Eveniment publicat cu succes. Este acum vizibil pentru studenți."
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
