"use client"

import { Dialog, DialogContent, DialogTrigger } from "@/components/Dialog"
import { ClassroomForm } from "../ClassroomForm"
import { useState } from "react"

type CreateClassroomProps = {
    trigger: React.ReactNode
}

export function CreateClassroomModal({ trigger }: CreateClassroomProps) {
    const [showNewDialog, setShowNewDialog] = useState(false)

    return (
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent size="M">
                <ClassroomForm onSuccess={() => setShowNewDialog(false)} />
            </DialogContent>
        </Dialog>
    )
}