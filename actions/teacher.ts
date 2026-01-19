'use server'

import prisma from "@/lib/prisma"
import { teacherIdSchema, teacherSchema } from "@/schemas/teacher"
import { revalidatePath } from "next/cache"
import z from "zod"

export async function createTeacher(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData)
    const validation = teacherSchema.safeParse(data)

    if (!validation.success) {
        const flattenedErrors = z.flattenError(validation.error)
        return {
            success: false,
            errors: flattenedErrors.fieldErrors,
            message: flattenedErrors.formErrors[0] || "Validation failed"
        }
    }

    try {
        await prisma.teacher.create({
            data: validation.data
        })
        revalidatePath("/cadre")
        return { success: true, message: "Teacher created successfully" }
    } catch (error) {
        console.error("Database error:", error)
        return {
            success: false,
            message: "Failed to create teacher"
        }
    }
}

export async function updateTeacher(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData)
    const userId = data.updatedBy as string
    const id = data.id as string

    console.log("update Teacher data: ", data)

    const validation = teacherSchema.safeParse(data)

    console.log("update Teacher validation: ", validation)

    if (!validation.success) {
        const { fieldErrors, formErrors } = z.flattenError(validation.error)
        return {
            success: false,
            errors: fieldErrors,
            message: formErrors[0] || "Validation failed"
        }
    }

    try {
        await prisma.teacher.update({
            where: { id },
            data: {
                ...validation.data,
                updatedById: userId
            }
        })
        revalidatePath("/cadre")
        return { success: true, message: "Teacher updated successfully" }
    } catch (error) {
        console.error("Database error:", error)
        return {
            success: false,
            message: "Failed to update teacher"
        }
    }
}

export async function deleteTeacher(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData)

    console.log("data: ", data)

    const id = data.id as string

    const validation = teacherIdSchema.safeParse(data)

    if (!validation.success) {
        const { fieldErrors, formErrors } = z.flattenError(validation.error)
        return {
            success: false,
            errors: fieldErrors,
            message: formErrors[0] || "Validation failed"
        }
    }

    try {
        await prisma.teacher.delete({
            where: { id },
        })

        revalidatePath("/cadre")
        return { success: true, message: "Teacher was successfully deleted" }
    } catch (error) {
        console.error("Database error:", error)
        return {
            success: false,
            message: "Failed to delete teacher"
        }
    }
}