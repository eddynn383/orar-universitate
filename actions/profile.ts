"use server"

import prisma from "@/lib/prisma"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"

const profileSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    firstname: z.string().min(2, "Prenumele trebuie să aibă cel puțin 2 caractere").optional().or(z.literal("")),
    lastname: z.string().min(2, "Numele trebuie să aibă cel puțin 2 caractere").optional().or(z.literal("")),
    email: z.string().email("Email invalid").optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    city: z.string().optional().or(z.literal("")),
    country: z.string().optional().or(z.literal("")),
    bio: z.string().optional().or(z.literal("")),
    image: z.string().optional().or(z.literal("")),
})

const passwordSchema = z.object({
    userId: z.string().min(1, "User ID is required"),
    currentPassword: z.string().min(1, "Parola curentă este obligatorie"),
    newPassword: z.string().min(6, "Parola nouă trebuie să aibă cel puțin 6 caractere"),
    confirmPassword: z.string().min(1, "Confirmarea parolei este obligatorie"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Parolele nu coincid",
    path: ["confirmPassword"],
})

export async function updateProfile(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData)

    const validation = profileSchema.safeParse(data)

    if (!validation.success) {
        return {
            success: false,
            errors: z.treeifyError(validation.error),
            message: "Validation failed"
        }
    }

    const { userId, ...profileData } = validation.data

    try {
        // Check if email is already taken by another user
        if (profileData.email) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    email: profileData.email,
                    NOT: { id: userId }
                }
            })

            if (existingUser) {
                return {
                    success: false,
                    errors: {
                        errors: [],
                        properties: {
                            email: { errors: ["Acest email este deja folosit de alt utilizator"] }
                        }
                    },
                    message: "Email already taken"
                }
            }
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                firstname: profileData.firstname,
                lastname: profileData.lastname,
                email: profileData.email,
                phone: profileData.phone || null,
                address: profileData.address || null,
                city: profileData.city || null,
                country: profileData.country || null,
                bio: profileData.bio || null,
                image: profileData.image || null,
            }
        })

        revalidatePath("/profil")
        return { success: true, message: "Profile updated successfully" }
    } catch (error) {
        console.error("Profile update error:", error)
        return {
            success: false,
            message: "Failed to update profile"
        }
    }
}

export async function updatePassword(prevState: any, formData: FormData) {
    const data = Object.fromEntries(formData)

    const validation = passwordSchema.safeParse(data)

    if (!validation.success) {
        return {
            success: false,
            errors: z.treeifyError(validation.error),
            message: "Validation failed"
        }
    }

    const { userId, currentPassword, newPassword } = validation.data

    try {
        // Get user with current password
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { password: true }
        })

        if (!user) {
            return {
                success: false,
                message: "Utilizatorul nu a fost găsit"
            }
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password)

        if (!isPasswordValid) {
            return {
                success: false,
                errors: {
                    errors: [],
                    properties: {
                        currentPassword: { errors: ["Parola curentă este incorectă"] }
                    }
                },
                message: "Current password is incorrect"
            }
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        })

        revalidatePath("/profil")
        return { success: true, message: "Password updated successfully" }
    } catch (error) {
        console.error("Password update error:", error)
        return {
            success: false,
            message: "Failed to update password"
        }
    }
}