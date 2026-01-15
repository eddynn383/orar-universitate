// components/RoleGate.tsx

"use client"

import { useCurrentUser } from "@/hooks/useCurrentUser"
import { UserRole } from "@/types/global"
import { ReactNode } from "react"

type RoleGateProps = {
    children: ReactNode
    allowedRoles: UserRole[]
    fallback?: ReactNode
    showLoading?: boolean
}

/**
 * Componentă Client pentru a afișa conținut doar pentru anumite roluri
 * 
 * @example
 * <RoleGate allowedRoles={["ADMIN"]}>
 *   <Button>Adaugă cadru didactic</Button>
 * </RoleGate>
 * 
 * @example
 * <RoleGate allowedRoles={["ADMIN", "SECRETAR"]} fallback={<p>Nu ai acces</p>}>
 *   <AdminPanel />
 * </RoleGate>
 */
export function RoleGate({
    children,
    allowedRoles,
    fallback = null,
    showLoading = false
}: RoleGateProps) {
    const { role, isLoading } = useCurrentUser()

    if (isLoading) {
        return showLoading ? <div className="animate-pulse bg-primary-200 rounded h-8 w-24" /> : null
    }

    if (!role || !allowedRoles.includes(role)) {
        return <>{fallback}</>
    }

    return <>{children}</>
}

/**
 * Componentă pentru a afișa conținut doar pentru admini
 */
export function AdminOnly({
    children,
    fallback = null
}: {
    children: ReactNode
    fallback?: ReactNode
}) {
    return (
        <RoleGate allowedRoles={["ADMIN"]} fallback={fallback}>
            {children}
        </RoleGate>
    )
}

/**
 * Componentă pentru a afișa conținut pentru admini și secretari
 */
export function AdminOrSecretarOnly({
    children,
    fallback = null
}: {
    children: ReactNode
    fallback?: ReactNode
}) {
    return (
        <RoleGate allowedRoles={["ADMIN", "SECRETAR"]} fallback={fallback}>
            {children}
        </RoleGate>
    )
}

/**
 * Componentă pentru a afișa conținut pentru profesori și mai sus
 */
export function StaffOnly({
    children,
    fallback = null
}: {
    children: ReactNode
    fallback?: ReactNode
}) {
    return (
        <RoleGate allowedRoles={["ADMIN", "SECRETAR", "PROFESOR"]} fallback={fallback}>
            {children}
        </RoleGate>
    )
}