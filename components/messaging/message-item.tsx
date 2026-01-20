"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/Avatar"
import { Button } from "@/components/Button"
import { EmojiPicker } from "./emoji-picker"
import { MoreVertical, Edit2, Trash2, Check, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ro } from "date-fns/locale"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/Popover"
import { Textarea } from "@/components/Textarea"

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

interface MessageItemProps {
    message: Message
    isOwnMessage: boolean
    showAvatar: boolean
    currentUserId: string
    onEdit?: (messageId: string, newContent: string) => Promise<void>
    onDelete?: (messageId: string) => Promise<void>
    onReact?: (messageId: string, emoji: string) => Promise<void>
}

export function MessageItem({
    message,
    isOwnMessage,
    showAvatar,
    currentUserId,
    onEdit,
    onDelete,
    onReact
}: MessageItemProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState(message.content)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const getInitials = (name: string | null) => {
        if (!name) return '?'
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2)
    }

    const handleEdit = async () => {
        if (!onEdit || editContent.trim() === message.content) {
            setIsEditing(false)
            return
        }

        setIsSubmitting(true)
        try {
            await onEdit(message.id, editContent.trim())
            setIsEditing(false)
        } catch (error) {
            console.error('Error editing message:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCancelEdit = () => {
        setEditContent(message.content)
        setIsEditing(false)
    }

    const handleDelete = async () => {
        if (!onDelete) return

        if (confirm('Ești sigur că vrei să ștergi acest mesaj?')) {
            try {
                await onDelete(message.id)
            } catch (error) {
                console.error('Error deleting message:', error)
            }
        }
    }

    const handleReaction = async (emoji: string) => {
        if (!onReact) return

        try {
            await onReact(message.id, emoji)
        } catch (error) {
            console.error('Error adding reaction:', error)
        }
    }

    // Group reactions by emoji
    const groupedReactions = message.reactions?.reduce((acc, reaction) => {
        if (!acc[reaction.emoji]) {
            acc[reaction.emoji] = {
                emoji: reaction.emoji,
                count: 0,
                users: [],
                hasCurrentUser: false
            }
        }
        acc[reaction.emoji].count++
        acc[reaction.emoji].users.push(reaction.user)
        if (reaction.user.id === currentUserId) {
            acc[reaction.emoji].hasCurrentUser = true
        }
        return acc
    }, {} as Record<string, { emoji: string; count: number; users: User[]; hasCurrentUser: boolean }>)

    return (
        <div
            className={`flex gap-2 group ${
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
                    <span className="text-xs font-medium mb-1 text-primary-700">
                        {message.sender.name || message.sender.email}
                    </span>
                )}

                <div className="relative group/message">
                    {isEditing ? (
                        <div className="bg-muted rounded-lg p-2 min-w-[200px]">
                            <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="min-h-[60px] mb-2"
                                disabled={isSubmitting}
                            />
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleEdit}
                                    size="S"
                                    disabled={isSubmitting || editContent.trim().length === 0}
                                >
                                    <Check className="w-3 h-3" />
                                    Salvează
                                </Button>
                                <Button
                                    onClick={handleCancelEdit}
                                    size="S"
                                    variant="ghost"
                                    disabled={isSubmitting}
                                >
                                    <X className="w-3 h-3" />
                                    Anulează
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div
                                className={`rounded-lg px-3 py-2 ${
                                    message.isDeleted
                                        ? 'bg-primary-200 text-primary-600 italic'
                                        : isOwnMessage
                                        ? 'bg-brand-400 text-brand-100'
                                        : 'bg-primary-200'
                                }`}
                            >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                    {message.content}
                                </p>
                            </div>

                            {/* Message Actions */}
                            {!message.isDeleted && (
                                <div className={`absolute -top-3 ${isOwnMessage ? 'left-0' : 'right-0'} opacity-0 group-hover/message:opacity-100 transition-opacity flex gap-1 bg-primary-100 border border-primary-200 rounded-lg shadow-sm p-1`}>
                                    {onReact && (
                                        <EmojiPicker onEmojiSelect={handleReaction} />
                                    )}

                                    {isOwnMessage && !message.isDeleted && (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="icon-s">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-40 p-1" align="end">
                                                <div className="flex flex-col">
                                                    {onEdit && (
                                                        <button
                                                            onClick={() => setIsEditing(true)}
                                                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary-200 rounded"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                            Editează
                                                        </button>
                                                    )}
                                                    {onDelete && (
                                                        <button
                                                            onClick={handleDelete}
                                                            className="flex items-center gap-2 px-3 py-2 text-sm text-fail-400 hover:bg-fail-100 rounded"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Șterge
                                                        </button>
                                                    )}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                </div>
                            )}

                            {/* Reactions */}
                            {groupedReactions && Object.keys(groupedReactions).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {Object.values(groupedReactions).map((reaction) => (
                                        <button
                                            key={reaction.emoji}
                                            onClick={() => handleReaction(reaction.emoji)}
                                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all ${
                                                reaction.hasCurrentUser
                                                    ? 'bg-brand-100 border-brand-400'
                                                    : 'bg-primary-100 border-primary-200 hover:border-primary-300'
                                            }`}
                                            title={reaction.users.map(u => u.name || u.email).join(', ')}
                                        >
                                            <span>{reaction.emoji}</span>
                                            <span className="text-primary-700">{reaction.count}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <span className="text-xs text-primary-600 mt-1">
                    {formatDistanceToNow(new Date(message.createdAt), {
                        addSuffix: true,
                        locale: ro
                    })}
                    {message.isEdited && !message.isDeleted && ' • editat'}
                </span>
            </div>
        </div>
    )
}
