import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

// Define user roles
export const ROLES = {
    ADMIN: "ADMIN",
    SECRETAR: "SECRETAR",
    PROFESOR: "PROFESOR",
    STUDENT: "STUDENT",
    USER: "USER"
} as const

export type Role = keyof typeof ROLES

// Role hierarchy - higher roles include permissions of lower roles
export const ROLE_HIERARCHY: Record<Role, number> = {
    ADMIN: 100,
    SECRETAR: 80,
    PROFESOR: 60,
    STUDENT: 40,
    USER: 20
}

// Check if user has at least the required role level
export function hasMinimumRole(userRole: string, requiredRole: Role): boolean {
    const userLevel = ROLE_HIERARCHY[userRole as Role] || 0
    const requiredLevel = ROLE_HIERARCHY[requiredRole]
    return userLevel >= requiredLevel
}

// Check if user has one of the allowed roles
export function hasAnyRole(userRole: string, allowedRoles: Role[]): boolean {
    return allowedRoles.includes(userRole as Role)
}

// API Route protection wrapper
export async function withAuth(
    request: NextRequest,
    handler: (request: NextRequest, user: { id: string; role: string; email: string }) => Promise<NextResponse>,
    options?: {
        allowedRoles?: Role[]
        minimumRole?: Role
    }
) {
    const session = await auth()

    if (!session?.user) {
        return NextResponse.json(
            { error: "Neautorizat - Autentificare necesară" },
            { status: 401 }
        )
    }

    const user = session.user as { id: string; role: string; email?: string }

    // Check for specific roles
    if (options?.allowedRoles && !hasAnyRole(user.role, options.allowedRoles)) {
        return NextResponse.json(
            { error: "Acces interzis - Nu aveți permisiunile necesare" },
            { status: 403 }
        )
    }

    // Check for minimum role level
    if (options?.minimumRole && !hasMinimumRole(user.role, options.minimumRole)) {
        return NextResponse.json(
            { error: "Acces interzis - Nivel de acces insuficient" },
            { status: 403 }
        )
    }

    return handler(request, { ...user, email: user.email || "" })
}

// Higher-order function for protecting API routes
export function createProtectedHandler(
    handler: (request: NextRequest, user: { id: string; role: string; email: string }) => Promise<NextResponse>,
    options?: {
        allowedRoles?: Role[]
        minimumRole?: Role
    }
) {
    return async (request: NextRequest) => {
        return withAuth(request, handler, options)
    }
}