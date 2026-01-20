"use client"

import { useState, useEffect } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/Popover"
import { Button } from "@/components/Button"
import { Input } from "@/components/Input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/Avatar"
import { UserListSkeleton } from "./message-skeletons"
import { Search, MessageCirclePlus } from "lucide-react"
import { useDebouncedCallback } from "use-debounce"

interface User {
    id: string
    name: string | null
    email: string | null
    image: string | null
    role: string
}

interface NewConversationPopoverProps {
    onConversationCreated: (conversationId: string) => void
}

export function NewConversationPopover({
    onConversationCreated
}: NewConversationPopoverProps) {
    const [open, setOpen] = useState(false)
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        if (open) {
            loadUsers("")
        }
    }, [open])

    const loadUsers = async (search: string) => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (search) {
                params.append("search", search)
            }

            const response = await fetch(`/api/conversations/users?${params}`)
            const data = await response.json()

            if (data.success) {
                setUsers(data.data)
            }
        } catch (error) {
            console.error("Error loading users:", error)
        } finally {
            setLoading(false)
        }
    }

    const debouncedSearch = useDebouncedCallback((value: string) => {
        loadUsers(value)
    }, 500)

    const handleSearchChange = (value: string) => {
        setSearchTerm(value)
        debouncedSearch(value)
    }

    const handleCreateConversation = async (userId: string) => {
        setCreating(true)
        try {
            const response = await fetch("/api/conversations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    participantIds: [userId],
                    type: "DIRECT"
                })
            })

            const data = await response.json()

            if (data.success) {
                onConversationCreated(data.data.id)
                setOpen(false)
                setSearchTerm("")
            }
        } catch (error) {
            console.error("Error creating conversation:", error)
        } finally {
            setCreating(false)
        }
    }

    const getInitials = (name: string | null, email: string | null) => {
        if (name) {
            return name
                .split(" ")
                .map(n => n[0])
                .join("")
                .toUpperCase()
                .substring(0, 2)
        }
        if (email) {
            return email.substring(0, 2).toUpperCase()
        }
        return "?"
    }

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            ADMIN: "Administrator",
            SECRETAR: "Secretar",
            PROFESOR: "Profesor",
            STUDENT: "Student",
            USER: "Utilizator"
        }
        return labels[role] || role
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-s"
                    title="Conversație nouă"
                >
                    <MessageCirclePlus className="w-4 h-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-4" align="end">
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-lg mb-1">Conversație nouă</h3>
                        <p className="text-sm text-primary-600">
                            Caută un utilizator pentru a începe o conversație
                        </p>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary-600" />
                        <Input
                            placeholder="Caută după nume sau email..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <div className="max-h-[300px] overflow-y-auto border border-primary-200 rounded-lg">
                        {loading ? (
                            <UserListSkeleton />
                        ) : users.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center">
                                <p className="text-primary-600 text-sm">
                                    {searchTerm
                                        ? "Nu s-au găsit utilizatori"
                                        : "Caută utilizatori pentru a începe o conversație"}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-primary-200">
                                {users.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleCreateConversation(user.id)}
                                        disabled={creating}
                                        className="w-full p-3 text-left hover:bg-primary-200 transition-colors disabled:opacity-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={user.image || undefined} />
                                                <AvatarFallback>
                                                    {getInitials(user.name, user.email)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate text-sm">
                                                    {user.name || user.email}
                                                </p>
                                                <p className="text-xs text-primary-600">
                                                    {getRoleLabel(user.role)}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
