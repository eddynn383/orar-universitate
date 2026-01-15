"use server"

import { getTeacherById } from "@/data/teacher"
import { TeacherActions } from "../TeacherActions"

export async function CardActions({ teacherId }: { teacherId: string }) {
    const teacher = await getTeacherById(teacherId)
    const defaultValues = {
        id: teacher?.id,
        title: teacher?.title || "",
        grade: teacher?.grade || "",
        firstname: teacher?.firstname || "",
        lastname: teacher?.lastname || "",
        email: teacher?.email || "",
        phone: teacher?.phone || ""
    }

    return (
        <>
            <TeacherActions defaultValues={defaultValues} />
        </>
    )
}
