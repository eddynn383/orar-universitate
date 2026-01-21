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

        // Creează automat profilul corespunzător în funcție de rol
        if (validation.data.role === "PROFESOR") {
            await prisma.teacher.create({
                data: {
                    firstname,
                    lastname,
                    email: validation.data.email,
                    phone: null,
                    title: null,
                    grade: null,
                    education: null,
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
        } else if (validation.data.role === "SECRETAR") {
            await prisma.secretary.create({
                data: {
                    firstname,
                    lastname,
                    email: validation.data.email,
                    phone: null,
                    department: null,
                    office: null,
                    officePhone: null,
                    workSchedule: null,
                    responsibilities: null,
                    image: validation.data.image || null,
                    userId: user.id,
                    createdById: user.id,
                    updatedById: user.id,
                }
            })
        } else if (validation.data.role === "ADMIN") {
            await prisma.admin.create({
                data: {
                    firstname,
                    lastname,
                    email: validation.data.email,
                    phone: null,
                    department: null,
                    adminRole: null,
                    officePhone: null,
                    responsibilities: null,
                    accessLevel: 1, // Nivel de acces default
                    image: validation.data.image || null,
                    userId: user.id,
                    createdById: user.id,
                    updatedById: user.id,
                }
            })
        }

        revalidatePath("/users")
        revalidatePath("/utilizatori")
        revalidatePath("/cadre")
        revalidatePath("/studenti")
        revalidatePath("/secretari")
        revalidatePath("/administratori")
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
                secretaryProfile: true,
                adminProfile: true,
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

        // Șterge profilurile vechi dacă rolul s-a schimbat
        if (oldRole !== newRole) {
            if (oldRole === "PROFESOR" && currentUser.teacherProfile) {
                await prisma.teacher.delete({
                    where: { id: currentUser.teacherProfile.id }
                })
            }
            if (oldRole === "STUDENT" && currentUser.studentProfile) {
                await prisma.student.delete({
                    where: { id: currentUser.studentProfile.id }
                })
            }
            if (oldRole === "SECRETAR" && currentUser.secretaryProfile) {
                await prisma.secretary.delete({
                    where: { id: currentUser.secretaryProfile.id }
                })
            }
            if (oldRole === "ADMIN" && currentUser.adminProfile) {
                await prisma.admin.delete({
                    where: { id: currentUser.adminProfile.id }
                })
            }
        }

        // Creează sau actualizează profilul corespunzător rolului nou
        if (newRole === "PROFESOR") {
            if (currentUser.teacherProfile) {
                // Actualizează profilul existent
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
            } else {
                // Creează profil nou
                await prisma.teacher.create({
                    data: {
                        firstname,
                        lastname,
                        email: validation.data.email,
                        phone: null,
                        title: null,
                        grade: null,
                        education: null,
                        image: validation.data.image || null,
                        userId: validation.data.id,
                        createdById: validation.data.id,
                        updatedById: validation.data.id,
                    }
                })
            }
        } else if (newRole === "STUDENT") {
            if (currentUser.studentProfile) {
                // Actualizează profilul existent
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
            } else {
                // Creează profil nou
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
        } else if (newRole === "SECRETAR") {
            if (currentUser.secretaryProfile) {
                // Actualizează profilul existent
                await prisma.secretary.update({
                    where: { id: currentUser.secretaryProfile.id },
                    data: {
                        firstname,
                        lastname,
                        email: validation.data.email,
                        image: validation.data.image || null,
                        updatedById: validation.data.id,
                    }
                })
            } else {
                // Creează profil nou
                await prisma.secretary.create({
                    data: {
                        firstname,
                        lastname,
                        email: validation.data.email,
                        phone: null,
                        department: null,
                        office: null,
                        officePhone: null,
                        workSchedule: null,
                        responsibilities: null,
                        image: validation.data.image || null,
                        userId: validation.data.id,
                        createdById: validation.data.id,
                        updatedById: validation.data.id,
                    }
                })
            }
        } else if (newRole === "ADMIN") {
            if (currentUser.adminProfile) {
                // Actualizează profilul existent
                await prisma.admin.update({
                    where: { id: currentUser.adminProfile.id },
                    data: {
                        firstname,
                        lastname,
                        email: validation.data.email,
                        image: validation.data.image || null,
                        updatedById: validation.data.id,
                    }
                })
            } else {
                // Creează profil nou
                await prisma.admin.create({
                    data: {
                        firstname,
                        lastname,
                        email: validation.data.email,
                        phone: null,
                        department: null,
                        adminRole: null,
                        officePhone: null,
                        responsibilities: null,
                        accessLevel: 1,
                        image: validation.data.image || null,
                        userId: validation.data.id,
                        createdById: validation.data.id,
                        updatedById: validation.data.id,
                    }
                })
            }
        }

        revalidatePath("/users")
        revalidatePath("/utilizatori")
        revalidatePath("/cadre")
        revalidatePath("/studenti")
        revalidatePath("/secretari")
        revalidatePath("/administratori")
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