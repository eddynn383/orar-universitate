/**
 * @fileoverview API route for marking all notifications as read
 *
 * @module app/api/notifications/mark-all-read
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
 * PUT /api/notifications/mark-all-read
 *
 * Marks all notifications as read for the authenticated user.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - success: true
 *   - data: { count, message }
 *
 * @throws {401} If user is not authenticated
 * @throws {500} If database operation fails
 *
 * @requires Authentication
 */
export async function PUT(request: NextRequest) {
    // Verifică autentificarea
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        // Marchează toate notificările utilizatorului ca citite
        const result = await prisma.notification.updateMany({
            where: {
                userId: authResult.user.id,
                read: false
            },
            data: {
                read: true
            }
        })

        return successResponse({
            count: result.count,
            message: `${result.count} notificări au fost marcate ca citite`
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
