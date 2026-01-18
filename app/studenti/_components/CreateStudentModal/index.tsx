"use client"

import { Dialog, DialogContent, DialogTrigger } from "@/components/Dialog"
import { ReactNode, useState } from "react"
import { StudentForm } from "../StudentForm"

type CreateStudentModalProps = {
    trigger: ReactNode
    groups?: Array<{ id: string; name: string }>
}

export function CreateStudentModal({ trigger, groups }: CreateStudentModalProps) {
    const [showNewDialog, setShowNewDialog] = useState(false)

    return (
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <StudentForm groups={groups} onSuccess={() => setShowNewDialog(false)} />
            </DialogContent>
        </Dialog>
    )
}
