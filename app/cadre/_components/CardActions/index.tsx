"use server"

import { getTeacherById } from "@/data/teacher"
import { TeacherActions } from "../TeacherActions"
import { Card } from '@/components/Card';
import { User } from "@/types/entities";

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
        firstname: teacher?.firstname || "",
        lastname: teacher?.lastname || "",
        email: teacher?.email || "",
        phone: teacher?.phone || "",
        createdAt: teacher?.createdAt,
        updatedAt: teacher?.updatedAt,
        createdBy: teacher?.createdBy
            ? {
                id: teacher.createdBy.id,
                name: teacher.createdBy.name || "Unknown",
            }
            : undefined,
        updatedBy: teacher?.updatedBy
            ? {
                id: teacher.updatedBy.id,
                name: teacher.updatedBy.name || "Unknown",
            }
            : undefined,
    }

    return (
        <>
            <TeacherActions defaultValues={defaultValues} user={user} />
        </>
    )
}
