// app/users/_components/CreateUserModal.tsx

"use client"

import { Button } from "@/components/Button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/Dialog"
import { UserForm } from "../UserForm"
import { CirclePlus } from "lucide-react"
import { useState } from "react"

type CreateUserModalProps = {
    trigger: React.ReactNode
}

export function CreateUserModal({ trigger }: CreateUserModalProps) {
    const [showDialog, setShowDialog] = useState(false)

    return (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
                {
                    trigger
                }
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <UserForm onSuccess={() => setShowDialog(false)} />
            </DialogContent>
        </Dialog>
    )
}