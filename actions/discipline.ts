'use server'

import prisma from "@/lib/prisma"
import { disciplineIdSchema, disciplineSchema } from "@/schemas/discipline"
import { revalidatePath } from "next/cache"
import z from "zod"

export async function createDiscipline(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData)
    const validation = disciplineSchema.safeParse(data)

    if (!validation.success) {
        const flattenedErrors = z.flattenError(validation.error)
        return {
            success: false,
            errors: flattenedErrors.fieldErrors,
            message: flattenedErrors.formErrors[0] || "Validation failed"
        }
    }

    try {
        await prisma.discipline.create({
            data: validation.data
        })
        revalidatePath("/discipline")
        return { success: true, message: "Discipline created successfully" }
    } catch (error) {
        console.error("Database error:", error)
        return {
            success: false,
            message: "Failed to create discipline"
        }
    }
}

export async function updateDiscipline(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData)
    const id = data.id as string

    const validation = disciplineSchema.safeParse(data)

    if (!validation.success) {
        const { fieldErrors, formErrors } = z.flattenError(validation.error)
        return {
            success: false,
            errors: fieldErrors,
            message: formErrors[0] || "Validation failed"
        }
    }

    try {
        await prisma.discipline.update({
            where: { id },
            data: validation.data
        })
        revalidatePath("/discipline")
        return { success: true, message: "Discipline updated successfully" }
    } catch (error) {
        console.error("Database error:", error)
        return {
            success: false,
            message: "Failed to update discipline"
        }
    }
}

export async function deleteDiscipline(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData)

    console.log("data: ", data)

    const id = data.id as string

    const validation = disciplineIdSchema.safeParse(data)

    if (!validation.success) {
        const { fieldErrors, formErrors } = z.flattenError(validation.error)
        return {
            success: false,
            errors: fieldErrors,
            message: formErrors[0] || "Validation failed"
        }
    }

    try {
        await prisma.discipline.delete({
            where: { id },
        })

        revalidatePath("/discipline")
        return { success: true, message: "Discipline was successfully deleted" }
    } catch (error) {
        console.error("Database error:", error)
        return {
            success: false,
            message: "Failed to delete discipline"
        }
    }
}