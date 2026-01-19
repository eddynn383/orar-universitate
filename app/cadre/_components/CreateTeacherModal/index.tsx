"use client"

import { Dialog, DialogContent, DialogTrigger } from "@/components/Dialog"
import { TeacherForm } from "../TeacherForm"
import { useState } from "react"
import { User } from "@/types/entities"

type CreateTeacherModalProps = {
    trigger: React.ReactNode
    user?: {
        id: string
        role: string
        email?: string
        name?: string
    }
}

export function CreateTeacherModal({ trigger, user }: CreateTeacherModalProps) {
    const [showNewDialog, setShowNewDialog] = useState(false)

    return (
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent size="L">
                <TeacherForm user={user} onSuccess={() => setShowNewDialog(false)} />
            </DialogContent>
        </Dialog>
    )
}