/**
 * @fileoverview API route for searching messages
 *
 * @module app/api/messages/search
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
 * GET /api/messages/search
 *
 * Searches messages across all conversations the user is part of.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 *
 * @query {string} q - Search query
 * @query {string} [conversationId] - Optional conversation ID to limit search
 * @query {number} [page=1] - Page number for pagination
 * @query {number} [limit=20] - Number of results per page
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - data: Array of matching messages with conversation info
 *   - meta: Pagination metadata
 *
 * @throws {401} If user is not authenticated
 * @throws {400} If search query is missing
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
        const query = searchParams.get("q")
        const conversationId = searchParams.get("conversationId")

        if (!query || query.trim().length === 0) {
            return errorResponse(
                "Search query is required",
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Găsește toate conversațiile unde utilizatorul este participant
        const userConversations = await prisma.conversationParticipant.findMany({
            where: {
                userId: authResult.user.id
            },
            select: {
                conversationId: true
            }
        })

        const conversationIds = userConversations.map(c => c.conversationId)

        // Construiește where clause pentru căutare
        const where: any = {
            conversationId: conversationId ? conversationId : { in: conversationIds },
            isDeleted: false,
            content: {
                contains: query,
                mode: 'insensitive'
            }
        }

        const total = await prisma.message.count({ where })

        const messages = await prisma.message.findMany({
            where,
            include: {
                sender: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        email: true,
                        image: true,
                        role: true
                    }
                },
                conversation: {
                    select: {
                        id: true,
                        type: true,
                        title: true,
                        participants: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        firstname: true,
                        lastname: true,
                                        image: true
                                    }
                                }
                            }
                        }
                    }
                },
                attachments: true
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: (params.page - 1) * params.limit,
            take: params.limit
        })

        return successResponse(messages, {
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
