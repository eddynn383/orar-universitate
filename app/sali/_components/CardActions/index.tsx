"use server"

import { ClassroomActions } from "../ClassroomActions"
import { getClassroomById } from "@/data/classroom"

export async function CardActions({ classroomId }: { classroomId: string }) {
    const classroom = await getClassroomById(classroomId)

    const defaultValues = {
        id: classroom?.id,
        name: classroom?.name || "",
        capacity: classroom?.capacity || 0,
        building: classroom?.building || "",
        createdBy: classroom?.createdBy ? " " + classroom?.createdBy?.firstname + " " + classroom?.createdBy?.lastname : undefined,
        updatedBy: classroom?.updatedBy ? " " + classroom?.updatedBy?.firstname + " " + classroom?.updatedBy?.lastname : undefined,
        createdAt: classroom?.createdAt,
        updatedAt: classroom?.updatedAt,
    }

    return (
        <ClassroomActions defaultValues={defaultValues} />
    )
}