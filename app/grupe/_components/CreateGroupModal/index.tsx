"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/Dialog"
import { GroupForm } from "../GroupForm"
import { LearningTypeWithStudyYears } from "@/types/global"

type CreateGroupModalProps = {
    trigger: React.ReactNode
    learningTypes: LearningTypeWithStudyYears[]
}

export function CreateGroupModal({ trigger, learningTypes }: CreateGroupModalProps) {
    const [showNewDialog, setShowNewDialog] = useState(false)

    return (
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent size="L">
                <GroupForm
                    learningTypes={learningTypes}
                    onSuccess={() => setShowNewDialog(false)}
                />
            </DialogContent>
        </Dialog>
    )
}