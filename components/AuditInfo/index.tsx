// components/AuditInfo.tsx

"use client"

import { User, Clock, Edit } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ro } from "date-fns/locale"

type AuditUser = {
    id: string
    name: string | null
    email: string | null
    image: string | null
} | null

type AuditInfoProps = {
    createdBy?: AuditUser
    createdAt?: Date | string
    updatedBy?: AuditUser
    updatedAt?: Date | string
    className?: string
}

export function AuditInfo({
    createdBy,
    createdAt,
    updatedBy,
    updatedAt,
    className = "",
}: AuditInfoProps) {
    const formatDate = (date: Date | string) => {
        const d = typeof date === "string" ? new Date(date) : date
        return formatDistanceToNow(d, { addSuffix: true, locale: ro })
    }

    const getUserName = (user: AuditUser | undefined) => {
        if (!user) return "Necunoscut"
        return user.name || user.email || "Necunoscut"
    }

    // Determine if we should show updated info (different from created)
    const showUpdated = updatedBy && updatedAt && (
        !createdBy ||
        updatedBy.id !== createdBy.id ||
        (createdAt && updatedAt && new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 1000)
    )

    return (
        <div className={`text-xs text-primary-500 space-y-1 ${className}`}>
            {/* Created info */}
            {(createdBy || createdAt) && (
                <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3" />
                    <span>
                        Creat de <span className="font-medium text-primary-700">{getUserName(createdBy)}</span>
                        {createdAt && (
                            <span className="text-primary-400"> · {formatDate(createdAt)}</span>
                        )}
                    </span>
                </div>
            )}

            {/* Updated info - only show if different from created */}
            {showUpdated && (
                <div className="flex items-center gap-1.5">
                    <Edit className="w-3 h-3" />
                    <span>
                        Modificat de <span className="font-medium text-primary-700">{getUserName(updatedBy)}</span>
                        {updatedAt && (
                            <span className="text-primary-400"> · {formatDate(updatedAt)}</span>
                        )}
                    </span>
                </div>
            )}
        </div>
    )
}

// Compact version for smaller spaces
export function AuditInfoCompact({
    updatedBy,
    updatedAt,
    className = "",
}: {
    updatedBy?: AuditUser
    updatedAt?: Date | string
    className?: string
}) {
    if (!updatedBy && !updatedAt) return null

    const formatDate = (date: Date | string) => {
        const d = typeof date === "string" ? new Date(date) : date
        return formatDistanceToNow(d, { addSuffix: true, locale: ro })
    }

    const userName = updatedBy?.name || updatedBy?.email || "Necunoscut"

    return (
        <div className={`text-xs text-primary-500 flex items-center gap-1 ${className}`}>
            <Edit className="w-3 h-3" />
            <span title={`Modificat de ${userName}`}>
                {userName}
                {updatedAt && <span className="text-primary-400"> · {formatDate(updatedAt)}</span>}
            </span>
        </div>
    )
}