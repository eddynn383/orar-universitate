"use client"

import { Dialog, DialogContent } from "@/components/Dialog"
import { Edit, MoreVerticalIcon, Trash2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/Button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/Dropdown"
import { DeleteGroupsForm } from "../DeleteGroupsForm"
import { GroupForm } from "../GroupForm"
import { LearningTypeWithStudyYears } from "@/types/global"

type GroupsActionsProps = {
    defaultValues?: {
        id?: string
        name?: string
        department?: string
        learningTypeId?: string
        studyYearId?: string
        semester?: string
    }
    learningTypes: LearningTypeWithStudyYears[]
}

export function GroupsActions({ defaultValues, learningTypes }: GroupsActionsProps) {
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
                <DialogContent size="L">
                    <GroupForm
                        defaultValues={defaultValues}
                        learningTypes={learningTypes}
                        onSuccess={() => setShowEditDialog(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent size="S">
                    <DeleteGroupsForm
                        defaultValues={defaultValues}
                        onSuccess={() => setShowDeleteDialog(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    )
}