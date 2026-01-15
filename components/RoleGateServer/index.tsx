// components/RoleGateServer.tsx

import { getCurrentUserServer } from "@/lib/auth-server"
import { UserRole } from "@/types/global"
import { ReactNode } from "react"

type RoleGateServerProps = {
    children: ReactNode
    allowedRoles: UserRole[]
    fallback?: ReactNode
}

/**
 * Componentă Server pentru a afișa conținut doar pentru anumite roluri
 * Nu necesită "use client" - funcționează în Server Components
 * 
 * @example
 * <RoleGateServer allowedRoles={["ADMIN"]}>
 *   <CreateTeacherButton />
 * </RoleGateServer>
 */
export async function RoleGateServer({
    children,
    allowedRoles,
    fallback = null
}: RoleGateServerProps) {
    const user = await getCurrentUserServer()

    if (!user?.role || !allowedRoles.includes(user.role)) {
        return <>{fallback}</>
    }

    return <>{children}</>
}

/**
 * Componentă Server pentru a afișa conținut doar pentru admini
 */
export async function AdminOnlyServer({
    children,
    fallback = null
}: {
    children: ReactNode
    fallback?: ReactNode
}) {
    return (
        <RoleGateServer allowedRoles={["ADMIN"]} fallback={fallback}>
            {children}
        </RoleGateServer>
    )
}

/**
 * Componentă Server pentru a afișa conținut pentru admini și secretari
 */
export async function AdminOrSecretarOnlyServer({
    children,
    fallback = null
}: {
    children: ReactNode
    fallback?: ReactNode
}) {
    return (
        <RoleGateServer allowedRoles={["ADMIN", "SECRETAR"]} fallback={fallback}>
            {children}
        </RoleGateServer>
    )
}

/**
 * Componentă Server pentru a afișa conținut pentru staff (admin, secretar, profesor)
 */
export async function StaffOnlyServer({
    children,
    fallback = null
}: {
    children: ReactNode
    fallback?: ReactNode
}) {
    return (
        <RoleGateServer allowedRoles={["ADMIN", "SECRETAR", "PROFESOR"]} fallback={fallback}>
            {children}
        </RoleGateServer>
    )
}