/**
 * @fileoverview API route for bulk publishing teacher events
 *
 * This endpoint allows teachers to publish all their pending events at once.
 * When events are published, all users with SECRETAR role receive a notification.
 *
 * @module app/api/orar/publish-bulk
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
 * POST /api/orar/publish-bulk
 *
 * Publishes all pending events for a teacher and notifies secretaries.
 * Only teachers can use this endpoint to publish their own events.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - success: true
 *   - data: { publishedCount, message }
 *
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not a teacher or doesn't have a teacher profile
 * @throws {404} If no pending events found
 * @throws {500} If database operation fails
 *
 * @requires Teacher role
 */
export async function POST(request: NextRequest) {
    // Verifică autentificarea
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    const userRole = authResult.user.role
    const userId = authResult.user.id

    // Doar profesorii pot publica evenimente în masă
    if (userRole !== "PROFESOR") {
        return errorResponse(
            "Doar profesorii pot publica evenimente în masă",
            403,
            "FORBIDDEN"
        )
    }

    try {
        // Găsește profilul de profesor asociat cu userul
        const teacherProfile = await prisma.teacher.findFirst({
            where: {
                OR: [
                    { userId: userId },
                    { email: authResult.user.email }
                ]
            }
        })

        if (!teacherProfile) {
            return errorResponse(
                "Nu aveți un profil de profesor asociat. Contactați administratorul.",
                403,
                "FORBIDDEN"
            )
        }

        // Găsește toate evenimentele cu status PENDING_APPROVAL sau DRAFT ale profesorului
        const pendingEvents = await prisma.event.findMany({
            where: {
                teacherId: teacherProfile.id,
                status: {
                    in: ["PENDING_APPROVAL", "DRAFT"]
                }
            }
        })

        if (pendingEvents.length === 0) {
            return errorResponse(
                "Nu aveți evenimente în așteptare de publicare",
                404,
                "NOT_FOUND"
            )
        }

        // Actualizează toate evenimentele la status PENDING_APPROVAL
        // (Profesorii nu pot publica direct, trebuie aprobare de la secretar)
        const updatedEvents = await prisma.event.updateMany({
            where: {
                teacherId: teacherProfile.id,
                status: {
                    in: ["DRAFT"]
                }
            },
            data: {
                status: "PENDING_APPROVAL",
                updatedById: userId
            }
        })

        // Găsește toți utilizatorii cu rol de SECRETAR pentru notificări
        const secretaries = await prisma.user.findMany({
            where: {
                role: "SECRETAR"
            }
        })

        // Creează notificări pentru fiecare secretar
        const teacherName = authResult.user.name || authResult.user.email || "Un profesor"
        const notifications = secretaries.map(secretary => ({
            userId: secretary.id,
            title: "Solicitare de aprobare orar",
            message: `${teacherName} a trimis ${pendingEvents.length} evenimente pentru aprobare.`,
            type: "INFO",
            read: false
        }))

        if (notifications.length > 0) {
            await prisma.notification.createMany({
                data: notifications
            })
        }

        return successResponse({
            publishedCount: updatedEvents.count,
            totalEvents: pendingEvents.length,
            message: `${pendingEvents.length} evenimente au fost trimise pentru aprobare. Secretarii au fost notificați.`
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
