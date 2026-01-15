// components/DialogFooterWithAudit.tsx

"use client"

import { ReactNode } from "react"
import { AuditInfo } from "../AuditInfo"

type AuditUser = {
    id: string
    name: string | null
    email: string | null
    image: string | null
} | null

type DialogFooterWithAuditProps = {
    children: ReactNode
    createdBy?: AuditUser
    createdAt?: Date | string
    updatedBy?: AuditUser
    updatedAt?: Date | string
    className?: string
}

export function DialogFooterWithAudit({
    children,
    createdBy,
    createdAt,
    updatedBy,
    updatedAt,
    className = "",
}: DialogFooterWithAuditProps) {
    const hasAuditInfo = createdBy || createdAt || updatedBy || updatedAt

    return (
        <div className={`flex items-end justify-between gap-4 w-full ${className}`}>
            {/* Audit info - left side */}
            <div className="flex-1 min-w-0">
                {hasAuditInfo && (
                    <AuditInfo
                        createdBy={createdBy}
                        createdAt={createdAt}
                        updatedBy={updatedBy}
                        updatedAt={updatedAt}
                    />
                )}
            </div>

            {/* Action buttons - right side */}
            <div className="flex items-center gap-4 flex-shrink-0">
                {children}
            </div>
        </div>
    )
}