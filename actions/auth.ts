// actions/auth.ts
"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"

export async function login(prevState: any, formData: FormData) {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const callbackUrl = formData.get("callbackUrl") as string || "/orar"

    if (!email || !password) {
        return {
            success: false,
            message: "Email și parola sunt obligatorii"
        }
    }

    try {
        await signIn("credentials", {
            email,
            password,
            redirect: false,
        })
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return {
                        success: false,
                        message: "Email sau parolă incorectă"
                    }
                default:
                    return {
                        success: false,
                        message: "A apărut o eroare la autentificare"
                    }
            }
        }
        throw error
    }

    redirect(callbackUrl)
}