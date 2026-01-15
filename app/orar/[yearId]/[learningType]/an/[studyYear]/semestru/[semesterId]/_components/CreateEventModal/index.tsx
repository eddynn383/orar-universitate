"use client"

import { Dialog, DialogContent } from "@/components/Dialog"
import { EventForm } from "../EventForm"
import { Classroom, Discipline, Group, Teacher } from "@/app/generated/prisma/client"

type CreateEventModalProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    defaultValues?: {
        id?: string
        day?: string
        startHour?: string
        endHour?: string
        duration?: string
        eventType?: string
        eventRecurrence?: string
        teacherId?: string
        disciplineId?: string
        classroomId?: string
        groupIds?: string[]
    }
    academicYearId: string
    semester: number
    learningTypeId: string
    studyYearId: string // NEW: Added studyYearId
    groups: Group[]
    classrooms: Classroom[]
    teachers: Teacher[]
    disciplines: Discipline[]
    onSuccess?: () => void
}

export function CreateEventModal({
    open,
    onOpenChange,
    defaultValues,
    academicYearId,
    semester,
    learningTypeId,
    studyYearId, // NEW: Destructure studyYearId
    groups,
    classrooms,
    teachers,
    disciplines,
    onSuccess
}: CreateEventModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <EventForm
                    defaultValues={defaultValues}
                    academicYearId={academicYearId}
                    semester={semester}
                    learningTypeId={learningTypeId}
                    studyYearId={studyYearId} // NEW: Pass studyYearId
                    groups={groups}
                    classrooms={classrooms}
                    teachers={teachers}
                    disciplines={disciplines}
                    onSuccess={onSuccess}
                />
            </DialogContent>
        </Dialog>
    )
}