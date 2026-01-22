/**
 * @fileoverview API routes for message reactions
 *
 * @module app/api/messages/[id]/reactions
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
 * POST /api/messages/[id]/reactions
 *
 * Adds a reaction to a message (toggle behavior - adds if not exists, removes if exists).
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - Message ID
 *
 * @body {string} emoji - Emoji to react with
 *
 * @returns {Promise<Response>} JSON response with success status
 *
 * @throws {401} If user is not authenticated
 * @throws {404} If message not found
 * @throws {400} If emoji is missing
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
        const { emoji } = body

        if (!emoji || typeof emoji !== 'string') {
            return errorResponse(
                "Emoji is required",
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Verifică dacă mesajul există
        const message = await prisma.message.findUnique({
            where: { id },
            include: {
                conversation: {
                    include: {
                        participants: {
                            where: { userId: authResult.user.id }
                        }
                    }
                }
            }
        })

        if (!message) {
            return errorResponse(
                "Message not found",
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        // Verifică dacă utilizatorul este participant în conversație
        if (message.conversation.participants.length === 0) {
            return errorResponse(
                "You are not a participant in this conversation",
                API_ERRORS.FORBIDDEN.status,
                API_ERRORS.FORBIDDEN.code
            )
        }

        // Toggle reaction - verifică dacă există deja
        const existingReaction = await prisma.messageReaction.findUnique({
            where: {
                messageId_userId_emoji: {
                    messageId: id,
                    userId: authResult.user.id,
                    emoji
                }
            }
        })

        let reaction
        let action: 'added' | 'removed'

        if (existingReaction) {
            // Remove reaction
            await prisma.messageReaction.delete({
                where: { id: existingReaction.id }
            })
            reaction = null
            action = 'removed'
        } else {
            // Add reaction
            reaction = await prisma.messageReaction.create({
                data: {
                    messageId: id,
                    userId: authResult.user.id,
                    emoji
                },
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
            })
            action = 'added'
        }

        // Emite eveniment Socket.io
        if (global.io) {
            global.io.to(`conversation:${message.conversationId}`).emit('message_reaction', {
                messageId: id,
                userId: authResult.user.id,
                emoji,
                action,
                reaction
            })
        }

        return successResponse({ action, reaction })

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
 * GET /api/messages/[id]/reactions
 *
 * Gets all reactions for a message.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - Message ID
 *
 * @returns {Promise<Response>} JSON response containing reactions grouped by emoji
 *
 * @throws {401} If user is not authenticated
 * @throws {404} If message not found
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

        const reactions = await prisma.messageReaction.findMany({
            where: { messageId: id },
            include: {
                user: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        image: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        })

        // Group by emoji
        const groupedReactions = reactions.reduce((acc, reaction) => {
            if (!acc[reaction.emoji]) {
                acc[reaction.emoji] = []
            }
            acc[reaction.emoji].push(reaction)
            return acc
        }, {} as Record<string, typeof reactions>)

        return successResponse(groupedReactions)

    } catch (error) {
        console.error("API Error:", error)
        return errorResponse(
            API_ERRORS.INTERNAL_ERROR.message,
            API_ERRORS.INTERNAL_ERROR.status,
            API_ERRORS.INTERNAL_ERROR.code
        )
    }
}
