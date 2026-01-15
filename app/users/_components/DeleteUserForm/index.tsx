// app/users/_components/DeleteUserForm.tsx

"use client"

import { deleteUser } from "@/actions/user";
import { Button } from "@/components/Button";
import { DialogBody, DialogClose, DialogFooter, DialogHeader, DialogTitle } from "@/components/Dialog";
import { Spinner } from "@/components/Spinner";
import { P } from "@/components/Typography";
import { useActionState, useEffect } from "react";

type DeleteUserFormProps = {
    defaultValues?: {
        id?: string
        name?: string
    }
    onSuccess?: () => void
}

export function DeleteUserForm({ defaultValues, onSuccess }: DeleteUserFormProps) {
    const [state, formAction, pending] = useActionState(deleteUser, null)

    useEffect(() => {
        if (state?.success) {
            onSuccess?.()
        }
    }, [state, onSuccess])

    return (
        <form className="flex flex-col" action={formAction}>
            <DialogHeader>
                <DialogTitle>Ștergere utilizator</DialogTitle>
            </DialogHeader>
            <DialogBody>
                <P>
                    Ești sigur că vrei să ștergi utilizatorul{" "}
                    <strong>{defaultValues?.name || "acest utilizator"}</strong>?
                </P>
                <P className="text-primary-600">
                    Această acțiune este permanentă și nu poate fi anulată.
                </P>

                {defaultValues?.id && (
                    <input type="hidden" name="id" value={defaultValues.id} />
                )}

                {state?.message && !state.success && (
                    <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {state.message}
                    </div>
                )}
            </DialogBody>
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