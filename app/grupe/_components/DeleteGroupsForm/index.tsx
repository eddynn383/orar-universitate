"use client"

import { deleteGroup } from "@/actions/group";
import { Button } from "@/components/Button";
import { DialogBody, DialogClose, DialogFooter, DialogHeader, DialogTitle } from "@/components/Dialog";
import { FieldGroup, FieldSet } from "@/components/Field";
import { Spinner } from "@/components/Spinner";
import { P } from "@/components/Typography";
import { useActionState, useEffect } from "react";

type GroupsFormProps = {
    defaultValues?: {
        id?: string
    }
    onSuccess?: () => void
}

export function DeleteGroupsForm({ defaultValues, onSuccess }: GroupsFormProps) {
    const [state, formAction, pending] = useActionState(deleteGroup, null)

    console.log("state: ", state)



    useEffect(() => {
        if (state?.success) {
            onSuccess?.()
        }
    }, [state, onSuccess])

    return (
        <form className="flex flex-col" action={formAction}>
            <DialogHeader>
                <DialogTitle>
                    Ștergere group
                </DialogTitle>
            </DialogHeader>
            <DialogBody>
                <P>Ești sigur că vrei să ștergi acest grup? <br /> Această acțiune este permanentă și nu poate fi anulată.</P>
                <FieldSet>
                    <FieldGroup>
                        {defaultValues?.id && (
                            <input type="hidden" name="id" value={defaultValues.id} />
                        )}
                    </FieldGroup>
                </FieldSet>
            </DialogBody>
            <DialogFooter className="sm:justify-end">
                <Button type="submit" variant="destructive">
                    <Spinner className="absolute data-[loading='false']:opacity-0 data-[loading='true']:opacity-100" data-loading={pending} /><span data-loading={pending} className="data-[loading='false']:opacity-100 data-[loading='true']:opacity-0">Sterge</span>
                </Button>
                <DialogClose asChild>
                    <Button type="button" variant="outline">
                        Inchide
                    </Button>
                </DialogClose>
            </DialogFooter>
        </form>
    )
}