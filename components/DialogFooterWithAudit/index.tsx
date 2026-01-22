"use client"

import { ReactNode } from "react"
import { AuditInfo } from "../AuditInfo"
import { DialogFooter } from "../Dialog"

type DialogFooterWithAuditProps = {
    children: ReactNode
    createdAt?: Date | string
    updatedAt?: Date | string
    createdBy?: string | undefined
    updatedBy?: string | undefined
}

export function DialogFooterWithAudit({
    children,
    createdBy,
    createdAt,
    updatedBy,
    updatedAt,
}: DialogFooterWithAuditProps) {

    console.log("AAAA: ", createdBy, createdAt, updatedBy, updatedAt);

    return (
        <DialogFooter className="sm:justify-end">
            <div className="flex flex-1 min-w-0 items-center">
                {(createdBy !== null || createdBy !== undefined) &&
                    <AuditInfo
                        createdBy={createdBy}
                        updatedBy={updatedBy}
                        createdAt={createdAt}
                        updatedAt={updatedAt}
                    />
                }
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
                {children}
            </div>
        </DialogFooter>
    )
}