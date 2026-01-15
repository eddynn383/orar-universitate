
// lib/auth-action.ts

import { auth } from "@/auth"
import { ROLES, Role, hasMinimumRole, hasAnyRole } from "@/lib/auth-utils"

export type AuthResult = {
    success: true
    user: {
        id: string
        role: string
        email: string
        name?: string
    }
} | {
    success: false
    error: string
    status: 401 | 403
}

/**
 * Verifică autentificarea și autorizarea pentru server actions
 * 
 * @param options - Opțiuni de autorizare
 * @returns AuthResult cu user sau eroare
 * 
 * @example
 * // Verifică doar autentificarea
 * const authResult = await checkActionAuth()
 * 
 * @example
 * // Verifică rol specific
 * const authResult = await checkActionAuth({ allowedRoles: ['ADMIN'] })
 * 
 * @example
 * // Verifică rol minim
 * const authResult = await checkActionAuth({ minimumRole: 'SECRETAR' })
 */
export async function checkActionAuth(options?: {
    allowedRoles?: Role[]
    minimumRole?: Role
}): Promise<AuthResult> {
    const session = await auth()

    // Verifică autentificarea
    if (!session?.user) {
        return {
            success: false,
            error: "Neautorizat - Autentificare necesară",
            status: 401
        }
    }

    const user = session.user as { id: string; role: string; email?: string; name?: string }

    // Verifică roluri specifice
    if (options?.allowedRoles && !hasAnyRole(user.role, options.allowedRoles)) {
        return {
            success: false,
            error: "Acces interzis - Nu aveți permisiunile necesare",
            status: 403
        }
    }

    // Verifică rol minim
    if (options?.minimumRole && !hasMinimumRole(user.role, options.minimumRole)) {
        return {
            success: false,
            error: "Acces interzis - Nivel de acces insuficient",
            status: 403
        }
    }

    return {
        success: true,
        user: {
            id: user.id,
            role: user.role,
            email: user.email || "",
            name: user.name
        }
    }
}

/**
 * Verifică dacă utilizatorul curent este admin
 */
export async function requireAdmin(): Promise<AuthResult> {
    return checkActionAuth({ allowedRoles: ['ADMIN'] })
}

/**
 * Verifică dacă utilizatorul curent este admin sau secretar
 */
export async function requireAdminOrSecretar(): Promise<AuthResult> {
    return checkActionAuth({ allowedRoles: ['ADMIN', 'SECRETAR'] })
}

/**
 * Verifică dacă utilizatorul curent este autentificat
 */
export async function requireAuth(): Promise<AuthResult> {
    return checkActionAuth()
}

/**
 * Obține utilizatorul curent fără a verifica rolul
 * Returnează null dacă nu este autentificat
 */
export async function getCurrentUser() {
    const session = await auth()

    if (!session?.user) {
        return null
    }

    return session.user as {
        id: string
        role: string
        email?: string
        name?: string
    }
}