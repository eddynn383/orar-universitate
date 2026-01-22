"use server"

import prisma from "@/lib/prisma"
import { secretaryIdSchema, secretarySchema } from "@/schemas/secretary"
import { revalidatePath } from "next/cache"
import z from "zod"
import bcrypt from "bcryptjs"

export async function createSecretary(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData)
    const validation = secretarySchema.safeParse(data)

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
            // Dacă există User, verificăm dacă are deja profil de secretar
            if (existingUser.role === "SECRETAR") {
                const existingSecretary = await prisma.secretary.findUnique({
                    where: { userId: existingUser.id },
                })

                if (existingSecretary) {
                    return {
                        success: false,
                        message: "Există deja un secretar asociat cu acest email",
                        errors: { email: ["Există deja un secretar asociat cu acest email"] },
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
            // Creăm un User nou pentru acest secretar
            const password = Math.random().toString(36).slice(-8) // Parolă temporară
            const hashedPassword = await bcrypt.hash(password, 10)

            const newUser = await prisma.user.create({
                data: {
                    firstname: validation.data.firstname,
                    lastname: validation.data.lastname,
                    email: validation.data.email,
                    role: "SECRETAR",
                    password: hashedPassword,
                    image: validation.data.image || null,
                    sex: validation.data.sex
                },
            })
            userId = newUser.id
        }

        await prisma.secretary.create({
            data: {
                ...validation.data,
                userId, // Legăm secretarul cu User-ul
            },
        })

        revalidatePath("/secretari")
        revalidatePath("/utilizatori")
        return {
            success: true,
            message: existingUser
                ? "Secretar creat cu succes și asociat cu utilizatorul existent"
                : "Secretar și utilizator create cu succes",
        }
    } catch (error) {
        console.error("Database error:", error)
        return {
            success: false,
            message: "Nu s-a putut crea secretarul",
        }
    }
}

export async function updateSecretary(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData)
    const id = data.id as string

    const validation = secretarySchema.safeParse(data)

    if (!validation.success) {
        const { fieldErrors, formErrors } = z.flattenError(validation.error)
        return {
            success: false,
            errors: fieldErrors,
            message: formErrors[0] || "Validation failed",
        }
    }

    try {
        await prisma.secretary.update({
            where: { id },
            data: validation.data,
        })

        revalidatePath("/secretari")
        return { success: true, message: "Secretar actualizat cu succes" }
    } catch (error) {
        console.error("Database error:", error)
        return {
            success: false,
            message: "Nu s-a putut actualiza secretarul",
        }
    }
}

export async function deleteSecretary(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData)
    const id = data.id as string

    const validation = secretaryIdSchema.safeParse(data)

    if (!validation.success) {
        const { fieldErrors, formErrors } = z.flattenError(validation.error)
        return {
            success: false,
            errors: fieldErrors,
            message: formErrors[0] || "Validation failed",
        }
    }

    try {
        await prisma.secretary.delete({
            where: { id },
        })

        revalidatePath("/secretari")
        return { success: true, message: "Secretarul a fost șters cu succes" }
    } catch (error) {
        console.error("Database error:", error)
        return {
            success: false,
            message: "Nu s-a putut șterge secretarul",
        }
    }
}
