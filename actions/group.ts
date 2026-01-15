// actions/group.ts
'use server'

import prisma from "@/lib/prisma"
import { groupIdSchema, groupSchema } from "@/schemas/group"
import { revalidatePath } from "next/cache"
import z from "zod"

export async function createGroup(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData)
    console.log("createGroup data: ", data)

    const validation = groupSchema.safeParse(data)

    if (!validation.success) {
        const { fieldErrors, formErrors } = validation.error.flatten()
        return {
            success: false,
            errors: fieldErrors,
            message: formErrors[0] || "Validation failed"
        }
    }

    try {
        await prisma.group.create({
            data: validation.data
        })

        revalidatePath("/grupe")
        return { success: true, message: "Group created successfully" }
    } catch (error) {
        console.error("Database error:", error)
        return {
            success: false,
            message: "Failed to create group"
        }
    }
}

export async function updateGroup(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData)
    console.log("updateGroup data: ", data)

    const id = data.id as string

    if (!id) {
        return {
            success: false,
            message: "Group ID is required"
        }
    }

    const validation = groupSchema.safeParse(data)

    if (!validation.success) {
        const { fieldErrors, formErrors } = validation.error.flatten()
        return {
            success: false,
            errors: fieldErrors,
            message: formErrors[0] || "Validation failed"
        }
    }

    try {
        await prisma.group.update({
            where: { id },
            data: validation.data
        })

        revalidatePath("/grupe")
        return { success: true, message: "Group updated successfully" }
    } catch (error) {
        console.error("Database error:", error)
        return {
            success: false,
            message: "Failed to update group"
        }
    }
}

export async function deleteGroup(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData)

    console.log("data: ", data)

    const id = data.id as string

    const validation = groupIdSchema.safeParse(data)

    if (!validation.success) {
        const { fieldErrors, formErrors } = z.flattenError(validation.error)
        return {
            success: false,
            errors: fieldErrors,
            message: formErrors[0] || "Validation failed"
        }
    }

    try {
        await prisma.group.delete({
            where: { id },
        })

        revalidatePath("/grupe")
        return { success: true, message: "Group was successfully deleted" }
    } catch (error) {
        console.error("Database error:", error)
        return {
            success: false,
            message: "Failed to delete group"
        }
    }
}