"use client"

import { Button } from "@/components/Button"
import { Dialog, DialogContent } from "@/components/Dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/Dropdown"
import { Edit, EllipsisVertical, Trash2 } from "lucide-react"
import { useState } from "react"
import { DeleteStudentForm } from "../DeleteStudentForm"
import { StudentForm } from "../StudentForm"
import { AuditUser } from "@/types/global"

type StudentActionsProps = {
    defaultValues: {
        id?: string
        firstname?: string
        lastname?: string
        email?: string
        sex?: string
        cnp?: string
        birthDate?: Date | string
        birthPlace?: string
        ethnicity?: string
        religion?: string
        citizenship?: string
        maritalStatus?: string
        socialSituation?: string
        isOrphan?: boolean
        needsSpecialConditions?: boolean
        parentsNames?: string
        residentialAddress?: string
        specialMedicalCondition?: string
        disability?: string
        groupId?: string
        image?: string | null
        createdAt?: Date | string
        updatedAt?: Date | string
        createdBy?: string
        updatedBy?: string
    }
}

export function StudentActions({ defaultValues }: StudentActionsProps) {
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-m">
                        <EllipsisVertical className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                        <Edit className="size-4 mr-2" />
                        Editează
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
                        <Trash2 className="size-4 mr-2" />
                        Șterge
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent>
                    <StudentForm defaultValues={defaultValues} onSuccess={() => setShowEditDialog(false)} />
                </DialogContent>
            </Dialog>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DeleteStudentForm
                        defaultValues={defaultValues}
                        onSuccess={() => setShowDeleteDialog(false)}
                    />
                </DialogContent>
            </Dialog>
        </>
    )
}
