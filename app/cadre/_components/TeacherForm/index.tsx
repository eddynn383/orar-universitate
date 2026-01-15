"use client"

import { createTeacher, updateTeacher } from "@/actions/teacher";
import { Button } from "@/components/Button";
import { DialogBody, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/Dialog";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/Field";
import { Input } from "@/components/Input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/Select";
import { Spinner } from "@/components/Spinner";
import { ImageUpload } from "@/components/ImageUpload";
import { useActionState, useEffect, useState } from "react";
import { P } from "@/components/Typography";
import { AuditUser } from "@/types/global";
import { DialogFooterWithAudit } from "@/components/DialogFooterWithAudit";

const TITLES = [
    { name: "Fără titlu", value: "None" },
    { name: "Doctor", value: "Dr." },
    { name: "Doctorand", value: "Drd." }
]

const GRADES = [
    { name: "Fără grad", value: "None" },
    { name: "Asistent", value: "Asist." },
    { name: "Lector", value: "Lect." },
    { name: "Conferențiar", value: "Conf." },
    { name: "Profesor", value: "Prof." }
]

type ActionState = {
    success: boolean
    message?: string
    errors?: {
        title?: string[]
        grade?: string[]
        firstname?: string[]
        lastname?: string[]
        email?: string[]
        phone?: string[]
        image?: string[]
    }
} | null

type TeacherFormProps = {
    defaultValues?: {
        id?: string
        title?: string
        grade?: string
        firstname?: string
        lastname?: string
        email?: string
        phone?: string
        image?: string | null
        createdAt?: Date | string
        updatedAt?: Date | string
        createdBy?: AuditUser
        updatedBy?: AuditUser
    }
    onSuccess?: () => void
}

export function TeacherForm({ defaultValues, onSuccess }: TeacherFormProps) {
    const mode = defaultValues?.id ? 'edit' : 'create'
    const action = mode === 'edit' ? updateTeacher : createTeacher

    const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null)

    // State pentru Select-uri și imagine
    const [selectedTitle, setSelectedTitle] = useState<string>(defaultValues?.title || TITLES[0].value)
    const [selectedGrade, setSelectedGrade] = useState<string>(defaultValues?.grade || GRADES[0].value)
    const [imageValue, setImageValue] = useState<string | null>(defaultValues?.image || null)

    useEffect(() => {
        if (state?.success) {
            onSuccess?.()
        }
    }, [state, onSuccess])

    const title = mode === 'edit' ? 'Editează cadru didactic' : 'Crează cadru didactic'
    const description = mode === 'edit'
        ? 'Modifică informațiile cadrului didactic'
        : 'Crează un cadru didactic nou folosind formularul de mai jos'
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
                        <div className="flex flex-1 gap-4">
                            <Field data-invalid={state?.errors?.image ? true : undefined}>
                                <FieldLabel>Fotografie</FieldLabel>
                                <ImageUpload
                                    className="w-full"
                                    endpoint="teacherImage"
                                    name="image"
                                    value={imageValue}
                                    onChange={setImageValue}
                                    disabled={pending}
                                />
                                <FieldError>{state?.errors?.image?.[0]}</FieldError>
                            </Field>
                        </div>
                        <div className="flex flex-1 gap-4">
                            <Field data-invalid={state?.errors?.title ? true : undefined} className="flex-1">
                                <FieldLabel htmlFor="title">Titlu</FieldLabel>
                                <Select
                                    name="title"
                                    value={selectedTitle}
                                    onValueChange={setSelectedTitle}
                                >
                                    <SelectTrigger
                                        size="L"
                                        aria-invalid={state?.errors?.title ? true : undefined}
                                    >
                                        <SelectValue placeholder="Selectează opțiune" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {TITLES.map((title) => (
                                                <SelectItem key={title.value} value={title.value}>
                                                    {title.name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <FieldError>{state?.errors?.title?.[0]}</FieldError>
                            </Field>

                            <Field data-invalid={state?.errors?.grade ? true : undefined} className="flex-1">
                                <FieldLabel htmlFor="grade">Grad</FieldLabel>
                                <Select
                                    name="grade"
                                    value={selectedGrade}
                                    onValueChange={setSelectedGrade}
                                >
                                    <SelectTrigger
                                        size="L"
                                        aria-invalid={state?.errors?.grade ? true : undefined}
                                    >
                                        <SelectValue placeholder="Selectează opțiune" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {GRADES.map((grade) => (
                                                <SelectItem key={grade.value} value={grade.value}>
                                                    {grade.name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <FieldError>{state?.errors?.grade?.[0]}</FieldError>
                            </Field>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-y-7 sm:gap-x-4">
                            <Field data-invalid={state?.errors?.firstname ? true : undefined} className="flex-1">
                                <FieldLabel htmlFor="firstName" className="gap-1">Prenume *</FieldLabel>
                                <Input
                                    id="firstName"
                                    name="firstname"
                                    sizes="L"
                                    type="text"
                                    placeholder="Mihai"
                                    defaultValue={defaultValues?.firstname}
                                    aria-invalid={state?.errors?.firstname ? true : undefined}
                                />
                                <FieldError>{state?.errors?.firstname?.[0]}</FieldError>
                            </Field>

                            <Field data-invalid={state?.errors?.lastname ? true : undefined} className="flex-1">
                                <FieldLabel htmlFor="lastName" className="gap-1">Nume *</FieldLabel>
                                <Input
                                    id="lastName"
                                    name="lastname"
                                    sizes="L"
                                    type="text"
                                    placeholder="Popescu"
                                    defaultValue={defaultValues?.lastname}
                                    aria-invalid={state?.errors?.lastname ? true : undefined}
                                />
                                <FieldError>{state?.errors?.lastname?.[0]}</FieldError>
                            </Field>
                        </div>
                        <div className="flex flex-1 gap-4">
                            <Field data-invalid={state?.errors?.email ? true : undefined}>
                                <FieldLabel htmlFor="email" className="gap-1">Adresa Email *</FieldLabel>
                                <Input
                                    id="email"
                                    name="email"
                                    sizes="L"
                                    type="email"
                                    placeholder="mihai.popescu@example.com"
                                    defaultValue={defaultValues?.email}
                                    aria-invalid={state?.errors?.email ? true : undefined}
                                />
                                <FieldError>{state?.errors?.email?.[0]}</FieldError>
                            </Field>
                            <Field data-invalid={state?.errors?.phone ? true : undefined}>
                                <FieldLabel htmlFor="phone">Telefon</FieldLabel>
                                <Input
                                    id="phone"
                                    name="phone"
                                    sizes="L"
                                    type="tel"
                                    placeholder="+40 123 456 789"
                                    defaultValue={defaultValues?.phone}
                                    aria-invalid={state?.errors?.phone ? true : undefined}
                                />
                                <FieldError>{state?.errors?.phone?.[0]}</FieldError>
                            </Field>
                        </div>
                    </FieldGroup>
                </FieldSet>
                {state?.message && !state.success && (
                    <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {state.message}
                    </div>
                )}
            </DialogBody>
            <DialogFooter className="flex items-center gap-4">
                <DialogFooterWithAudit createdAt={defaultValues?.createdAt} updatedAt={defaultValues?.updatedAt} createdBy={defaultValues?.createdBy} updatedBy={defaultValues?.updatedBy} >
                    <div className="flex-1">
                        <P className="text-sm">Campurile cu * sunt obligatorii</P>
                    </div>
                    <div className="flex gap-4">
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
                    </div>
                </DialogFooterWithAudit>
            </DialogFooter>
        </form>
    )
}