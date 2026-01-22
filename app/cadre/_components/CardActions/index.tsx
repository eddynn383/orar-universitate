"use server"

import { getTeacherById } from "@/data/teacher"
import { TeacherActions } from "../TeacherActions"

type CardActionsProps = {
    teacherId: string
    user: {
        id: string
        role: string
        email?: string
        name?: string
    }
}

export async function CardActions({ teacherId, user }: CardActionsProps) {
    const teacher = await getTeacherById(teacherId)
    const defaultValues = {
        id: teacher?.id,
        title: teacher?.title || "",
        grade: teacher?.grade || "",
        email: teacher?.email || "",
        createdBy: teacher?.createdBy ? " " + teacher?.createdBy?.firstname + " " + teacher?.createdBy?.lastname : undefined,
        updatedBy: teacher?.updatedBy ? " " + teacher?.updatedBy?.firstname + " " + teacher?.updatedBy?.lastname : undefined,
        createdAt: teacher?.createdAt,
        updatedAt: teacher?.updatedAt,
    }

    return (
        <>
            <TeacherActions defaultValues={defaultValues} user={user} />
        </>
    )
}
