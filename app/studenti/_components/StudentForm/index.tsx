"use client"

import { createStudent, updateStudent } from "@/actions/student"
import { Button } from "@/components/Button"
import { DialogBody, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/Dialog"
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/Field"
import { Input } from "@/components/Input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/Select"
import { Spinner } from "@/components/Spinner"
import { ImageUpload } from "@/components/ImageUpload"
import { useActionState, useEffect, useState } from "react"
import { P } from "@/components/Typography"
import { AuditUser } from "@/types/global"
import { DialogFooterWithAudit } from "@/components/DialogFooterWithAudit"
import { Checkbox } from "@/components/Checkbox"
import { Eye, EyeOff } from "lucide-react"
import { censorCNP } from "@/lib/encryption"

const SEX_OPTIONS = [
    { name: "Masculin", value: "MASCULIN" },
    { name: "Feminin", value: "FEMININ" },
]

const DISABILITY_OPTIONS = [
    { name: "Fără dizabilitate", value: "NONE" },
    { name: "Grad 1", value: "GRAD_1" },
    { name: "Grad 2", value: "GRAD_2" },
]

type ActionState = {
    success: boolean
    message?: string
    errors?: {
        firstname?: string[]
        lastname?: string[]
        email?: string[]
        sex?: string[]
        cnp?: string[]
        birthDate?: string[]
        birthPlace?: string[]
        ethnicity?: string[]
        religion?: string[]
        citizenship?: string[]
        maritalStatus?: string[]
        socialSituation?: string[]
        isOrphan?: string[]
        needsSpecialConditions?: string[]
        parentsNames?: string[]
        residentialAddress?: string[]
        specialMedicalCondition?: string[]
        disability?: string[]
        groupId?: string[]
        image?: string[]
    }
} | null

type StudentFormProps = {
    defaultValues?: {
        id?: string
        firstname?: string
        lastname?: string
        email?: string
        sex?: string
        cnp?: string
        birthDate?: Date | string
        birthPlace?: string
        ethnicity?: string
        religion?: string
        citizenship?: string
        maritalStatus?: string
        socialSituation?: string
        isOrphan?: boolean
        needsSpecialConditions?: boolean
        parentsNames?: string
        residentialAddress?: string
        specialMedicalCondition?: string
        disability?: string
        groupId?: string
        image?: string | null
        createdAt?: Date | string
        updatedAt?: Date | string
        createdBy?: AuditUser
        updatedBy?: AuditUser
    }
    groups?: Array<{ id: string; name: string }>
    onSuccess?: () => void
}

export function StudentForm({ defaultValues, groups = [], onSuccess }: StudentFormProps) {
    const mode = defaultValues?.id ? "edit" : "create"
    const action = mode === "edit" ? updateStudent : createStudent

    const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null)

    // State pentru Select-uri și imagine
    const [selectedSex, setSelectedSex] = useState<string>(defaultValues?.sex || SEX_OPTIONS[0].value)
    const [selectedDisability, setSelectedDisability] = useState<string>(
        defaultValues?.disability || DISABILITY_OPTIONS[0].value
    )
    const [selectedGroup, setSelectedGroup] = useState<string>(defaultValues?.groupId || "")
    const [imageValue, setImageValue] = useState<string | null>(defaultValues?.image || null)

    // State pentru checkboxes
    const [isOrphan, setIsOrphan] = useState<boolean>(defaultValues?.isOrphan || false)
    const [needsSpecialConditions, setNeedsSpecialConditions] = useState<boolean>(
        defaultValues?.needsSpecialConditions || false
    )

    // State pentru CNP visibility
    const [showCNP, setShowCNP] = useState<boolean>(false)
    const [cnpValue, setCnpValue] = useState<string>(defaultValues?.cnp || "")

    useEffect(() => {
        if (state?.success) {
            onSuccess?.()
        }
    }, [state, onSuccess])

    const title = mode === "edit" ? "Editează student" : "Crează student"
    const description =
        mode === "edit"
            ? "Modifică informațiile studentului"
            : "Creează un student nou folosind formularul de mai jos"
    const submitText = mode === "edit" ? "Actualizează" : "Creează"

    // Format date pentru input
    const formattedBirthDate = defaultValues?.birthDate
        ? new Date(defaultValues.birthDate).toISOString().split("T")[0]
        : ""

    return (
        <form className="flex flex-col h-full overflow-hidden" action={formAction}>
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <DialogBody>
                <FieldSet>
                    <FieldGroup>
                        {mode === "edit" && defaultValues?.id && (
                            <input type="hidden" name="id" value={defaultValues.id} />
                        )}

                        {/* Fotografie */}
                        <div className="flex flex-1 gap-4">
                            <Field data-invalid={state?.errors?.image ? true : undefined}>
                                <FieldLabel>Fotografie</FieldLabel>
                                <ImageUpload
                                    className="w-full"
                                    endpoint="userImage"
                                    name="image"
                                    value={imageValue}
                                    onChange={setImageValue}
                                    disabled={pending}
                                />
                                <FieldError>{state?.errors?.image?.[0]}</FieldError>
                            </Field>
                        </div>

                        {/* Date de bază */}
                        <div className="flex flex-1 gap-4">
                            <Field data-invalid={state?.errors?.firstname ? true : undefined} className="flex-1">
                                <FieldLabel htmlFor="firstname">Prenume *</FieldLabel>
                                <Input
                                    id="firstname"
                                    name="firstname"
                                    type="text"
                                    defaultValue={defaultValues?.firstname}
                                    aria-invalid={state?.errors?.firstname ? true : undefined}
                                    disabled={pending}
                                />
                                <FieldError>{state?.errors?.firstname?.[0]}</FieldError>
                            </Field>

                            <Field data-invalid={state?.errors?.lastname ? true : undefined} className="flex-1">
                                <FieldLabel htmlFor="lastname">Nume *</FieldLabel>
                                <Input
                                    id="lastname"
                                    name="lastname"
                                    type="text"
                                    defaultValue={defaultValues?.lastname}
                                    aria-invalid={state?.errors?.lastname ? true : undefined}
                                    disabled={pending}
                                />
                                <FieldError>{state?.errors?.lastname?.[0]}</FieldError>
                            </Field>
                        </div>

                        <div className="flex flex-1 gap-4">
                            <Field data-invalid={state?.errors?.email ? true : undefined} className="flex-1">
                                <FieldLabel htmlFor="email">Email *</FieldLabel>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    defaultValue={defaultValues?.email}
                                    aria-invalid={state?.errors?.email ? true : undefined}
                                    disabled={pending}
                                />
                                <FieldError>{state?.errors?.email?.[0]}</FieldError>
                            </Field>

                            <Field data-invalid={state?.errors?.sex ? true : undefined} className="flex-1">
                                <FieldLabel htmlFor="sex">Sex *</FieldLabel>
                                <Select name="sex" value={selectedSex} onValueChange={setSelectedSex}>
                                    <SelectTrigger size="L" aria-invalid={state?.errors?.sex ? true : undefined}>
                                        <SelectValue placeholder="Selectează opțiune" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {SEX_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <FieldError>{state?.errors?.sex?.[0]}</FieldError>
                            </Field>
                        </div>

                        {/* CNP cu cenzurare */}
                        <div className="flex flex-1 gap-4">
                            <Field data-invalid={state?.errors?.cnp ? true : undefined} className="flex-1">
                                <FieldLabel htmlFor="cnp">CNP *</FieldLabel>
                                <div className="relative">
                                    <Input
                                        id="cnp"
                                        name="cnp"
                                        type={showCNP ? "text" : "password"}
                                        value={cnpValue}
                                        onChange={(e) => setCnpValue(e.target.value)}
                                        aria-invalid={state?.errors?.cnp ? true : undefined}
                                        disabled={pending}
                                        maxLength={13}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCNP(!showCNP)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-500 hover:text-primary-700"
                                    >
                                        {showCNP ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                                <FieldError>{state?.errors?.cnp?.[0]}</FieldError>
                            </Field>

                            <Field data-invalid={state?.errors?.birthDate ? true : undefined} className="flex-1">
                                <FieldLabel htmlFor="birthDate">Data nașterii *</FieldLabel>
                                <Input
                                    id="birthDate"
                                    name="birthDate"
                                    type="date"
                                    defaultValue={formattedBirthDate}
                                    aria-invalid={state?.errors?.birthDate ? true : undefined}
                                    disabled={pending}
                                />
                                <FieldError>{state?.errors?.birthDate?.[0]}</FieldError>
                            </Field>
                        </div>

                        <Field data-invalid={state?.errors?.birthPlace ? true : undefined}>
                            <FieldLabel htmlFor="birthPlace">Locul nașterii *</FieldLabel>
                            <Input
                                id="birthPlace"
                                name="birthPlace"
                                type="text"
                                defaultValue={defaultValues?.birthPlace}
                                aria-invalid={state?.errors?.birthPlace ? true : undefined}
                                disabled={pending}
                            />
                            <FieldError>{state?.errors?.birthPlace?.[0]}</FieldError>
                        </Field>

                        {/* Informații identitate */}
                        <div className="flex flex-1 gap-4">
                            <Field data-invalid={state?.errors?.ethnicity ? true : undefined} className="flex-1">
                                <FieldLabel htmlFor="ethnicity">Etnie</FieldLabel>
                                <Input
                                    id="ethnicity"
                                    name="ethnicity"
                                    type="text"
                                    defaultValue={defaultValues?.ethnicity}
                                    aria-invalid={state?.errors?.ethnicity ? true : undefined}
                                    disabled={pending}
                                />
                                <FieldError>{state?.errors?.ethnicity?.[0]}</FieldError>
                            </Field>

                            <Field data-invalid={state?.errors?.religion ? true : undefined} className="flex-1">
                                <FieldLabel htmlFor="religion">Religie</FieldLabel>
                                <Input
                                    id="religion"
                                    name="religion"
                                    type="text"
                                    defaultValue={defaultValues?.religion}
                                    aria-invalid={state?.errors?.religion ? true : undefined}
                                    disabled={pending}
                                />
                                <FieldError>{state?.errors?.religion?.[0]}</FieldError>
                            </Field>
                        </div>

                        <div className="flex flex-1 gap-4">
                            <Field data-invalid={state?.errors?.citizenship ? true : undefined} className="flex-1">
                                <FieldLabel htmlFor="citizenship">Cetățenie</FieldLabel>
                                <Input
                                    id="citizenship"
                                    name="citizenship"
                                    type="text"
                                    defaultValue={defaultValues?.citizenship || "Română"}
                                    aria-invalid={state?.errors?.citizenship ? true : undefined}
                                    disabled={pending}
                                />
                                <FieldError>{state?.errors?.citizenship?.[0]}</FieldError>
                            </Field>

                            <Field data-invalid={state?.errors?.maritalStatus ? true : undefined} className="flex-1">
                                <FieldLabel htmlFor="maritalStatus">Stare civilă</FieldLabel>
                                <Input
                                    id="maritalStatus"
                                    name="maritalStatus"
                                    type="text"
                                    defaultValue={defaultValues?.maritalStatus || "Necăsătorit/ă"}
                                    aria-invalid={state?.errors?.maritalStatus ? true : undefined}
                                    disabled={pending}
                                />
                                <FieldError>{state?.errors?.maritalStatus?.[0]}</FieldError>
                            </Field>
                        </div>

                        {/* Situație socială */}
                        <Field data-invalid={state?.errors?.socialSituation ? true : undefined}>
                            <FieldLabel htmlFor="socialSituation">Situație socială</FieldLabel>
                            <Input
                                id="socialSituation"
                                name="socialSituation"
                                type="text"
                                defaultValue={defaultValues?.socialSituation}
                                aria-invalid={state?.errors?.socialSituation ? true : undefined}
                                disabled={pending}
                            />
                            <FieldError>{state?.errors?.socialSituation?.[0]}</FieldError>
                        </Field>

                        <div className="flex flex-col gap-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                    name="isOrphan"
                                    checked={isOrphan}
                                    onCheckedChange={(checked) => setIsOrphan(checked === true)}
                                    disabled={pending}
                                />
                                <span className="text-sm">Status de orfan</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                    name="needsSpecialConditions"
                                    checked={needsSpecialConditions}
                                    onCheckedChange={(checked) => setNeedsSpecialConditions(checked === true)}
                                    disabled={pending}
                                />
                                <span className="text-sm">Necesită condiții speciale de educație</span>
                            </label>
                        </div>

                        {/* Familie și adresă */}
                        <Field data-invalid={state?.errors?.parentsNames ? true : undefined}>
                            <FieldLabel htmlFor="parentsNames">Numele părinților</FieldLabel>
                            <Input
                                id="parentsNames"
                                name="parentsNames"
                                type="text"
                                defaultValue={defaultValues?.parentsNames}
                                aria-invalid={state?.errors?.parentsNames ? true : undefined}
                                disabled={pending}
                            />
                            <FieldError>{state?.errors?.parentsNames?.[0]}</FieldError>
                        </Field>

                        <Field data-invalid={state?.errors?.residentialAddress ? true : undefined}>
                            <FieldLabel htmlFor="residentialAddress">Adresa de rezidență</FieldLabel>
                            <Input
                                id="residentialAddress"
                                name="residentialAddress"
                                type="text"
                                defaultValue={defaultValues?.residentialAddress}
                                aria-invalid={state?.errors?.residentialAddress ? true : undefined}
                                disabled={pending}
                            />
                            <FieldError>{state?.errors?.residentialAddress?.[0]}</FieldError>
                        </Field>

                        {/* Informații medicale */}
                        <Field data-invalid={state?.errors?.specialMedicalCondition ? true : undefined}>
                            <FieldLabel htmlFor="specialMedicalCondition">Stare medicală specială</FieldLabel>
                            <Input
                                id="specialMedicalCondition"
                                name="specialMedicalCondition"
                                type="text"
                                defaultValue={defaultValues?.specialMedicalCondition}
                                aria-invalid={state?.errors?.specialMedicalCondition ? true : undefined}
                                disabled={pending}
                            />
                            <FieldError>{state?.errors?.specialMedicalCondition?.[0]}</FieldError>
                        </Field>

                        <Field data-invalid={state?.errors?.disability ? true : undefined}>
                            <FieldLabel htmlFor="disability">Dizabilitate</FieldLabel>
                            <Select name="disability" value={selectedDisability} onValueChange={setSelectedDisability}>
                                <SelectTrigger size="L" aria-invalid={state?.errors?.disability ? true : undefined}>
                                    <SelectValue placeholder="Selectează opțiune" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {DISABILITY_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <FieldError>{state?.errors?.disability?.[0]}</FieldError>
                        </Field>

                        {/* Grupă */}
                        {groups.length > 0 && (
                            <Field data-invalid={state?.errors?.groupId ? true : undefined}>
                                <FieldLabel htmlFor="groupId">Grupă (opțional)</FieldLabel>
                                <Select name="groupId" value={selectedGroup} onValueChange={setSelectedGroup}>
                                    <SelectTrigger size="L" aria-invalid={state?.errors?.groupId ? true : undefined}>
                                        <SelectValue placeholder="Selectează grupa" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="">Fără grupă</SelectItem>
                                            {groups.map((group) => (
                                                <SelectItem key={group.id} value={group.id}>
                                                    {group.name}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <FieldError>{state?.errors?.groupId?.[0]}</FieldError>
                            </Field>
                        )}
                    </FieldGroup>
                </FieldSet>
            </DialogBody>
            <DialogFooterWithAudit
                createdAt={defaultValues?.createdAt}
                updatedAt={defaultValues?.updatedAt}
                createdBy={defaultValues?.createdBy}
                updatedBy={defaultValues?.updatedBy}
            >
                <Button variant="brand" type="submit" disabled={pending}>
                    {pending && <Spinner className="text-primary-foreground" />}
                    {submitText}
                </Button>
                <DialogClose asChild disabled={pending}>
                    <Button variant="outline">Anulează</Button>
                </DialogClose>
            </DialogFooterWithAudit>
        </form>
    )
}
