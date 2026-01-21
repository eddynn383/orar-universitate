"use server"

import prisma from "@/lib/prisma"
import { encryptCNP, generatePublicStudentId } from "@/lib/encryption"
import { studentIdSchema, studentSchema } from "@/schemas/student"
import { revalidatePath } from "next/cache"
import z from "zod"

export async function createStudent(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData)

    // Convertim valorile boolean din string
    const processedData = {
        ...data,
        isOrphan: data.isOrphan === "true" || data.isOrphan === "on",
        needsSpecialConditions: data.needsSpecialConditions === "true" || data.needsSpecialConditions === "on",
    }

    const validation = studentSchema.safeParse(processedData)

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
            where: { email: validation.data.email }
        })

        let userId: string | undefined

        if (existingUser) {
            // Dacă există User, verificăm dacă are deja profil de student
            if (existingUser.role === "STUDENT") {
                const existingStudent = await prisma.student.findUnique({
                    where: { userId: existingUser.id }
                })

                if (existingStudent) {
                    return {
                        success: false,
                        message: "Există deja un student asociat cu acest email",
                        errors: { email: ["Există deja un student asociat cu acest email"] }
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
            // Creăm un User nou pentru acest student
            const bcrypt = await import("bcryptjs")
            const password = Math.random().toString(36).slice(-8) // Parolă temporară
            const hashedPassword = await bcrypt.hash(password, 10)

            const newUser = await prisma.user.create({
                data: {
                    name: `${validation.data.firstname} ${validation.data.lastname}`,
                    email: validation.data.email,
                    role: "STUDENT",
                    password: hashedPassword,
                    image: validation.data.image || null,
                }
            })
            userId = newUser.id
        }

        // Criptăm CNP-ul înainte de salvare
        const cnpEncrypted = encryptCNP(validation.data.cnp)

        // Generăm un cod public unic
        let publicId = generatePublicStudentId()

        // Verificăm unicitatea codului public (în caz de coliziune)
        let existingStudent = await prisma.student.findUnique({
            where: { publicId },
        })

        while (existingStudent) {
            publicId = generatePublicStudentId()
            existingStudent = await prisma.student.findUnique({
                where: { publicId },
            })
        }

        // Pregătim datele pentru salvare
        const { cnp, ...restData } = validation.data

        await prisma.student.create({
            data: {
                ...restData,
                cnpEncrypted,
                publicId,
                birthDate: new Date(validation.data.birthDate),
                userId, // Legăm studentul cu User-ul
            },
        })

        revalidatePath("/studenti")
        revalidatePath("/utilizatori")
        return {
            success: true,
            message: existingUser
                ? "Student creat cu succes și asociat cu utilizatorul existent"
                : "Student și utilizator create cu succes"
        }
    } catch (error) {
        console.error("Database error:", error)
        return {
            success: false,
            message: "Nu s-a putut crea studentul",
        }
    }
}

export async function updateStudent(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData)
    const id = data.id as string

    // Convertim valorile boolean din string
    const processedData = {
        ...data,
        isOrphan: data.isOrphan === "true" || data.isOrphan === "on",
        needsSpecialConditions: data.needsSpecialConditions === "true" || data.needsSpecialConditions === "on",
    }

    const validation = studentSchema.safeParse(processedData)

    if (!validation.success) {
        const { fieldErrors, formErrors } = z.flattenError(validation.error)
        return {
            success: false,
            errors: fieldErrors,
            message: formErrors[0] || "Validation failed",
        }
    }

    try {
        // Criptăm CNP-ul înainte de salvare
        const cnpEncrypted = encryptCNP(validation.data.cnp)

        // Pregătim datele pentru salvare
        const { cnp, ...restData } = validation.data

        await prisma.student.update({
            where: { id },
            data: {
                ...restData,
                cnpEncrypted,
                birthDate: new Date(validation.data.birthDate),
            },
        })

        revalidatePath("/studenti")
        return { success: true, message: "Student actualizat cu succes" }
    } catch (error) {
        console.error("Database error:", error)
        return {
            success: false,
            message: "Nu s-a putut actualiza studentul",
        }
    }
}

export async function deleteStudent(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData)
    const id = data.id as string

    const validation = studentIdSchema.safeParse(data)

    if (!validation.success) {
        const { fieldErrors, formErrors } = z.flattenError(validation.error)
        return {
            success: false,
            errors: fieldErrors,
            message: formErrors[0] || "Validation failed",
        }
    }

    try {
        await prisma.student.delete({
            where: { id },
        })

        revalidatePath("/studenti")
        return { success: true, message: "Studentul a fost șters cu succes" }
    } catch (error) {
        console.error("Database error:", error)
        return {
            success: false,
            message: "Nu s-a putut șterge studentul",
        }
    }
}
