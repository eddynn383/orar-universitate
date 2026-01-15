"use client"

import { Dialog, DialogContent, DialogTrigger } from "@/components/Dialog"
import { TeacherForm } from "../TeacherForm"
import { useState } from "react"

type CreateTeacherModalProps = {
    trigger: React.ReactNode
}

export function CreateTeacherModal({ trigger }: CreateTeacherModalProps) {
    const [showNewDialog, setShowNewDialog] = useState(false)

    return (
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent size="L">
                <TeacherForm onSuccess={() => setShowNewDialog(false)} />
            </DialogContent>
        </Dialog>
    )
}