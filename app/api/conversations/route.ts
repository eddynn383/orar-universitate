/**
 * @fileoverview API routes for managing conversations
 *
 * This module handles CRUD operations for conversations, allowing users
 * to retrieve their conversations and create new ones.
 *
 * @module app/api/conversations
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
 * GET /api/conversations
 *
 * Retrieves a paginated list of conversations for the authenticated user.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 *
 * @query {number} [page=1] - Page number for pagination
 * @query {number} [limit=20] - Number of items per page
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - data: Array of conversation objects with participants and last message
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

        // Găsește toate conversațiile unde utilizatorul este participant
        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: {
                        userId: authResult.user.id
                    }
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstname: true,
                                lastname: true,
                                email: true,
                                image: true,
                                role: true
                            }
                        }
                    }
                },
                messages: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1,
                    include: {
                        sender: {
                            select: {
                                id: true,
                                firstname: true,
                                lastname: true,
                                image: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        messages: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            },
            skip: (params.page - 1) * params.limit,
            take: params.limit
        })

        const total = await prisma.conversation.count({
            where: {
                participants: {
                    some: {
                        userId: authResult.user.id
                    }
                }
            }
        })

        // Calculează numărul de mesaje necitite pentru fiecare conversație
        const conversationsWithUnreadCount = await Promise.all(
            conversations.map(async (conv) => {
                const participant = conv.participants.find(p => p.userId === authResult.user.id)
                const unreadCount = await prisma.message.count({
                    where: {
                        conversationId: conv.id,
                        senderId: { not: authResult.user.id },
                        createdAt: {
                            gt: participant?.lastReadAt || new Date(0)
                        }
                    }
                })

                return {
                    ...conv,
                    unreadCount,
                    lastMessage: conv.messages[0] || null
                }
            })
        )

        return successResponse(conversationsWithUnreadCount, {
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

/**
 * POST /api/conversations
 *
 * Creates a new conversation or returns existing one for direct messages.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 *
 * @body {string[]} participantIds - Array of user IDs to include in conversation
 * @body {string} [type] - Conversation type (DIRECT or GROUP)
 * @body {string} [title] - Title for group conversations
 *
 * @returns {Promise<Response>} JSON response containing the created/existing conversation
 *
 * @throws {401} If user is not authenticated
 * @throws {400} If request body is invalid
 * @throws {500} If database operation fails
 *
 * @requires Authentication
 */
export async function POST(request: NextRequest) {
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const body = await request.json()
        const { participantIds, type = 'DIRECT', title } = body

        if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
            return errorResponse(
                "Participant IDs are required",
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Include current user in participants if not already included
        const allParticipantIds = [...new Set([authResult.user.id, ...participantIds])]

        // Pentru conversații directe, verifică dacă există deja o conversație între acești utilizatori
        if (type === 'DIRECT' && allParticipantIds.length === 2) {
            const existingConversation = await prisma.conversation.findFirst({
                where: {
                    type: 'DIRECT',
                    AND: allParticipantIds.map(userId => ({
                        participants: {
                            some: { userId }
                        }
                    }))
                },
                include: {
                    participants: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstname: true,
                                lastname: true,
                                    email: true,
                                    image: true,
                                    role: true
                                }
                            }
                        }
                    }
                }
            })

            if (existingConversation) {
                return successResponse(existingConversation)
            }
        }

        // Creează conversația nouă
        const conversation = await prisma.conversation.create({
            data: {
                type,
                title: type === 'GROUP' ? title : null,
                participants: {
                    create: allParticipantIds.map(userId => ({
                        userId
                    }))
                }
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstname: true,
                                lastname: true,
                                email: true,
                                image: true,
                                role: true
                            }
                        }
                    }
                }
            }
        })

        return successResponse(conversation, undefined, 201)

    } catch (error) {
        console.error("API Error:", error)
        return errorResponse(
            API_ERRORS.INTERNAL_ERROR.message,
            API_ERRORS.INTERNAL_ERROR.status,
            API_ERRORS.INTERNAL_ERROR.code
        )
    }
}
