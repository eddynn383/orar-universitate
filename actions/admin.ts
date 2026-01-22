"use server"

import prisma from "@/lib/prisma"
import { adminIdSchema, adminSchema } from "@/schemas/admin"
import { revalidatePath } from "next/cache"
import z from "zod"
import bcrypt from "bcryptjs"

export async function createAdmin(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData)

    // Convertim accessLevel din string în number
    const processedData = {
        ...data,
        accessLevel: data.accessLevel ? parseInt(data.accessLevel as string) : 1,
    }

    const validation = adminSchema.safeParse(processedData)

    if (!validation.success) {
        const flattenedErrors = z.flattenError(validation.error)
        return {
            success: false,
            errors: flattenedErrors.fieldErrors,
            message: flattenedErrors.formErrors[0] || "Validation failed",
        }
    }

    try {
        // Verificăm dacă există deja un User cu acest email
        const existingUser = await prisma.user.findUnique({
            where: { email: validation.data.email },
        })

        let userId: string | undefined

        if (existingUser) {
            // Dacă există User, verificăm dacă are deja profil de admin
            if (existingUser.role === "ADMIN") {
                const existingAdmin = await prisma.admin.findUnique({
                    where: { userId: existingUser.id },
                })

                if (existingAdmin) {
                    return {
                        success: false,
                        message: "Există deja un administrator asociat cu acest email",
                        errors: { email: ["Există deja un administrator asociat cu acest email"] },
                    }
                }
                userId = existingUser.id
            } else {
                return {
                    success: false,
                    message: "Acest email este deja folosit de un utilizator cu alt rol",
                    errors: { email: ["Acest email este deja folosit de un utilizator cu alt rol"] },
                }
            }
        } else {
            // Creăm un User nou pentru acest admin
            const password = Math.random().toString(36).slice(-8) // Parolă temporară
            const hashedPassword = await bcrypt.hash(password, 10)

            const newUser = await prisma.user.create({
                data: {
                    firstname: validation.data.firstname,
                    lastname: validation.data.lastname,
                    email: validation.data.email,
                    role: "ADMIN",
                    password: hashedPassword,
                    image: validation.data.image || null,
                    sex: validation.data.sex || "MASCULIN",
                },
            })
            userId = newUser.id
        }

        await prisma.admin.create({
            data: {
                ...validation.data,
                userId, // Legăm administratorul cu User-ul
            },
        })

        revalidatePath("/administratori")
        revalidatePath("/utilizatori")
        return {
            success: true,
            message: existingUser
                ? "Administrator creat cu succes și asociat cu utilizatorul existent"
                : "Administrator și utilizator create cu succes",
        }
    } catch (error) {
        console.error("Database error:", error)
        return {
            success: false,
            message: "Nu s-a putut crea administratorul",
        }
    }
}

export async function updateAdmin(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData)
    const id = data.id as string

    // Convertim accessLevel din string în number
    const processedData = {
        ...data,
        accessLevel: data.accessLevel ? parseInt(data.accessLevel as string) : 1,
    }

    const validation = adminSchema.safeParse(processedData)

    if (!validation.success) {
        const { fieldErrors, formErrors } = z.flattenError(validation.error)
        return {
            success: false,
            errors: fieldErrors,
            message: formErrors[0] || "Validation failed",
        }
    }

    try {
        await prisma.admin.update({
            where: { id },
            data: validation.data,
        })

        revalidatePath("/administratori")
        return { success: true, message: "Administrator actualizat cu succes" }
    } catch (error) {
        console.error("Database error:", error)
        return {
            success: false,
            message: "Nu s-a putut actualiza administratorul",
        }
    }
}

export async function deleteAdmin(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData)
    const id = data.id as string

    const validation = adminIdSchema.safeParse(data)

    if (!validation.success) {
        const { fieldErrors, formErrors } = z.flattenError(validation.error)
        return {
            success: false,
            errors: fieldErrors,
            message: formErrors[0] || "Validation failed",
        }
    }

    try {
        await prisma.admin.delete({
            where: { id },
        })

        revalidatePath("/administratori")
        return { success: true, message: "Administratorul a fost șters cu succes" }
    } catch (error) {
        console.error("Database error:", error)
        return {
            success: false,
            message: "Nu s-a putut șterge administratorul",
        }
    }
}
