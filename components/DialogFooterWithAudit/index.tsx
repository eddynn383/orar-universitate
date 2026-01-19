// components/DialogFooterWithAudit.tsx

"use client"

import { ReactNode } from "react"
import { AuditInfo } from "../AuditInfo"
import { DialogFooter } from "../Dialog"
import { AuditUser } from "@/types/global"

// type AuditUser = {
//     id: string
//     name: string | null
//     email: string | null
//     image: string | null
// } | null

type DialogFooterWithAuditProps = {
    children: ReactNode
    createdAt?: Date | string
    updatedAt?: Date | string
    createdBy?: AuditUser
    updatedBy?: AuditUser
}

export function DialogFooterWithAudit({
    children,
    createdBy,
    createdAt,
    updatedBy,
    updatedAt,
}: DialogFooterWithAuditProps) {

    return (
        <DialogFooter className="sm:justify-end">
            {/* Audit info - left side */}
            <div className="flex flex-1 min-w-0 items-center">
                {(createdBy !== null || createdBy !== undefined) &&
                    <AuditInfo
                        createdByName={createdBy?.name}
                        updatedByName={updatedBy?.name}
                        createdAt={createdAt}
                        updatedAt={updatedAt}
                    />
                }
            </div>

            {/* Action buttons - right side */}
            <div className="flex items-center gap-4 flex-shrink-0">
                {children}
            </div>
        </DialogFooter>
    )
}