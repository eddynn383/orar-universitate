"use client"

import { createClassroom, updateClassroom } from "@/actions/classroom";
import { Button } from "@/components/Button";
import { DialogBody, DialogClose, DialogDescription, DialogHeader, DialogTitle } from "@/components/Dialog";
import { DialogFooterWithAudit } from "@/components/DialogFooterWithAudit";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/Field";
import { Input } from "@/components/Input";
import { Spinner } from "@/components/Spinner";
import { AuditUser } from "@/types/global";
import { useActionState, useEffect, useState } from "react";

type ActionState = {
    success: boolean
    message?: string
    errors?: {
        name?: string[]
        capacity?: string[]
        building?: string[]
    }
} | null

type ClassroomFormProps = {
    defaultValues?: {
        id?: string
        name?: string
        capacity?: number
        building?: string
        createdAt?: Date | string
        updatedAt?: Date | string
        createdBy?: AuditUser
        updatedBy?: AuditUser
    }
    onSuccess?: () => void
}

export function ClassroomForm({ defaultValues, onSuccess }: ClassroomFormProps) {
    const mode = defaultValues?.id ? 'edit' : 'create'
    const action = mode === 'edit' ? updateClassroom : createClassroom

    const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null)

    useEffect(() => {
        if (state?.success) {
            onSuccess?.()
        }
    }, [state, onSuccess])

    const title = mode === 'edit' ? 'Editează sală' : 'Adaugă sală'
    const description = mode === 'edit'
        ? 'Modifică informațiile sălii'
        : 'Adaugă o sală nouă folosind formularul de mai jos'
    const submitText = mode === 'edit' ? 'Actualizează' : 'Creează'

    return (
        <form className="flex flex-col h-full overflow-hidden" action={formAction}>
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <DialogBody>
                <FieldSet>
                    <FieldGroup>
                        {mode === 'edit' && defaultValues?.id && (
                            <input type="hidden" name="id" value={defaultValues.id} />
                        )}

                        <Field data-invalid={state?.errors?.name ? true : undefined}>
                            <FieldLabel htmlFor="name">Nume sală</FieldLabel>
                            <Input
                                id="name"
                                name="name"
                                sizes="L"
                                type="text"
                                placeholder="A101"
                                defaultValue={defaultValues?.name}
                                aria-invalid={state?.errors?.name ? true : undefined}
                            />
                            <FieldError>{state?.errors?.name?.[0]}</FieldError>
                        </Field>

                        <div className="flex flex-col sm:flex-row gap-y-7 sm:gap-x-4">
                            <Field className="flex-1" data-invalid={state?.errors?.capacity ? true : undefined}>
                                <FieldLabel htmlFor="capacity">Capacitate</FieldLabel>
                                <Input
                                    id="capacity"
                                    name="capacity"
                                    sizes="L"
                                    type="number"
                                    min="0"
                                    placeholder="30"
                                    defaultValue={defaultValues?.capacity?.toString() || ""}
                                    aria-invalid={state?.errors?.capacity ? true : undefined}
                                />
                                <FieldError>{state?.errors?.capacity?.[0]}</FieldError>
                            </Field>

                            <Field className="flex-1" data-invalid={state?.errors?.building ? true : undefined}>
                                <FieldLabel htmlFor="building">Clădire</FieldLabel>
                                <Input
                                    id="building"
                                    name="building"
                                    sizes="L"
                                    type="text"
                                    placeholder="Corp A"
                                    defaultValue={defaultValues?.building || ""}
                                    aria-invalid={state?.errors?.building ? true : undefined}
                                />
                                <FieldError>{state?.errors?.building?.[0]}</FieldError>
                            </Field>
                        </div>
                    </FieldGroup>
                </FieldSet>
            </DialogBody>
            <DialogFooterWithAudit createdAt={defaultValues?.createdAt} updatedAt={defaultValues?.updatedAt} createdBy={defaultValues?.createdBy} updatedBy={defaultValues?.updatedBy} >
                <Button type="submit" variant="brand" disabled={pending}>
                    <Spinner
                        className="absolute data-[loading='false']:opacity-0 data-[loading='true']:opacity-100"
                        data-loading={pending}
                    />
                    <span
                        data-loading={pending}
                        className="data-[loading='false']:opacity-100 data-[loading='true']:opacity-0"
                    >
                        {submitText}
                    </span>
                </Button>
                <DialogClose asChild>
                    <Button type="button" variant="outline">
                        Închide
                    </Button>
                </DialogClose>
            </DialogFooterWithAudit>
        </form>
    )
}