"use client"

import { deleteStudent } from "@/actions/student"
import { Button } from "@/components/Button"
import {
    DialogBody,
    DialogClose,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/Dialog"
import { P } from "@/components/Typography"
import { Spinner } from "@/components/Spinner"
import { useActionState, useEffect } from "react"

type ActionState = {
    success: boolean
    message?: string
} | null

type DeleteStudentFormProps = {
    defaultValues: {
        id?: string
        firstname?: string
        lastname?: string
    }
    onSuccess?: () => void
}

export function DeleteStudentForm({ defaultValues, onSuccess }: DeleteStudentFormProps) {
    const [state, formAction, pending] = useActionState<ActionState, FormData>(deleteStudent, null)

    useEffect(() => {
        if (state?.success) {
            onSuccess?.()
        }
    }, [state, onSuccess])

    return (
        <form action={formAction}>
            <DialogHeader>
                <DialogTitle>Șterge student</DialogTitle>
                <DialogDescription>
                    Această acțiune nu poate fi anulată. Studentul va fi șters permanent din baza de date.
                </DialogDescription>
            </DialogHeader>
            <DialogBody>
                <input type="hidden" name="id" value={defaultValues.id} />
                <P>
                    Ești sigur că vrei să ștergi studentul{" "}
                    <strong>
                        {defaultValues.firstname} {defaultValues.lastname}
                    </strong>
                    ?
                </P>
                {state?.message && !state.success && (
                    <P className="text-destructive text-sm mt-2">{state.message}</P>
                )}
            </DialogBody>
            <DialogFooter>
                <DialogClose asChild disabled={pending}>
                    <Button variant="outline">Anulează</Button>
                </DialogClose>
                <Button type="submit" variant="destructive" disabled={pending}>
                    {pending && <Spinner className="text-primary-foreground" />}
                    Șterge
                </Button>
            </DialogFooter>
        </form>
    )
}
