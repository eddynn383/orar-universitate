/**
 * @fileoverview API route for marking messages as read
 *
 * @module app/api/conversations/[id]/read
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
 * POST /api/conversations/[id]/read
 *
 * Marks all messages in a conversation as read for the current user.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - Conversation ID
 *
 * @returns {Promise<Response>} JSON response with success status
 *
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not a participant in the conversation
 * @throws {404} If conversation not found
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

        // Verifică și actualizează participant
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

        // Actualizează lastReadAt
        await prisma.conversationParticipant.update({
            where: {
                id: participant.id
            },
            data: {
                lastReadAt: new Date()
            }
        })

        // Emite eveniment Socket.io
        if (global.io) {
            global.io.to(`conversation:${id}`).emit('messages_read', {
                userId: authResult.user.id,
                conversationId: id,
                timestamp: new Date()
            })
        }

        return successResponse({ success: true })

    } catch (error) {
        console.error("API Error:", error)
        return errorResponse(
            API_ERRORS.INTERNAL_ERROR.message,
            API_ERRORS.INTERNAL_ERROR.status,
            API_ERRORS.INTERNAL_ERROR.code
        )
    }
}
