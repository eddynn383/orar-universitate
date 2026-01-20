"use client"

import { useEffect, useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/Avatar"
import { MessageInput } from "./message-input"
import { useSocket } from "@/app/contexts/socket-context"
import { formatDistanceToNow } from "date-fns"
import { ro } from "date-fns/locale"
import { Loader2 } from "lucide-react"

interface User {
    id: string
    name: string | null
    email: string | null
    image: string | null
    role: string
}

interface Message {
    id: string
    content: string
    createdAt: string
    sender: User
    isEdited: boolean
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

        // Ascultă mesaje noi
        socket.on('new_message', (message: Message) => {
            if (message.sender.id !== currentUserId) {
                setMessages(prev => [...prev, message])
                markMessagesAsRead()
            }
        })

        // Ascultă typing indicators
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
            socket.off('user_typing')
            socket.off('user_stopped_typing')
        }
    }, [socket, currentUserId, conversationId])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const loadMessages = async () => {
        try {
            const response = await fetch(`/api/conversations/${conversationId}/messages`)
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

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const getInitials = (name: string | null) => {
        if (!name) return '?'
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">
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
                                <div
                                    key={message.id}
                                    className={`flex gap-3 ${
                                        isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                                    }`}
                                >
                                    {showAvatar ? (
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={message.sender.image || undefined} />
                                            <AvatarFallback className="text-xs">
                                                {getInitials(message.sender.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                    ) : (
                                        <div className="h-8 w-8" />
                                    )}

                                    <div
                                        className={`flex flex-col max-w-[70%] ${
                                            isOwnMessage ? 'items-end' : 'items-start'
                                        }`}
                                    >
                                        {showAvatar && !isOwnMessage && (
                                            <span className="text-xs font-medium mb-1">
                                                {message.sender.name || message.sender.email}
                                            </span>
                                        )}
                                        <div
                                            className={`rounded-lg px-4 py-2 ${
                                                isOwnMessage
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted'
                                            }`}
                                        >
                                            <p className="text-sm whitespace-pre-wrap break-words">
                                                {message.content}
                                            </p>
                                        </div>
                                        <span className="text-xs text-muted-foreground mt-1">
                                            {formatDistanceToNow(new Date(message.createdAt), {
                                                addSuffix: true,
                                                locale: ro
                                            })}
                                            {message.isEdited && ' • editat'}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Typing indicator */}
            {typingUsers.size > 0 && (
                <div className="px-4 py-2 text-sm text-muted-foreground italic">
                    Scrie...
                </div>
            )}

            {/* Message input */}
            <div className="border-t p-4">
                <MessageInput
                    onSendMessage={handleSendMessage}
                    conversationId={conversationId}
                />
            </div>
        </div>
    )
}
