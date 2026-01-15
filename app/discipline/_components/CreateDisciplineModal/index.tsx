"use client"

import { Dialog, DialogContent, DialogTrigger } from "@/components/Dialog"
import { DisciplineForm } from "../DisciplineForm"
import { useState } from "react"
import { LearningTypeWithStudyYears } from "@/types/global"
import { Teacher } from "@/app/generated/prisma/client"

type CreateDisciplineModalProps = {
    trigger: React.ReactNode
    learningTypes: LearningTypeWithStudyYears[]
    teachers: Teacher[]
    defaultLearningTypeId?: string
}

export function CreateDisciplineModal({
    trigger,
    learningTypes,
    teachers,
    defaultLearningTypeId
}: CreateDisciplineModalProps) {
    const [showDialog, setShowDialog] = useState(false)

    return (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DisciplineForm
                    learningTypes={learningTypes}
                    teachers={teachers}
                    defaultValues={defaultLearningTypeId ? { learningTypeId: defaultLearningTypeId } : undefined}
                    onSuccess={() => setShowDialog(false)}
                />
            </DialogContent>
        </Dialog>
    )
}