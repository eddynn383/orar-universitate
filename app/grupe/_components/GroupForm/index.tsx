"use client"

import { useActionState, useEffect, useState } from "react";
import { createGroup, updateGroup } from "@/actions/group";
import { Button } from "@/components/Button";
import { DialogBody, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/Dialog";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/Field";
import { Input } from "@/components/Input";
import { Spinner } from "@/components/Spinner";
import { RadioGroup, RadioGroupItem } from "@/components/RadioGroup";
import { Label } from "@/components/Label";
import { AuditUser, LearningTypeWithStudyYears } from "@/types/global";
import { DialogFooterWithAudit } from "@/components/DialogFooterWithAudit";

const DEPARTMENTS = [
    { name: "Informatica", value: "INFORMATICA" },
    { name: "Matematica", value: "MATEMATICA" }
]

const SEMESTERS = [
    { name: "Semestrul 1", value: 1 },
    { name: "Semestrul 2", value: 2 }
]

type GroupFormProps = {
    defaultValues?: {
        id?: string
        name?: string
        department?: string
        learningTypeId?: string
        studyYearId?: string
        semester?: string
        group?: number
        createdAt?: Date | string
        updatedAt?: Date | string
        createdBy?: AuditUser
        updatedBy?: AuditUser
    }
    learningTypes: LearningTypeWithStudyYears[]
    onSuccess?: () => void
}

export function GroupForm({ defaultValues, learningTypes, onSuccess }: GroupFormProps) {
    const mode = defaultValues?.id ? 'edit' : 'create'
    const action = mode === 'edit' ? updateGroup : createGroup

    const [state, formAction, pending] = useActionState(action, null)

    // Calculăm valorile inițiale o singură dată
    const initialLearningType = defaultValues?.learningTypeId || learningTypes[0]?.id || ""
    const initialStudyYear = defaultValues?.studyYearId || learningTypes.find(lt => lt.id === initialLearningType)?.studyYears[0]?.id || ""

    const [selectedDepartment, setSelectedDepartment] = useState<string>(defaultValues?.department || DEPARTMENTS[0].value)
    const [selectedLearningType, setSelectedLearningType] = useState<string>(initialLearningType)
    const [selectedStudyYear, setSelectedStudyYear] = useState<string>(initialStudyYear)
    const [selectedSemester, setSelectedSemester] = useState<string>(defaultValues?.semester || "1")

    // Obține anii de studiu pentru tipul de educație selectat
    const currentStudyYears = learningTypes.find(lt => lt.id === selectedLearningType)?.studyYears || []

    // Handler pentru schimbarea tipului de educație - preselectează primul an de studiu
    const handleLearningTypeChange = (value: string) => {
        setSelectedLearningType(value)
        const newStudyYears = learningTypes.find(lt => lt.id === value)?.studyYears || []
        setSelectedStudyYear(newStudyYears[0]?.id || "")
    }

    useEffect(() => {
        if (state?.success) {
            onSuccess?.()
        }
    }, [state, onSuccess])

    const title = mode === 'edit' ? 'Editează grupă' : 'Creează grupă'
    const description = mode === 'edit'
        ? 'Modifică informațiile grupei'
        : 'Adaugă o grupă nouă folosind formularul de mai jos'
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
                            <FieldLabel htmlFor="name">Nume grupă</FieldLabel>
                            <Input
                                id="name"
                                name="name"
                                sizes="L"
                                type="text"
                                placeholder="INF 12"
                                defaultValue={defaultValues?.name}
                                aria-invalid={state?.errors?.name ? true : undefined}
                            />
                            <FieldError>{state?.errors?.name?.[0]}</FieldError>
                        </Field>

                        <Field data-invalid={state?.errors?.learningTypeId ? true : undefined}>
                            <FieldLabel>Tip Educație</FieldLabel>
                            <RadioGroup
                                name="learningTypeId"
                                value={selectedLearningType}
                                onValueChange={handleLearningTypeChange}
                                className="flex gap-3"
                            >
                                {learningTypes?.map((learningType) => (
                                    <Label
                                        key={learningType.id}
                                        htmlFor={`learning-type-${learningType.id}`}
                                        className={`flex-1 flex items-center gap-3 p-4 border-1 rounded-lg cursor-pointer transition-all ${selectedLearningType === learningType.id
                                            ? 'border-brand-400 bg-brand-400/10'
                                            : 'border-primary-400 hover:border-primary-500'
                                            }`}
                                        style={{ width: `${100 / learningTypes.length}%` }}
                                    >
                                        <RadioGroupItem value={learningType.id} id={`learning-type-${learningType.id}`} />
                                        <span>{learningType.learningCycle}</span>
                                    </Label>
                                ))}
                            </RadioGroup>
                            <FieldError>{state?.errors?.learningTypeId?.[0]}</FieldError>
                        </Field>
                        <Field data-invalid={state?.errors?.studyYearId ? true : undefined}>
                            <FieldLabel>An de studiu</FieldLabel>
                            {currentStudyYears.length > 0 ? (
                                <RadioGroup
                                    name="studyYearId"
                                    value={selectedStudyYear}
                                    onValueChange={setSelectedStudyYear}
                                    className="flex gap-3"
                                >
                                    {currentStudyYears.map((studyYear) => (
                                        <Label
                                            key={studyYear.id}
                                            htmlFor={`study-year-${studyYear.id}`}
                                            className={`flex-1 flex items-center gap-3 p-4 border-1 rounded-lg cursor-pointer transition-all ${selectedStudyYear === studyYear.id
                                                ? 'border-brand-400 bg-brand-400/10'
                                                : 'border-primary-400 hover:border-primary-500'
                                                }`}
                                            style={{ width: `${100 / currentStudyYears.length}%` }}
                                        >
                                            <RadioGroupItem value={studyYear.id} id={`study-year-${studyYear.id}`} />
                                            <span>Anul {studyYear.year}</span>
                                        </Label>
                                    ))}
                                </RadioGroup>
                            ) : selectedLearningType ? (
                                <p className="text-sm text-primary-600">Nu există ani de studiu disponibili</p>
                            ) : (
                                <p className="text-sm text-primary-600">Selectează mai întâi tipul de educație</p>
                            )}
                            <FieldError>{state?.errors?.studyYearId?.[0]}</FieldError>
                        </Field>
                        <Field data-invalid={state?.errors?.semester ? true : undefined}>
                            <FieldLabel>Semestru</FieldLabel>
                            <RadioGroup
                                name="semester"
                                value={selectedSemester}
                                onValueChange={setSelectedSemester}
                                className="flex gap-3"
                            >
                                {SEMESTERS.map((semester) => (
                                    <Label
                                        key={semester.value}
                                        htmlFor={`semester-${semester.value}`}
                                        className={`flex-1 flex items-center gap-3 p-4 border-1 rounded-lg cursor-pointer transition-all ${selectedSemester === `${semester.value}`
                                            ? 'border-brand-400 bg-brand-400/10'
                                            : 'border-primary-400 hover:border-primary-500'
                                            }`}
                                        style={{ width: `${100 / SEMESTERS.length}%` }}
                                    >
                                        <RadioGroupItem value={`${semester.value}`} id={`semester-${semester.value}`} />
                                        <span>{semester.name}</span>
                                    </Label>
                                ))}
                            </RadioGroup>
                            <FieldError>{state?.errors?.semester?.[0]}</FieldError>
                        </Field>
                        <Field data-invalid={state?.errors?.group ? true : undefined}>
                            <FieldLabel htmlFor="group">Grupa</FieldLabel>
                            <Input
                                id="group"
                                name="group"
                                sizes="L"
                                type="number"
                                min={1}
                                placeholder="1"
                                defaultValue={defaultValues?.group}
                                aria-invalid={state?.errors?.group ? true : undefined}
                            />
                            <FieldError>{state?.errors?.group?.[0]}</FieldError>
                        </Field>
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