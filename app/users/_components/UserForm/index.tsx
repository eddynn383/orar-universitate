// app/users/_components/UserForm.tsx

"use client"

import { Button } from "@/components/Button";
import { DialogBody, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/Dialog";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/Field";
import { Input } from "@/components/Input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/Select";
import { Spinner } from "@/components/Spinner";
import { useActionState, useEffect, useState } from "react";
import { createUser, updateUser } from "@/actions/user";
import { Eye, EyeOff } from "lucide-react";

export const ROLES = [
    { name: "Administrator", value: "ADMIN" },
    { name: "Secretar", value: "SECRETAR" },
    { name: "Profesor", value: "PROFESOR" },
    { name: "Student", value: "STUDENT" },
    { name: "Utilizator", value: "USER" }
]

type ActionState = {
    success: boolean
    message?: string
    errors?: {
        name?: string[]
        email?: string[]
        role?: string[]
        password?: string[]
        image?: string[]
    }
} | null

type UserFormProps = {
    defaultValues?: {
        id?: string
        name?: string
        email?: string
        role?: string
        image?: string
    }
    onSuccess?: () => void
}

export function UserForm({ defaultValues, onSuccess }: UserFormProps) {
    const mode = defaultValues?.id ? 'edit' : 'create'
    const action = mode === 'edit' ? updateUser : createUser

    const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null)
    const [selectedRole, setSelectedRole] = useState<string>(defaultValues?.role || "USER")
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {
        if (state?.success) {
            onSuccess?.()
        }
    }, [state, onSuccess])

    const title = mode === 'edit' ? 'Editează utilizator' : 'Adaugă utilizator'
    const description = mode === 'edit'
        ? 'Modifică informațiile utilizatorului'
        : 'Adaugă un utilizator nou folosind formularul de mai jos'
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
                            <FieldLabel htmlFor="name">Nume</FieldLabel>
                            <Input
                                id="name"
                                name="name"
                                sizes="L"
                                type="text"
                                placeholder="Ion Popescu"
                                defaultValue={defaultValues?.name}
                                aria-invalid={state?.errors?.name ? true : undefined}
                            />
                            <FieldError>{state?.errors?.name?.[0]}</FieldError>
                        </Field>

                        <Field data-invalid={state?.errors?.email ? true : undefined}>
                            <FieldLabel htmlFor="email">Email</FieldLabel>
                            <Input
                                id="email"
                                name="email"
                                sizes="L"
                                type="email"
                                placeholder="ion.popescu@example.com"
                                defaultValue={defaultValues?.email}
                                aria-invalid={state?.errors?.email ? true : undefined}
                            />
                            <FieldError>{state?.errors?.email?.[0]}</FieldError>
                        </Field>

                        <Field data-invalid={state?.errors?.password ? true : undefined}>
                            <FieldLabel htmlFor="password">
                                {mode === 'edit' ? 'Parolă nouă (opțional)' : 'Parolă'}
                            </FieldLabel>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    sizes="L"
                                    type={showPassword ? "text" : "password"}
                                    placeholder={mode === 'edit' ? "Lasă gol pentru a păstra parola actuală" : "Minim 6 caractere"}
                                    className="pr-10"
                                    aria-invalid={state?.errors?.password ? true : undefined}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-500 hover:text-primary-700"
                                >
                                    {showPassword ? (
                                        <EyeOff className="size-5" />
                                    ) : (
                                        <Eye className="size-5" />
                                    )}
                                </button>
                            </div>
                            <FieldError>{state?.errors?.password?.[0]}</FieldError>
                        </Field>

                        <Field data-invalid={state?.errors?.role ? true : undefined}>
                            <FieldLabel htmlFor="role">Rol</FieldLabel>
                            <Select
                                name="role"
                                value={selectedRole}
                                onValueChange={setSelectedRole}
                            >
                                <SelectTrigger size="L" aria-invalid={state?.errors?.role ? true : undefined}>
                                    <SelectValue placeholder="Selectează rolul" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {ROLES.map((role) => (
                                            <SelectItem key={role.value} value={role.value}>
                                                {role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <FieldError>{state?.errors?.role?.[0]}</FieldError>
                        </Field>
                    </FieldGroup>
                </FieldSet>

                {state?.message && !state.success && (
                    <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {state.message}
                    </div>
                )}
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
                        {submitText}
                    </span>
                </Button>
                <DialogClose asChild>
                    <Button type="button" variant="outline">
                        Închide
                    </Button>
                </DialogClose>
            </DialogFooter>
        </form>
    )
}