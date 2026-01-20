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
        // Separă numele în prenume și nume de familie
        const nameParts = validation.data.name.trim().split(" ")
        const firstname = nameParts[0] || validation.data.name
        const lastname = nameParts.slice(1).join(" ") || validation.data.name

        // Creează utilizatorul cu profilul corespunzător
        const user = await prisma.user.create({
            data: {
                name: validation.data.name,
                email: validation.data.email,
                role: validation.data.role,
                password: hashedPassword,
                image: validation.data.image || null,
            }
        })

        // Creează automat Teacher sau Student în funcție de rol
        if (validation.data.role === "PROFESOR") {
            await prisma.teacher.create({
                data: {
                    firstname,
                    lastname,
                    email: validation.data.email,
                    phone: null,
                    title: null,
                    grade: null,
                    image: validation.data.image || null,
                    userId: user.id,
                    createdById: user.id,
                    updatedById: user.id,
                }
            })
        } else if (validation.data.role === "STUDENT") {
            // Generează publicId unic pentru student
            const publicId = `STD${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`

            await prisma.student.create({
                data: {
                    firstname,
                    lastname,
                    email: validation.data.email,
                    publicId,
                    sex: "MASCULIN", // Default, poate fi editat ulterior
                    cnpEncrypted: "0000000000000", // Temporar, trebuie completat ulterior
                    birthDate: new Date("2000-01-01"), // Default, trebuie completat ulterior
                    birthPlace: "Necompletat", // Trebuie completat ulterior
                    citizenship: "Română",
                    maritalStatus: "Necăsătorit/ă",
                    image: validation.data.image || null,
                    userId: user.id,
                    createdById: user.id,
                    updatedById: user.id,
                }
            })
        }

        revalidatePath("/users")
        revalidatePath("/cadre")
        revalidatePath("/studenti")
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
        // Obține utilizatorul curent pentru a verifica schimbările
        const currentUser = await prisma.user.findUnique({
            where: { id: validation.data.id },
            include: {
                teacherProfile: true,
                studentProfile: true,
            }
        })

        if (!currentUser) {
            return { success: false, message: "Utilizatorul nu a fost găsit" }
        }

        // Separă numele în prenume și nume de familie
        const nameParts = validation.data.name.trim().split(" ")
        const firstname = nameParts[0] || validation.data.name
        const lastname = nameParts.slice(1).join(" ") || validation.data.name

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

        // Gestionează schimbarea rolului
        const oldRole = currentUser.role
        const newRole = validation.data.role

        // Dacă rolul s-a schimbat din PROFESOR în altceva, șterge profilul de profesor
        if (oldRole === "PROFESOR" && newRole !== "PROFESOR" && currentUser.teacherProfile) {
            await prisma.teacher.delete({
                where: { id: currentUser.teacherProfile.id }
            })
        }

        // Dacă rolul s-a schimbat din STUDENT în altceva, șterge profilul de student
        if (oldRole === "STUDENT" && newRole !== "STUDENT" && currentUser.studentProfile) {
            await prisma.student.delete({
                where: { id: currentUser.studentProfile.id }
            })
        }

        // Dacă rolul s-a schimbat în PROFESOR și nu există profil, creează-l
        if (newRole === "PROFESOR" && !currentUser.teacherProfile) {
            await prisma.teacher.create({
                data: {
                    firstname,
                    lastname,
                    email: validation.data.email,
                    phone: null,
                    title: null,
                    grade: null,
                    image: validation.data.image || null,
                    userId: validation.data.id,
                    createdById: validation.data.id,
                    updatedById: validation.data.id,
                }
            })
        }

        // Dacă rolul s-a schimbat în STUDENT și nu există profil, creează-l
        if (newRole === "STUDENT" && !currentUser.studentProfile) {
            const publicId = `STD${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`

            await prisma.student.create({
                data: {
                    firstname,
                    lastname,
                    email: validation.data.email,
                    publicId,
                    sex: "MASCULIN",
                    cnpEncrypted: "0000000000000",
                    birthDate: new Date("2000-01-01"),
                    birthPlace: "Necompletat",
                    citizenship: "Română",
                    maritalStatus: "Necăsătorit/ă",
                    image: validation.data.image || null,
                    userId: validation.data.id,
                    createdById: validation.data.id,
                    updatedById: validation.data.id,
                }
            })
        }

        // Actualizează profilul existent de profesor dacă există
        if (newRole === "PROFESOR" && currentUser.teacherProfile) {
            await prisma.teacher.update({
                where: { id: currentUser.teacherProfile.id },
                data: {
                    firstname,
                    lastname,
                    email: validation.data.email,
                    image: validation.data.image || null,
                    updatedById: validation.data.id,
                }
            })
        }

        // Actualizează profilul existent de student dacă există
        if (newRole === "STUDENT" && currentUser.studentProfile) {
            await prisma.student.update({
                where: { id: currentUser.studentProfile.id },
                data: {
                    firstname,
                    lastname,
                    email: validation.data.email,
                    image: validation.data.image || null,
                    updatedById: validation.data.id,
                }
            })
        }

        revalidatePath("/users")
        revalidatePath("/cadre")
        revalidatePath("/studenti")
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