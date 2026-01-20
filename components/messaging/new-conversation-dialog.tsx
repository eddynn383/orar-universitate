"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/Dialog"
import { Button } from "@/components/Button"
import { Input } from "@/components/Input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/Avatar"
import { Search, Loader2 } from "lucide-react"
import { useDebouncedCallback } from "use-debounce"

interface User {
    id: string
    name: string | null
    email: string | null
    image: string | null
    role: string
}

interface NewConversationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConversationCreated: (conversationId: string) => void
}

export function NewConversationDialog({
    open,
    onOpenChange,
    onConversationCreated
}: NewConversationDialogProps) {
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
                onOpenChange(false)
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Conversație nouă</DialogTitle>
                    <DialogDescription>
                        Caută un utilizator pentru a începe o conversație
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Caută după nume sau email..."
                            value={searchTerm}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <div className="max-h-[400px] overflow-y-auto border rounded-lg">
                        {loading ? (
                            <div className="flex items-center justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : users.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center">
                                <p className="text-muted-foreground">
                                    {searchTerm
                                        ? "Nu s-au găsit utilizatori"
                                        : "Caută utilizatori pentru a începe o conversație"}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {users.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleCreateConversation(user.id)}
                                        disabled={creating}
                                        className="w-full p-4 text-left hover:bg-accent transition-colors disabled:opacity-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={user.image || undefined} />
                                                <AvatarFallback>
                                                    {getInitials(user.name, user.email)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">
                                                    {user.name || user.email}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
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
            </DialogContent>
        </Dialog>
    )
}
