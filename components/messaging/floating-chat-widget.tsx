"use client"

import { useState, useEffect, useRef } from "react"
import { MessageCircle, X, ArrowLeft, Search, Bell, BellOff } from "lucide-react"
import { Button } from "@/components/Button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/Avatar"
import { Input } from "@/components/Input"
import { ChatWindow } from "./chat-window"
import { NewConversationDialog } from "./new-conversation-dialog"
import { useSocket } from "@/app/contexts/socket-context"
import { useNotifications } from "@/app/hooks/use-notifications"
import { formatDistanceToNow } from "date-fns"
import { ro } from "date-fns/locale"
import { useSession } from "next-auth/react"

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

export function FloatingChatWidget() {
    const { data: session } = useSession()
    const [isOpen, setIsOpen] = useState(false)
    const [view, setView] = useState<'list' | 'chat'>('list')
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [totalUnreadCount, setTotalUnreadCount] = useState(0)
    const [loading, setLoading] = useState(false)
    const [showNewConversationDialog, setShowNewConversationDialog] = useState(false)
    const { socket } = useSocket()
    const { permission, isSupported, requestPermission } = useNotifications()

    // Refs for click outside detection
    const popoverRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)

    // Handle click outside to close popover
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                isOpen &&
                popoverRef.current &&
                buttonRef.current &&
                !popoverRef.current.contains(event.target as Node) &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    // Load conversations when widget opens
    useEffect(() => {
        if (isOpen && session?.user) {
            loadConversations()
        }
    }, [isOpen, session?.user])

    // Filter conversations based on search
    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = conversations.filter(conv => {
                const title = getConversationTitle(conv)
                return title.toLowerCase().includes(searchQuery.toLowerCase())
            })
            setFilteredConversations(filtered)
        } else {
            setFilteredConversations(conversations)
        }
    }, [searchQuery, conversations])

    // Update total unread count
    useEffect(() => {
        const total = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)
        setTotalUnreadCount(total)
    }, [conversations])

    // Listen for new messages via Socket.io
    useEffect(() => {
        if (!socket) return

        socket.on('conversation_updated', ({ conversationId }) => {
            loadConversations()
        })

        return () => {
            socket.off('conversation_updated')
        }
    }, [socket])

    const loadConversations = async () => {
        setLoading(true)
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

    const handleSelectConversation = (conversationId: string) => {
        setSelectedConversationId(conversationId)
        setView('chat')
    }

    const handleBackToList = () => {
        setView('list')
        setSelectedConversationId(null)
        loadConversations() // Refresh to update unread counts
    }

    const handleClose = () => {
        setIsOpen(false)
        setView('list')
        setSelectedConversationId(null)
        setSearchQuery("")
    }

    const handleConversationCreated = (conversationId: string) => {
        loadConversations()
        setSelectedConversationId(conversationId)
        setView('chat')
    }

    const getConversationTitle = (conversation: Conversation) => {
        if (conversation.type === 'GROUP') {
            return conversation.title || 'Conversație de grup'
        }

        const otherParticipant = conversation.participants.find(
            p => p.user.id !== session?.user?.id
        )

        return otherParticipant?.user.name || otherParticipant?.user.email || 'Utilizator'
    }

    const getConversationAvatar = (conversation: Conversation) => {
        if (conversation.type === 'GROUP') {
            return null
        }

        const otherParticipant = conversation.participants.find(
            p => p.user.id !== session?.user?.id
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

    if (!session?.user) {
        return null
    }

    return (
        <>
            {/* Floating Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    ref={buttonRef}
                    onClick={() => setIsOpen(!isOpen)}
                    className="relative flex items-center justify-center w-14 h-14 bg-brand-400 hover:bg-brand-500 text-brand-100 rounded-full shadow-lg transition-all hover:scale-110 focus:outline-none focus:ring-4 focus:ring-brand-400/50"
                    title="Mesaje"
                >
                    <MessageCircle className="w-6 h-6" />
                    {totalUnreadCount > 0 && (
                        <span className="absolute -top-1 -left-1 flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-blue-500 rounded-full border-2 border-white">
                            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Chat Widget Popover */}
            {isOpen && (
                <div
                    ref={popoverRef}
                    className="fixed bottom-24 right-6 z-50 w-96 h-[600px] bg-primary-100 border border-primary-200 rounded-lg shadow-2xl flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-primary-200 bg-primary-100">
                        {view === 'chat' ? (
                            <>
                                <button
                                    onClick={handleBackToList}
                                    className="p-1 hover:bg-primary-200 rounded"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <h2 className="text-lg font-semibold flex-1 text-center">
                                    {selectedConversationId &&
                                        getConversationTitle(
                                            conversations.find(c => c.id === selectedConversationId)!
                                        )}
                                </h2>
                            </>
                        ) : (
                            <>
                                <h2 className="text-lg font-semibold">Mesaje</h2>
                                <div className="flex gap-2">
                                    {isSupported && permission !== 'granted' && (
                                        <Button
                                            variant="ghost"
                                            size="icon-s"
                                            onClick={requestPermission}
                                            title="Activează notificări"
                                        >
                                            <BellOff className="w-4 h-4" />
                                        </Button>
                                    )}
                                    {isSupported && permission === 'granted' && (
                                        <Button
                                            variant="ghost"
                                            size="icon-s"
                                            title="Notificări active"
                                            disabled
                                        >
                                            <Bell className="w-4 h-4 text-success-400" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon-s"
                                        onClick={() => setShowNewConversationDialog(true)}
                                        title="Conversație nouă"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                    </Button>
                                </div>
                            </>
                        )}
                        <button
                            onClick={handleClose}
                            className="p-1 hover:bg-primary-200 rounded ml-2"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden">
                        {view === 'list' ? (
                            <div className="h-full flex flex-col">
                                {/* Search */}
                                <div className="p-3 border-b border-primary-200">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-600" />
                                        <Input
                                            placeholder="Caută conversații..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 h-9"
                                        />
                                    </div>
                                </div>

                                {/* Conversations List */}
                                <div className="flex-1 overflow-y-auto">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-full">
                                            <p className="text-primary-600 text-sm">Se încarcă...</p>
                                        </div>
                                    ) : filteredConversations.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                                            <MessageCircle className="w-12 h-12 text-primary-400 mb-2" />
                                            <p className="text-primary-600 text-sm">
                                                {searchQuery ? 'Nu s-au găsit conversații' : 'Nu ai conversații'}
                                            </p>
                                            {!searchQuery && (
                                                <Button
                                                    variant="outline"
                                                    size="S"
                                                    className="mt-3"
                                                    onClick={() => setShowNewConversationDialog(true)}
                                                >
                                                    Începe o conversație
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-primary-200">
                                            {filteredConversations.map((conversation) => (
                                                <button
                                                    key={conversation.id}
                                                    onClick={() => handleSelectConversation(conversation.id)}
                                                    className="w-full p-3 text-left hover:bg-primary-200 transition-colors"
                                                >
                                                    <div className="flex gap-3">
                                                        <div className="relative">
                                                            <Avatar className="h-10 w-10">
                                                                <AvatarImage
                                                                    src={getConversationAvatar(conversation) || undefined}
                                                                />
                                                                <AvatarFallback className="text-sm">
                                                                    {getInitials(getConversationTitle(conversation))}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            {conversation.unreadCount > 0 && (
                                                                <span className="absolute -top-1 -left-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <h3 className="font-medium text-sm truncate">
                                                                    {getConversationTitle(conversation)}
                                                                </h3>
                                                                {conversation.lastMessage && (
                                                                    <span className="text-xs text-primary-600">
                                                                        {formatDistanceToNow(
                                                                            new Date(conversation.lastMessage.createdAt),
                                                                            { addSuffix: true, locale: ro }
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-primary-600 truncate">
                                                                {conversation.lastMessage
                                                                    ? conversation.lastMessage.content
                                                                    : 'Niciun mesaj'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : selectedConversationId ? (
                            <ChatWindow
                                conversationId={selectedConversationId}
                                currentUserId={session.user.id!}
                            />
                        ) : null}
                    </div>
                </div>
            )}

            {/* New Conversation Dialog */}
            <NewConversationDialog
                open={showNewConversationDialog}
                onOpenChange={setShowNewConversationDialog}
                onConversationCreated={handleConversationCreated}
            />
        </>
    )
}
