"use client"

import { Dialog, DialogContent } from "@/components/Dialog"
import { Edit, MoreVerticalIcon, Trash2 } from "lucide-react"
import { useState } from "react"
import { ClassroomForm } from "../ClassroomForm"
import { DeleteClassroomForm } from "../DeleteClassroomForm"
import { Button } from "@/components/Button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/Dropdown"

type ClassroomActionsProps = {
    defaultValues?: {
        id?: string
        name?: string
        capacity?: number
        building?: string
        createdBy?: string
        updatedBy?: string
        createdAt?: Date | string
        updatedAt?: Date | string
    }
}

export function ClassroomActions({ defaultValues }: ClassroomActionsProps) {
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    return (
        <>
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" aria-label="Open menu" size="icon-s">
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
                <DialogContent size="M">
                    <ClassroomForm
                        defaultValues={defaultValues}
                        onSuccess={() => setShowEditDialog(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent size="S">
                    <DeleteClassroomForm
                        defaultValues={defaultValues}
                        onSuccess={() => setShowDeleteDialog(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    )
}