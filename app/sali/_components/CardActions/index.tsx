"use server"

import { ClassroomActions } from "../ClassroomActions"
import { getClassroomById } from "@/data/classroom"

export async function CardActions({ classroomId }: { classroomId: string }) {
    const classroom = await getClassroomById(classroomId)

    const defaultValues = {
        id: classroom?.id,
        name: classroom?.name || "",
        capacity: classroom?.capacity || 0,
        building: classroom?.building || ""
    }

    return (
        <ClassroomActions defaultValues={defaultValues} />
    )
}