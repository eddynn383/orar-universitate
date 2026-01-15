// hooks/useCurrentUser.ts

import { UserRole } from "@/types/global"
import { useSession } from "next-auth/react"

export function useCurrentUser() {
    const { data: session, status } = useSession()

    const user = session?.user as {
        id: string
        name?: string
        email?: string
        role: UserRole
        image?: string
    } | undefined

    return {
        user,
        isLoading: status === "loading",
        isAuthenticated: status === "authenticated",
        role: user?.role,
    }
}

export function useIsAdmin() {
    const { role, isLoading } = useCurrentUser()
    return {
        isAdmin: role === "ADMIN",
        isLoading
    }
}

export function useIsAdminOrSecretar() {
    const { role, isLoading } = useCurrentUser()
    return {
        isAdminOrSecretar: role === "ADMIN" || role === "SECRETAR",
        isLoading
    }
}

export function useHasRole(allowedRoles: UserRole[]) {
    const { role, isLoading } = useCurrentUser()
    return {
        hasRole: role ? allowedRoles.includes(role) : false,
        isLoading
    }
}