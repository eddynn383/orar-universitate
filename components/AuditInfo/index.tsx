// components/AuditInfo.tsx

"use client"

import { formatDistanceToNow } from "date-fns"
import { ro } from "date-fns/locale"

type AuditInfoProps = {
    createdByName?: string
    updatedByName?: string
    createdAt?: Date | string
    updatedAt?: Date | string
    className?: string
}

export function AuditInfo({
    createdByName,
    updatedByName,
    createdAt,
    updatedAt,
    className = "",
}: AuditInfoProps) {

    const formatDate = (date: Date | string) => {
        const d = typeof date === "string" ? new Date(date) : date
        return formatDistanceToNow(d, { addSuffix: true, locale: ro })
    }

    return (
        <div className={`text-sm text-primary-500 space-y-1 ${className}`}>
            {(createdByName && !updatedByName) && (
                <div className="flex items-center">
                    Creat de <span className="font-base text-primary-700 ml-[2px]">{createdByName}</span>
                    {createdAt && (
                        <span className="inline text-primary-400">, cu {formatDate(createdAt)}</span>
                    )}
                </div>
            )}
            {(updatedByName && createdByName) && (
                <div className="flex inline items-center">
                    Modificat de <span className="font-base text-primary-700 ml-[2px]">{updatedByName}</span>
                    {updatedAt && (
                        <span className="inline text-primary-400">, cu {formatDate(updatedAt)}</span>
                    )}
                </div>
            )}
        </div>
    )
}