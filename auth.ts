// lib/auth.ts
// Full auth configuration with Prisma adapter (server-only)

import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma"
import authConfig from "@/auth.config"
import type { Adapter } from "next-auth/adapters"

export const { handlers, signIn, signOut, auth } = NextAuth({
    pages: {
        signIn: "/login",
        error: "/login",
    },
    adapter: PrismaAdapter(prisma) as Adapter,
    session: {
        strategy: "jwt",
    },
    ...authConfig,
})

// Helper function to get current user from session
export async function getCurrentUser() {
    const session = await auth()
    return session?.user
}

// Helper function to check if user has required role
export async function checkRole(allowedRoles: string[]) {
    const user = await getCurrentUser()
    if (!user) return false
    return allowedRoles.includes(user.role)
}