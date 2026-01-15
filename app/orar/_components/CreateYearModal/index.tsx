"use client"

import { useActionState, useEffect, useState } from "react"
import { createYear } from "@/actions/academicYear"
import { Button } from "@/components/Button"
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/Dialog"
import { Years } from "../Years"
import { Spinner } from "@/components/Spinner"

type CreateYearModalProps = {
    trigger: React.ReactNode
    startCount?: number
}

export function CreateYearModal({ trigger, startCount = 2025 }: CreateYearModalProps) {
    const [open, setOpen] = useState(false)
    const [state, formAction, pending] = useActionState(createYear, null)

    useEffect(() => {
        if (state?.success) {
            setOpen(false)
        }
    }, [state])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <form className="flex flex-col gap-6" action={formAction}>
                    <DialogHeader>
                        <DialogTitle>Creează an universitar</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        <Years startCount={startCount} />
                    </DialogBody>
                    <DialogFooter className="sm:justify-end">
                        <Button type="submit" variant="brand" disabled={pending}>
                            <Spinner
                                className="absolute data-[loading='false']:opacity-0 data-[loading='true']:opacity-100"
                                data-loading={pending}
                            />
                            <span
                                data-loading={pending}
                                className="data-[loading='false']:opacity-100 data-[loading='true']:opacity-0"
                            >
                                Creează
                            </span>
                        </Button>
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Închide
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}