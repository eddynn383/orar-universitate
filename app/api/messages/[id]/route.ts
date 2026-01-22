/**
 * @fileoverview API routes for individual message operations (edit, delete)
 *
 * @module app/api/messages/[id]
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
 * PATCH /api/messages/[id]
 *
 * Edits a message (only sender can edit their own messages).
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - Message ID
 *
 * @body {string} content - New message content
 *
 * @returns {Promise<Response>} JSON response with updated message
 *
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not the sender
 * @throws {404} If message not found
 * @throws {400} If content is missing
 * @throws {500} If database operation fails
 *
 * @requires Authentication
 */
export async function PATCH(
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
                "Content is required",
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Găsește mesajul
        const message = await prisma.message.findUnique({
            where: { id }
        })

        if (!message) {
            return errorResponse(
                "Message not found",
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        // Verifică dacă utilizatorul este sender-ul mesajului
        if (message.senderId !== authResult.user.id) {
            return errorResponse(
                "You can only edit your own messages",
                API_ERRORS.FORBIDDEN.status,
                API_ERRORS.FORBIDDEN.code
            )
        }

        // Verifică dacă mesajul este deja șters
        if (message.isDeleted) {
            return errorResponse(
                "Cannot edit deleted message",
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Actualizează mesajul
        const updatedMessage = await prisma.message.update({
            where: { id },
            data: {
                content: content.trim(),
                isEdited: true
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
                },
                attachments: true,
                reactions: {
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
        })

        // Emite eveniment Socket.io
        if (global.io) {
            global.io.to(`conversation:${message.conversationId}`).emit('message_edited', updatedMessage)
        }

        return successResponse(updatedMessage)

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
 * DELETE /api/messages/[id]
 *
 * Soft deletes a message (only sender can delete their own messages).
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 * @param {Object} params - Route parameters
 * @param {string} params.id - Message ID
 *
 * @returns {Promise<Response>} JSON response with success status
 *
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not the sender
 * @throws {404} If message not found
 * @throws {500} If database operation fails
 *
 * @requires Authentication
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params

        // Găsește mesajul
        const message = await prisma.message.findUnique({
            where: { id }
        })

        if (!message) {
            return errorResponse(
                "Message not found",
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        // Verifică dacă utilizatorul este sender-ul mesajului
        if (message.senderId !== authResult.user.id) {
            return errorResponse(
                "You can only delete your own messages",
                API_ERRORS.FORBIDDEN.status,
                API_ERRORS.FORBIDDEN.code
            )
        }

        // Soft delete - marchează mesajul ca șters
        const deletedMessage = await prisma.message.update({
            where: { id },
            data: {
                isDeleted: true,
                content: "Mesaj șters" // Înlocuiește conținutul
            }
        })

        // Emite eveniment Socket.io
        if (global.io) {
            global.io.to(`conversation:${message.conversationId}`).emit('message_deleted', {
                messageId: id,
                conversationId: message.conversationId
            })
        }

        return successResponse({ success: true, message: deletedMessage })

    } catch (error) {
        console.error("API Error:", error)
        return errorResponse(
            API_ERRORS.INTERNAL_ERROR.message,
            API_ERRORS.INTERNAL_ERROR.status,
            API_ERRORS.INTERNAL_ERROR.code
        )
    }
}
