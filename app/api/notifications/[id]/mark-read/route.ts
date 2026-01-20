/**
 * @fileoverview API route for marking a notification as read
 *
 * @module app/api/notifications/[id]/mark-read
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
 * PUT /api/notifications/[id]/mark-read
 *
 * Marks a specific notification as read.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {Object} context - Route context
 * @param {Object} context.params - Route parameters
 * @param {string} context.params.id - Notification ID
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - success: true
 *   - data: { message }
 *
 * @throws {401} If user is not authenticated
 * @throws {403} If user tries to mark another user's notification
 * @throws {404} If notification not found
 * @throws {500} If database operation fails
 *
 * @requires Authentication
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // Verifică autentificarea
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params

        // Verifică dacă notificarea există și aparține utilizatorului
        const notification = await prisma.notification.findUnique({
            where: { id }
        })

        if (!notification) {
            return errorResponse(
                "Notificarea nu a fost găsită",
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        if (notification.userId !== authResult.user.id) {
            return errorResponse(
                "Nu aveți permisiunea de a modifica această notificare",
                403,
                "FORBIDDEN"
            )
        }

        // Marchează notificarea ca citită
        await prisma.notification.update({
            where: { id },
            data: { read: true }
        })

        return successResponse({
            message: "Notificare marcată ca citită"
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
