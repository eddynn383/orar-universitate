"use client"

import { Dialog, DialogContent } from "@/components/Dialog"
import { Edit, MoreVerticalIcon, Trash2 } from "lucide-react"
import { useState } from "react"
import { TeacherForm } from "../TeacherForm"
import { Button } from "@/components/Button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/Dropdown"
import { DeleteTeacherForm } from "../DeleteTeacherForm"

type TeacherActionsProps = {
    defaultValues?: {
        id?: string
        title?: string
        grade?: string
        email: string
        phone?: string
        createdAt?: Date | string
        updatedAt?: Date | string
        createdBy?: string | undefined
        updatedBy?: string | undefined
    },
    user: {
        id: string
        role: string
        email?: string
        firstname?: string
        lastname?: string
    },
}

export function TeacherActions({ defaultValues, user }: TeacherActionsProps) {
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" aria-label="Open menu" size="icon-m">
                        <MoreVerticalIcon />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-40" align="end">
                    <DropdownMenuGroup>
                        <DropdownMenuItem onSelect={() => setShowEditDialog(true)}>
                            <Edit className="size-4" /> Editează
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onSelect={() => setShowDeleteDialog(true)}>
                            <Trash2 /> Șterge
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent size="L">
                    <TeacherForm
                        defaultValues={defaultValues}
                        user={user}
                        onSuccess={() => setShowEditDialog(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent size="S">
                    <DeleteTeacherForm
                        defaultValues={defaultValues}
                        onSuccess={() => setShowDeleteDialog(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    )
}