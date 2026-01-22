"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/Avatar"
import { Button } from "@/components/Button"
import { MessageSquarePlus } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ro } from "date-fns/locale"

interface User {
    id: string
    firstname: string | null
    lastname: string | null
    email: string | null
    image: string | null
    role: string
}

interface Message {
    id: string
    content: string
    createdAt: string
    sender: User
}

interface Conversation {
    id: string
    type: string
    title: string | null
    participants: Array<{
        user: User
        lastReadAt: string | null
    }>
    lastMessage: Message | null
    unreadCount: number
    updatedAt: string
}

interface ConversationListProps {
    onSelectConversation: (conversationId: string) => void
    onNewConversation: () => void
    selectedConversationId?: string | null
    currentUserId?: string
}

export function ConversationList({
    onSelectConversation,
    onNewConversation,
    selectedConversationId,
    currentUserId
}: ConversationListProps) {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadConversations()
    }, [])

    const loadConversations = async () => {
        try {
            const response = await fetch('/api/conversations')
            const data = await response.json()

            if (data.success) {
                setConversations(data.data)
            }
        } catch (error) {
            console.error('Error loading conversations:', error)
        } finally {
            setLoading(false)
        }
    }

    const getConversationTitle = (conversation: Conversation) => {
        if (conversation.type === 'GROUP') {
            return conversation.title || 'Conversație de grup'
        }

        // Pentru conversații directe, afișează numele celuilalt participant
        const otherParticipant = conversation.participants.find(
            p => p.user.id !== currentUserId
        )

        return (otherParticipant?.user.firstname + " " + otherParticipant?.user.lastname) || otherParticipant?.user.email || 'Utilizator'
    }

    const getConversationAvatar = (conversation: Conversation) => {
        if (conversation.type === 'GROUP') {
            return null
        }

        const otherParticipant = conversation.participants.find(
            p => p.user.id !== currentUserId
        )

        return otherParticipant?.user.image || null
    }

    const getInitials = (name: string) => {
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
                <p className="text-muted-foreground">Se încarcă conversațiile...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-xl font-semibold">Mesaje</h2>
                <Button
                    variant="ghost"
                    size="icon-m"
                    onClick={onNewConversation}
                    title="Conversație nouă"
                >
                    <MessageSquarePlus className="h-5 w-5" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                        <MessageSquarePlus className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Nu ai nicio conversație</p>
                        <Button
                            variant="outline"
                            className="mt-4"
                            onClick={onNewConversation}
                        >
                            Începe o conversație
                        </Button>
                    </div>
                ) : (
                    <div className="divide-y">
                        {conversations.map((conversation) => {
                            console.log("conversation: ", conversation);
                            return (
                                <button
                                    key={conversation.id}
                                    onClick={() => onSelectConversation(conversation.id)}
                                    className={`w-full p-4 text-left hover:bg-accent transition-colors ${selectedConversationId === conversation.id
                                        ? 'bg-accent'
                                        : ''
                                        }`}
                                >
                                    <div className="flex gap-3">
                                        <Avatar>
                                            <AvatarImage src={getConversationAvatar(conversation) || undefined} />
                                            <AvatarFallback>
                                                {getInitials(getConversationTitle(conversation))}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <h3 className="font-semibold truncate">
                                                    {getConversationTitle(conversation)}
                                                </h3>
                                                {conversation.lastMessage && (
                                                    <span className="text-xs text-muted-foreground ml-2">
                                                        {formatDistanceToNow(
                                                            new Date(conversation.lastMessage.createdAt),
                                                            { addSuffix: true, locale: ro }
                                                        )}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {conversation.lastMessage
                                                        ? conversation.lastMessage.content
                                                        : 'Niciun mesaj'}
                                                </p>
                                                {conversation.unreadCount > 0 && (
                                                    <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                                        {conversation.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
