'use server'

import prisma from "@/lib/prisma"
import { teacherIdSchema, teacherSchema } from "@/schemas/teacher"
import { revalidatePath } from "next/cache"
import z from "zod"
import bcrypt from "bcryptjs"
import { roles } from "@/lib/roles"

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
        // Verificăm dacă există deja un User cu acest email
        const existingUser = await prisma.user.findUnique({
            where: { email: validation.data.email }
        })

        let userId: string | undefined

        if (existingUser) {
            // Dacă există User, verificăm dacă are deja profil de profesor
            if (existingUser.role === roles[2]) {
                const existingTeacher = await prisma.teacher.findUnique({
                    where: { userId: existingUser.id }
                })

                if (existingTeacher) {
                    return {
                        success: false,
                        message: "Există deja un profesor asociat cu acest email",
                        errors: { email: ["Există deja un profesor asociat cu acest email"] }
                    }
                }
                userId = existingUser.id
            } else {
                return {
                    success: false,
                    message: "Acest email este deja folosit de un utilizator cu alt rol",
                    errors: { email: ["Acest email este deja folosit de un utilizator cu alt rol"] }
                }
            }
        } else {
            // Creăm un User nou pentru acest profesor
            const password = Math.random().toString(36).slice(-8) // Parolă temporară
            const hashedPassword = await bcrypt.hash(password, 10)

            const newUser = await prisma.user.create({
                data: {
                    firstname: validation.data.firstname,
                    lastname: validation.data.lastname,
                    email: validation.data.email,
                    role: "PROFESOR",
                    password: hashedPassword,
                    image: validation.data.image || null,
                    sex: validation.data.sex
                }
            })
            userId = newUser.id
        }

        await prisma.teacher.create({
            data: {
                ...validation.data,
                userId, // Legăm profesorul cu User-ul
            }
        })

        revalidatePath("/cadre")
        revalidatePath("/utilizatori")
        return {
            success: true,
            message: existingUser
                ? "Profesor creat cu succes și asociat cu utilizatorul existent"
                : "Profesor și utilizator create cu succes"
        }
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