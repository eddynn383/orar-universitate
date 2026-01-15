"use server"

import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { updateUserSchema, userSchema } from "@/schemas/user"

export async function createUser(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData)

    const validation = userSchema.safeParse(data)

    if (!validation.success) {
        const errors: Record<string, string[]> = {}
        validation.error.issues.forEach((err) => {
            const field = err.path[0] as string
            if (!errors[field]) errors[field] = []
            errors[field].push(err.message)
        })
        return { success: false, message: "Validation failed", errors }
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
        where: { email: validation.data.email }
    })

    if (existingUser) {
        return {
            success: false,
            message: "Email-ul este deja înregistrat",
            errors: { email: ["Email-ul este deja înregistrat"] }
        }
    }

    // Hash password if provided, otherwise generate a random one
    const password = validation.data.password || Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(password, 10)

    try {
        await prisma.user.create({
            data: {
                name: validation.data.name,
                email: validation.data.email,
                role: validation.data.role,
                password: hashedPassword,
                image: validation.data.image || null,
            }
        })

        revalidatePath("/users")
        return { success: true, message: "Utilizator creat cu succes" }
    } catch (error) {
        console.error("Database error:", error)
        return { success: false, message: "Eroare la crearea utilizatorului" }
    }
}

export async function updateUser(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData)

    const validation = updateUserSchema.safeParse(data)

    if (!validation.success) {
        const errors: Record<string, string[]> = {}
        validation.error.issues.forEach((err) => {
            const field = err.path[0] as string
            if (!errors[field]) errors[field] = []
            errors[field].push(err.message)
        })
        return { success: false, message: "Validation failed", errors }
    }

    // Check if email already exists for another user
    const existingUser = await prisma.user.findFirst({
        where: {
            email: validation.data.email,
            NOT: { id: validation.data.id }
        }
    })

    if (existingUser) {
        return {
            success: false,
            message: "Email-ul este deja folosit de alt utilizator",
            errors: { email: ["Email-ul este deja folosit de alt utilizator"] }
        }
    }

    try {
        const updateData: any = {
            name: validation.data.name,
            email: validation.data.email,
            role: validation.data.role,
            image: validation.data.image || null,
        }

        // Only update password if provided
        if (validation.data.password && validation.data.password.length > 0) {
            updateData.password = await bcrypt.hash(validation.data.password, 10)
        }

        await prisma.user.update({
            where: { id: validation.data.id },
            data: updateData
        })

        revalidatePath("/users")
        return { success: true, message: "Utilizator actualizat cu succes" }
    } catch (error) {
        console.error("Database error:", error)
        return { success: false, message: "Eroare la actualizarea utilizatorului" }
    }
}

export async function deleteUser(prevState: any, formData: FormData) {
    const id = formData.get("id") as string

    if (!id) {
        return { success: false, message: "ID-ul utilizatorului este necesar" }
    }

    try {
        await prisma.user.delete({
            where: { id }
        })

        revalidatePath("/users")
        return { success: true, message: "Utilizator șters cu succes" }
    } catch (error) {
        console.error("Database error:", error)
        return { success: false, message: "Eroare la ștergerea utilizatorului" }
    }
}