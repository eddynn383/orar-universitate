"use client"

import { deleteTeacher, updateTeacher } from "@/actions/teacher";
import { Button } from "@/components/Button";
import { DialogBody, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/Dialog";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/Field";
import { Input } from "@/components/Input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/Select";
import { Spinner } from "@/components/Spinner";
import { P } from "@/components/Typography";
import { useActionState, useEffect } from "react";

const TITLES = [{
    name: "None",
    value: "None"
}, {
    name: "Doctor",
    value: "Dr."
}]

const GRADES = [
    {
        name: "Asistent",
        value: "Asist."
    },
    {
        name: "Lector",
        value: "Lect."
    },
    {
        name: "Conferențiar",
        value: "Conf."
    },
    {
        name: "Profesor",
        value: "Prof."
    }
]

const DEPARTMENTS = [{
    name: "Informatica",
    value: "INFORMATICA"
}, {
    name: "Matematica",
    value: "MATEMATICA"
}]

type TeacherFormProps = {
    defaultValues?: {
        id?: string
    }
    onSuccess?: () => void
}

export function DeleteTeacherForm({ defaultValues, onSuccess }: TeacherFormProps) {
    const [state, formAction, pending] = useActionState(deleteTeacher, null)

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
                    Ștergere cadru didactic
                </DialogTitle>
            </DialogHeader>
            <DialogBody>
                <P>Ești sigur că vrei să ștergi acest cadru didactic? <br /> Această acțiune este permanentă și nu poate fi anulată.</P>
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