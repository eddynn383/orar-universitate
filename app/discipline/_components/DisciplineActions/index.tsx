// DisciplineActions.tsx
"use client"
import { Dialog, DialogContent } from "@/components/Dialog"
import { Edit, MoreVerticalIcon, Trash2 } from "lucide-react"
import { useState } from "react"
import { DisciplineForm } from "../DisciplineForm"  // ← Numele actualizat
import { Button } from "@/components/Button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/Dropdown"
import { DeleteDisciplineForm } from "../DeleteDisciplineForm"
import { Teacher } from "@/app/generated/prisma/client"
import { LearningTypeWithStudyYears } from "@/types/global"

type DisciplineActionsProps = {
    defaultValues?: {
        id?: string;
        name: string;
        teacherId?: string;
        learningTypeId: string;
        studyYearId?: string;
        semester: string;
    },
    learningTypes: LearningTypeWithStudyYears[]
    teachers: Teacher[]
}

export function DisciplineActions({ defaultValues, teachers, learningTypes }: DisciplineActionsProps) {
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
                            <Edit className="size-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onSelect={() => setShowDeleteDialog(true)}>
                            <Trash2 /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent size="L">
                    <DisciplineForm
                        defaultValues={defaultValues}
                        learningTypes={learningTypes}
                        teachers={teachers}
                        onSuccess={() => setShowEditDialog(false)}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent size="S">
                    <DeleteDisciplineForm
                        defaultValues={defaultValues}
                        onSuccess={() => setShowDeleteDialog(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    )
}