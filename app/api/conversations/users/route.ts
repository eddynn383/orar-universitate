/**
 * @fileoverview API route for getting available users for conversations
 *
 * @module app/api/conversations/users
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
 * GET /api/conversations/users
 *
 * Retrieves a list of users that the authenticated user can start a conversation with.
 * Filters based on role permissions (e.g., students can message teachers, etc.)
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 *
 * @query {string} [search] - Search term for filtering users by name or email
 * @query {string} [role] - Filter by user role
 * @query {number} [page=1] - Page number for pagination
 * @query {number} [limit=20] - Number of items per page
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - data: Array of user objects (id, name, email, image, role)
 *   - meta: Pagination metadata
 *
 * @throws {401} If user is not authenticated
 * @throws {500} If database operation fails
 *
 * @requires Authentication
 */
export async function GET(request: NextRequest) {
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { searchParams } = new URL(request.url)
        const params = parseQueryParams(searchParams)
        const search = searchParams.get("search")
        const roleFilter = searchParams.get("role")

        // Construiește where clause
        const where: any = {
            id: { not: authResult.user.id }, // Exclude current user
        }

        // Adaugă filtru de căutare
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ]
        }

        // Adaugă filtru de rol
        if (roleFilter) {
            where.role = roleFilter
        }

        const total = await prisma.user.count({ where })

        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
                image: true,
                role: true
            },
            orderBy: [
                { lastname: 'asc' },
                { firstname: 'asc' }
            ],
            skip: (params.page - 1) * params.limit,
            take: params.limit
        })

        return successResponse(users, {
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
