// lib/auth-server.ts

import { auth } from "@/auth"
import { UserRole } from "@/types/global"

/**
 * Obține sesiunea curentă și informațiile despre utilizator
 * Pentru utilizare în Server Components
 */
export async function getCurrentUserServer() {
    const session = await auth()

    if (!session?.user) {
        return null
    }

    return session.user as {
        id: string
        name?: string
        email?: string
        role: UserRole
        image?: string
    }
}

/**
 * Verifică dacă utilizatorul curent este admin
 * Pentru utilizare în Server Components
 */
export async function isAdminServer(): Promise<boolean> {
    const user = await getCurrentUserServer()
    return user?.role === "ADMIN"
}

/**
 * Verifică dacă utilizatorul curent este admin sau secretar
 * Pentru utilizare în Server Components
 */
export async function isAdminOrSecretarServer(): Promise<boolean> {
    const user = await getCurrentUserServer()
    return user?.role === "ADMIN" || user?.role === "SECRETAR"
}

/**
 * Verifică dacă utilizatorul curent are unul dintre rolurile specificate
 * Pentru utilizare în Server Components
 */
export async function hasRoleServer(allowedRoles: UserRole[]): Promise<boolean> {
    const user = await getCurrentUserServer()
    return user?.role ? allowedRoles.includes(user.role) : false
}