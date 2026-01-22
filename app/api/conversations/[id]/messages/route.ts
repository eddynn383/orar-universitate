/**
 * @fileoverview API routes for managing messages in a conversation
 *
 * @module app/api/conversations/[id]/messages
 */

import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"

// Extend the global type to include 'io'
declare global {
    // Replace 'any' with the actual type of your io instance if available
    // For example, if using socket.io: import type { Server as IOServer } from "socket.io";
    // and then: var io: IOServer;
    // Here we use 'any' for general compatibility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    var io: any;
}
import {
    successResponse,
    errorResponse,
    requireAuth,
    parseQueryParams,
    API_ERRORS
} from "@/lib/api-utils"

/**
 * GET /api/conversations/[id]/messages
 *
 * Retrieves messages from a specific conversation.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - Conversation ID
 *
 * @query {number} [page=1] - Page number for pagination
 * @query {number} [limit=50] - Number of messages per page
 * @query {string} [before] - Get messages before this timestamp (ISO string)
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - data: Array of message objects
 *   - meta: Pagination metadata
 *
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not a participant in the conversation
 * @throws {404} If conversation not found
 * @throws {500} If database operation fails
 *
 * @requires Authentication
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params
        const { searchParams } = new URL(request.url)
        const queryParams = parseQueryParams(searchParams)
        const before = searchParams.get("before")

        // Verifică dacă utilizatorul este participant în conversație
        const participant = await prisma.conversationParticipant.findFirst({
            where: {
                conversationId: id,
                userId: authResult.user.id
            }
        })

        if (!participant) {
            return errorResponse(
                "You are not a participant in this conversation",
                API_ERRORS.FORBIDDEN.status,
                API_ERRORS.FORBIDDEN.code
            )
        }

        // Construiește where clause pentru mesaje
        const where: any = {
            conversationId: id,
            isDeleted: false
        }

        if (before) {
            where.createdAt = {
                lt: new Date(before)
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
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: (queryParams.page - 1) * queryParams.limit,
            take: queryParams.limit
        })

        // Inversează ordinea pentru a afișa cele mai vechi mesaje primele
        const reversedMessages = messages.reverse()

        return successResponse(reversedMessages, {
            total,
            page: queryParams.page,
            limit: queryParams.limit,
            totalPages: Math.ceil(total / queryParams.limit)
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
 * POST /api/conversations/[id]/messages
 *
 * Sends a new message in a conversation.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - Conversation ID
 *
 * @body {string} content - Message content
 *
 * @returns {Promise<Response>} JSON response containing the created message
 *
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not a participant in the conversation
 * @throws {400} If message content is empty
 * @throws {500} If database operation fails
 *
 * @requires Authentication
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params
        const body = await request.json()
        const { content } = body

        if (!content || content.trim().length === 0) {
            return errorResponse(
                "Message content is required",
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Verifică dacă utilizatorul este participant în conversație
        const participant = await prisma.conversationParticipant.findFirst({
            where: {
                conversationId: id,
                userId: authResult.user.id
            }
        })

        if (!participant) {
            return errorResponse(
                "You are not a participant in this conversation",
                API_ERRORS.FORBIDDEN.status,
                API_ERRORS.FORBIDDEN.code
            )
        }

        // Creează mesajul
        const message = await prisma.message.create({
            data: {
                conversationId: id,
                senderId: authResult.user.id,
                content: content.trim()
            },
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
                }
            }
        })

        // Actualizează timestamp-ul conversației
        await prisma.conversation.update({
            where: { id },
            data: { updatedAt: new Date() }
        })

        // Emite eveniment Socket.io pentru mesaj nou
        if (global.io) {
            global.io.to(`conversation:${id}`).emit('new_message', message)
        }

        // Trimite notificare celorlalți participanți
        const otherParticipants = await prisma.conversationParticipant.findMany({
            where: {
                conversationId: id,
                userId: { not: authResult.user.id }
            },
            include: {
                user: {
                    select: { id: true, firstname: true, lastname: true }
                }
            }
        })

        for (const otherParticipant of otherParticipants) {
            // Trimite notificare Socket.io
            if (global.io) {
                global.io.to(`user:${otherParticipant.userId}`).emit('conversation_updated', {
                    conversationId: id,
                    message
                })
            }

            // Creează notificare în baza de date
            await prisma.notification.create({
                data: {
                    userId: otherParticipant.userId,
                    title: 'Mesaj nou',
                    message: `${authResult.user.name || 'Cineva'} ți-a trimis un mesaj`,
                    type: 'INFO'
                }
            })
        }

        return successResponse(message, undefined, 201)

    } catch (error) {
        console.error("API Error:", error)
        return errorResponse(
            API_ERRORS.INTERNAL_ERROR.message,
            API_ERRORS.INTERNAL_ERROR.status,
            API_ERRORS.INTERNAL_ERROR.code
        )
    }
}
