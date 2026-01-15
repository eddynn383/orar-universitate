'use server'

import { z } from "zod"
import { getYearByDate, setYear } from "@/data/academicYear"
import { yearSchema } from "@/schemas/year"
import { revalidatePath, revalidateTag } from "next/cache"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth-action"

export async function createYear(prevState: any, formData: FormData) {

    const authResult = await requireAdmin()
    if (!authResult.success) {
        return {
            success: false,
            message: authResult.error
        }
    }

    const data = Object.fromEntries(formData)

    const validation = yearSchema.safeParse(data)

    if (!validation.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: z.treeifyError(validation.error)
        }
    }

    // Verifică dacă anul de sfârșit e după anul de început
    if (validation.data.end <= validation.data.start) {
        return {
            success: false,
            message: "Anul de sfârșit trebuie să fie după anul de început"
        }
    }

    const existingYear = await getYearByDate(validation.data.start, validation.data.end)

    if (existingYear) {
        return {
            success: false,
            message: "Acest an universitar există deja"
        }
    }

    await setYear({ start: validation.data.start, end: validation.data.end, published: false })
}

export async function deleteYear(prevState: any, formData: FormData) {

    const authResult = await requireAdmin()

    console.log("authResult: ", authResult)

    if (!authResult.success) {
        return {
            success: false,
            message: authResult.error
        }
    }

    const id = formData.get("id") as string

    if (!id) {
        return {
            success: false,
            message: "ID-ul anului universitar este necesar"
        }
    }

    try {
        await prisma.academicYear.delete({
            where: { id }
        })

        revalidatePath("/orar")
        return { success: true, message: "An universitar șters cu succes" }
    } catch (error) {
        console.error("Database error:", error)
        return {
            success: false,
            message: "Eroare la ștergerea anului universitar"
        }
    }
}