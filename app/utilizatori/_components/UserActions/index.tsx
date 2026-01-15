// app/users/_components/UserActions.tsx

"use client"

import { Dialog, DialogContent } from "@/components/Dialog"
import { Edit, MoreVerticalIcon, Trash2 } from "lucide-react"
import { useState } from "react"
import { UserForm } from "../UserForm"
import { DeleteUserForm } from "../DeleteUserForm"
import { Button } from "@/components/Button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/Dropdown"
import { UserRole } from "@/app/generated/prisma/enums"

type UserActionsProps = {
    defaultValues: {
        id: string
        name?: string
        email: string
        role: UserRole
        image?: string
    }
}

export function UserActions({ defaultValues }: UserActionsProps) {
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
                        <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setShowDeleteDialog(true)}
                        >
                            <Trash2 className="size-4" /> Șterge
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="sm:max-w-md">
                    <UserForm
                        defaultValues={defaultValues}
                        onSuccess={() => setShowEditDialog(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-md">
                    <DeleteUserForm
                        defaultValues={{ id: defaultValues.id, name: defaultValues.name }}
                        onSuccess={() => setShowDeleteDialog(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    )
}