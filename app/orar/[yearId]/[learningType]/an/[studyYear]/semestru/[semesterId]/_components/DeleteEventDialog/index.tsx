"use client"

import { Button } from "@/components/Button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogBody } from "@/components/Dialog"
import { Spinner } from "@/components/Spinner"
import { P } from "@/components/Typography"
import { AlertTriangle } from "lucide-react"

type DeleteEventDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    eventName: string
    onConfirm: () => void
    isDeleting: boolean
}

export function DeleteEventDialog({
    open,
    onOpenChange,
    eventName,
    onConfirm,
    isDeleting,
}: DeleteEventDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <DialogTitle>Șterge eveniment</DialogTitle>
                            <DialogDescription>
                                Această acțiune nu poate fi anulată.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <DialogBody>
                    <P>Sigur doriți să ștergeți evenimentul <strong>"{eventName}"</strong> din orar?</P>
                </DialogBody>
                <DialogFooter className="gap-2 sm:gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                    >
                        Anulează
                    </Button>
                    <Button
                        type="button"
                        variant="brand"
                        className="bg-red-600 hover:bg-red-700"
                        onClick={onConfirm}
                        disabled={isDeleting}
                    >
                        <Spinner
                            className="absolute data-[loading='false']:opacity-0 data-[loading='true']:opacity-100"
                            data-loading={isDeleting}
                        />
                        <span
                            data-loading={isDeleting}
                            className="data-[loading='false']:opacity-100 data-[loading='true']:opacity-0"
                        >
                            Șterge
                        </span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}