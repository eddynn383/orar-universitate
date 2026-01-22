/**
 * @fileoverview API routes for managing user notifications
 *
 * This module handles CRUD operations for notifications, allowing users
 * to retrieve their notifications and mark them as read.
 *
 * @module app/api/notifications
 */

import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
    successResponse,
    errorResponse,
    requireAuth,
    parseQueryParams,
    API_ERRORS
} from "@/lib/api-utils"

/**
 * GET /api/notifications
 *
 * Retrieves a paginated list of notifications for the authenticated user.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 *
 * @query {number} [page=1] - Page number for pagination
 * @query {number} [limit=50] - Number of items per page (max: 100)
 * @query {boolean} [unreadOnly=false] - Only show unread notifications
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - data: Array of notification objects
 *   - meta: Pagination metadata (total, page, limit, totalPages, unreadCount)
 *
 * @throws {401} If user is not authenticated
 * @throws {500} If database operation fails
 *
 * @requires Authentication
 */
export async function GET(request: NextRequest) {
    // Verifică autentificarea
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { searchParams } = new URL(request.url)
        const params = parseQueryParams(searchParams)
        const unreadOnly = searchParams.get("unreadOnly") === "true"

        const where: any = {
            userId: authResult.user.id
        }

        if (unreadOnly) {
            where.read = false
        }

        const total = await prisma.notification.count({ where })
        const unreadCount = await prisma.notification.count({
            where: {
                userId: authResult.user.id,
                read: false
            }
        })

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: {
                createdAt: 'desc'
            },
            skip: (params.page - 1) * params.limit,
            take: params.limit
        })

        return successResponse(notifications, {
            total,
            page: params.page,
            limit: params.limit,
            totalPages: Math.ceil(total / params.limit)
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
