"use client"

import { deleteClassroom } from "@/actions/classroom";
import { Button } from "@/components/Button";
import { DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/Dialog";
import { Spinner } from "@/components/Spinner";
import { useActionState, useEffect } from "react";

type DeleteClassroomFormProps = {
    defaultValues?: {
        id?: string
        name?: string
    }
    onSuccess?: () => void
}

export function DeleteClassroomForm({ defaultValues, onSuccess }: DeleteClassroomFormProps) {
    const [state, formAction, pending] = useActionState(deleteClassroom, null)

    useEffect(() => {
        if (state?.success) {
            onSuccess?.()
        }
    }, [state, onSuccess])

    return (
        <form className="flex flex-col gap-6" action={formAction}>
            <DialogHeader>
                <DialogTitle>Șterge sala</DialogTitle>
                <DialogDescription>
                    Ești sigur că vrei să ștergi sala <strong>{defaultValues?.name}</strong>?
                    Această acțiune nu poate fi anulată.
                </DialogDescription>
            </DialogHeader>

            {defaultValues?.id && (
                <input type="hidden" name="id" value={defaultValues.id} />
            )}

            <DialogFooter className="sm:justify-end">
                <Button type="submit" variant="destructive" disabled={pending}>
                    <Spinner
                        className="absolute data-[loading='false']:opacity-0 data-[loading='true']:opacity-100"
                        data-loading={pending}
                    />
                    <span
                        data-loading={pending}
                        className="data-[loading='false']:opacity-100 data-[loading='true']:opacity-0"
                    >
                        Șterge
                    </span>
                </Button>
                <DialogClose asChild>
                    <Button type="button" variant="outline">
                        Anulează
                    </Button>
                </DialogClose>
            </DialogFooter>
        </form>
    )
}