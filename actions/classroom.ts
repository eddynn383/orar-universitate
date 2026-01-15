"use server"

import prisma from "@/lib/prisma"
import { classroomSchema } from "@/schemas/classroom"
import { revalidatePath } from "next/cache"

export async function createClassroom(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData)
    console.log("createClassroom data: ", data)

    const validation = classroomSchema.safeParse(data)

    if (!validation.success) {
        const { fieldErrors, formErrors } = validation.error.flatten()
        return {
            success: false,
            errors: fieldErrors,
            message: formErrors[0] || "Validation failed"
        }
    }

    try {
        await prisma.classroom.create({
            data: validation.data
        })

        revalidatePath("/classrooms")
        return { success: true, message: "Classroom created successfully" }
    } catch (error) {
        console.error("Database error:", error)
        return {
            success: false,
            message: "Failed to create classroom"
        }
    }
}

export async function updateClassroom(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData)
    console.log("updateClassroom data: ", data)

    const id = data.id as string

    if (!id) {
        return {
            success: false,
            message: "Classroom ID is required"
        }
    }

    const validation = classroomSchema.safeParse(data)

    if (!validation.success) {
        const { fieldErrors, formErrors } = validation.error.flatten()
        return {
            success: false,
            errors: fieldErrors,
            message: formErrors[0] || "Validation failed"
        }
    }

    try {
        await prisma.classroom.update({
            where: { id },
            data: validation.data
        })

        revalidatePath("/classrooms")
        return { success: true, message: "Classroom updated successfully" }
    } catch (error) {
        console.error("Database error:", error)
        return {
            success: false,
            message: "Failed to update classroom"
        }
    }
}

export async function deleteClassroom(prevState: any, formData: FormData) {
    const id = formData.get("id") as string

    if (!id) {
        return {
            success: false,
            message: "Classroom ID is required"
        }
    }

    try {
        await prisma.classroom.delete({
            where: { id }
        })

        revalidatePath("/classrooms")
        return { success: true, message: "Classroom deleted successfully" }
    } catch (error) {
        console.error("Database error:", error)
        return {
            success: false,
            message: "Failed to delete classroom"
        }
    }
}