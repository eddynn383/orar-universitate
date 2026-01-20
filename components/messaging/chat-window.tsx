"use client"

import { useEffect, useState, useRef } from "react"
import { MessageInput } from "./message-input"
import { MessageItem } from "./message-item"
import { useSocket } from "@/app/contexts/socket-context"
import { Loader2 } from "lucide-react"

interface User {
    id: string
    name: string | null
    email: string | null
    image: string | null
    role: string
}

interface Reaction {
    id: string
    emoji: string
    user: User
}

interface Message {
    id: string
    content: string
    createdAt: string
    sender: User
    isEdited: boolean
    isDeleted: boolean
    reactions?: Reaction[]
}

interface ChatWindowProps {
    conversationId: string
    currentUserId: string
}

export function ChatWindow({ conversationId, currentUserId }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(true)
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const { socket, joinConversation, leaveConversation, markAsRead } = useSocket()

    useEffect(() => {
        loadMessages()
        joinConversation(conversationId)

        // Mark messages as read when opening conversation
        markMessagesAsRead()

        return () => {
            leaveConversation(conversationId)
        }
    }, [conversationId])

    useEffect(() => {
        if (!socket) return

        // Listen for new messages
        socket.on('new_message', (message: Message) => {
            setMessages(prev => [...prev, message])
            if (message.sender.id !== currentUserId) {
                markMessagesAsRead()
            }
        })

        // Listen for message edits
        socket.on('message_edited', (editedMessage: Message) => {
            setMessages(prev =>
                prev.map(msg => msg.id === editedMessage.id ? editedMessage : msg)
            )
        })

        // Listen for message deletions
        socket.on('message_deleted', ({ messageId }: { messageId: string }) => {
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === messageId
                        ? { ...msg, isDeleted: true, content: 'Mesaj șters' }
                        : msg
                )
            )
        })

        // Listen for reactions
        socket.on('message_reaction', ({ messageId, reaction, action }: any) => {
            if (action === 'added' && reaction) {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === messageId
                            ? {
                                ...msg,
                                reactions: [...(msg.reactions || []), reaction]
                            }
                            : msg
                    )
                )
            } else if (action === 'removed') {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === messageId
                            ? {
                                ...msg,
                                reactions: (msg.reactions || []).filter(
                                    r => !(r.user.id === reaction?.user?.id && r.emoji === reaction?.emoji)
                                )
                            }
                            : msg
                    )
                )
            }
        })

        // Listen for typing indicators
        socket.on('user_typing', ({ userId }: { userId: string }) => {
            if (userId !== currentUserId) {
                setTypingUsers(prev => new Set(prev).add(userId))
            }
        })

        socket.on('user_stopped_typing', ({ userId }: { userId: string }) => {
            setTypingUsers(prev => {
                const newSet = new Set(prev)
                newSet.delete(userId)
                return newSet
            })
        })

        return () => {
            socket.off('new_message')
            socket.off('message_edited')
            socket.off('message_deleted')
            socket.off('message_reaction')
            socket.off('user_typing')
            socket.off('user_stopped_typing')
        }
    }, [socket, currentUserId, conversationId])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const loadMessages = async () => {
        try {
            const response = await fetch(`/api/conversations/${conversationId}/messages?include=reactions`)
            const data = await response.json()

            if (data.success) {
                setMessages(data.data)
            }
        } catch (error) {
            console.error('Error loading messages:', error)
        } finally {
            setLoading(false)
        }
    }

    const markMessagesAsRead = async () => {
        try {
            await fetch(`/api/conversations/${conversationId}/read`, {
                method: 'POST'
            })
            markAsRead(conversationId)
        } catch (error) {
            console.error('Error marking messages as read:', error)
        }
    }

    const handleSendMessage = async (content: string) => {
        try {
            const response = await fetch(`/api/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content })
            })

            const data = await response.json()

            if (data.success) {
                setMessages(prev => [...prev, data.data])
            }
        } catch (error) {
            console.error('Error sending message:', error)
        }
    }

    const handleEditMessage = async (messageId: string, newContent: string) => {
        try {
            const response = await fetch(`/api/messages/${messageId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: newContent })
            })

            const data = await response.json()

            if (data.success) {
                setMessages(prev =>
                    prev.map(msg => msg.id === messageId ? data.data : msg)
                )
            }
        } catch (error) {
            console.error('Error editing message:', error)
            throw error
        }
    }

    const handleDeleteMessage = async (messageId: string) => {
        try {
            const response = await fetch(`/api/messages/${messageId}`, {
                method: 'DELETE'
            })

            const data = await response.json()

            if (data.success) {
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === messageId
                            ? { ...msg, isDeleted: true, content: 'Mesaj șters' }
                            : msg
                    )
                )
            }
        } catch (error) {
            console.error('Error deleting message:', error)
            throw error
        }
    }

    const handleReaction = async (messageId: string, emoji: string) => {
        try {
            const response = await fetch(`/api/messages/${messageId}/reactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ emoji })
            })

            const data = await response.json()

            if (data.success) {
                const { action, reaction } = data.data

                if (action === 'added' && reaction) {
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.id === messageId
                                ? {
                                    ...msg,
                                    reactions: [...(msg.reactions || []), reaction]
                                }
                                : msg
                        )
                    )
                } else if (action === 'removed') {
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.id === messageId
                                ? {
                                    ...msg,
                                    reactions: (msg.reactions || []).filter(
                                        r => !(r.user.id === currentUserId && r.emoji === emoji)
                                    )
                                }
                                : msg
                        )
                    )
                }
            }
        } catch (error) {
            console.error('Error adding reaction:', error)
            throw error
        }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-primary-600 text-sm">
                            Niciun mesaj. Începe conversația!
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((message, index) => {
                            const isOwnMessage = message.sender.id === currentUserId
                            const showAvatar =
                                index === 0 ||
                                messages[index - 1].sender.id !== message.sender.id

                            return (
                                <MessageItem
                                    key={message.id}
                                    message={message}
                                    isOwnMessage={isOwnMessage}
                                    showAvatar={showAvatar}
                                    currentUserId={currentUserId}
                                    onEdit={handleEditMessage}
                                    onDelete={handleDeleteMessage}
                                    onReact={handleReaction}
                                />
                            )
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Typing indicator */}
            {typingUsers.size > 0 && (
                <div className="px-3 py-2 text-xs text-primary-600 italic">
                    Scrie...
                </div>
            )}

            {/* Message input */}
            <div className="border-t border-primary-200 p-3">
                <MessageInput
                    onSendMessage={handleSendMessage}
                    conversationId={conversationId}
                />
            </div>
        </div>
    )
}
