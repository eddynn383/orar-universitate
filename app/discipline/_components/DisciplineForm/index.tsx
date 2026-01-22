"use client"

import Image from "next/image";
import { createDiscipline, updateDiscipline } from "@/actions/discipline";
import { Button } from "@/components/Button";
import { DialogBody, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/Dialog";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/Field";
import { Input } from "@/components/Input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/Select";
import { Spinner } from "@/components/Spinner";
import { useActionState, useEffect, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/RadioGroup";
import { Label } from "@/components/Label";
import { AuditUser, LearningTypeWithStudyYears } from "@/types/global";
import { DialogFooterWithAudit } from "@/components/DialogFooterWithAudit";
import { Teacher } from "@/types/entities";

const SEMESTERS = [
    {
        name: "Semestrul 1",
        value: 1
    },
    {
        name: "Semestrul 2",
        value: 2
    }
]

type DisciplineFormProps = {
    defaultValues?: {
        id?: string;
        name?: string;
        teacherId?: string;
        learningTypeId?: string;
        studyYearId?: string;
        semester?: string;
        createdAt?: Date | string;
        updatedAt?: Date | string;
        createdBy?: string | undefined;
        updatedBy?: string | undefined;
    },
    learningTypes: LearningTypeWithStudyYears[],
    teachers: Teacher[],
    onSuccess?: () => void
}

export function DisciplineForm({ defaultValues, learningTypes, teachers, onSuccess }: DisciplineFormProps) {
    const mode = defaultValues?.id ? 'edit' : 'create'
    const action = mode === 'edit' ? updateDiscipline : createDiscipline

    const [state, formAction, pending] = useActionState(action, null)

    // Calculăm valorile inițiale o singură dată
    const initialLearningType = defaultValues?.learningTypeId || learningTypes[0]?.id || ""
    const initialStudyYear = defaultValues?.studyYearId || learningTypes.find(lt => lt.id === initialLearningType)?.studyYears[0]?.id || ""

    const [selectedLearningType, setSelectedLearningType] = useState<string>(initialLearningType)
    const [selectedTeacher, setSelectedTeacher] = useState<string>(defaultValues?.teacherId || "")
    const [selectedStudyYear, setSelectedStudyYear] = useState<string>(initialStudyYear)
    const [selectedSemester, setSelectedSemester] = useState<string>(defaultValues?.semester || "1")

    const currentStudyYears = learningTypes.find(lt => lt.id === selectedLearningType)?.studyYears || []

    // Handler pentru schimbarea tipului de educație - preselectează primul an de studiu
    const handleLearningTypeChange = (value: string) => {
        setSelectedLearningType(value)
        // Preselectează primul an de studiu pentru noul tip de educație
        const newStudyYears = learningTypes.find(lt => lt.id === value)?.studyYears || []
        setSelectedStudyYear(newStudyYears[0]?.id || "")
    }

    useEffect(() => {
        if (state?.success) {
            onSuccess?.()
        }
    }, [state, onSuccess])

    const title = mode === 'edit' ? 'Editează disciplină' : 'Adaugă disciplină'
    const description = mode === 'edit'
        ? 'Modifică informațiile disciplinei'
        : 'Adaugă o disciplină nouă folosind formularul de mai jos'
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
                            <FieldLabel htmlFor="name">Nume disciplină *</FieldLabel>
                            <Input
                                id="name"
                                name="name"
                                sizes="L"
                                type="text"
                                placeholder="Tehnologii Web"
                                defaultValue={defaultValues?.name}
                                aria-invalid={state?.errors?.name ? true : undefined}
                            />
                            <FieldError>{state?.errors?.name?.[0]}</FieldError>
                        </Field>

                        <Field data-invalid={state?.errors?.teacherId ? true : undefined}>
                            <FieldLabel htmlFor="teacherId">Cadru didactic *</FieldLabel>
                            <Select
                                name="teacherId"
                                value={selectedTeacher}
                                onValueChange={setSelectedTeacher}
                            >
                                <SelectTrigger size="L" aria-invalid={state?.errors?.teacherId ? true : undefined}>
                                    <SelectValue placeholder="Selectează cadrul didactic" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {teachers?.map((teacher) => (
                                            <SelectItem key={teacher.id} value={teacher.id}>
                                                <div className="flex items-center gap-2">
                                                    <div className="relative size-6 rounded-full overflow-hidden flex-shrink-0">
                                                        {teacher.user?.image ? (
                                                            <Image
                                                                src={teacher.user.image}
                                                                alt={`${teacher.user.firstname} ${teacher.user.lastname}`}
                                                                fill
                                                                sizes="24px"
                                                                className="object-cover"
                                                            />
                                                        ) : (
                                                            <div className="size-6 rounded-full bg-primary-200 flex items-center justify-center text-xs">
                                                                {teacher.user?.firstname.charAt(0)}{teacher.user?.lastname.charAt(0)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span>{teacher.user?.firstname} {teacher.user?.lastname}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <FieldError>{state?.errors?.teacherId?.[0]}</FieldError>
                        </Field>

                        <Field data-invalid={state?.errors?.learningTypeId ? true : undefined}>
                            <FieldLabel>Tip Educație</FieldLabel>
                            <RadioGroup
                                name="learningTypeId"
                                value={selectedLearningType}
                                onValueChange={handleLearningTypeChange}
                                className="flex gap-4"
                            >
                                {learningTypes?.map((learningType) => (
                                    <Label
                                        key={learningType.id}
                                        htmlFor={learningType.id}
                                        className={`flex-1 flex items-center gap-3 p-4 border-1 rounded-lg cursor-pointer transition-all ${selectedLearningType === learningType.id
                                            ? 'border-brand-400 bg-brand-400/10'
                                            : 'border-primary-400 hover:border-primary-500'
                                            }`}
                                        style={{ width: `${100 / learningTypes.length}%` }}
                                    >
                                        <RadioGroupItem value={learningType.id} id={learningType.id} />
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
                                    className="flex gap-4"
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
                                className="flex gap-4"
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
                    </FieldGroup>
                </FieldSet>
            </DialogBody>
            <DialogFooterWithAudit createdAt={defaultValues?.createdAt} updatedAt={defaultValues?.updatedAt} createdBy={defaultValues?.createdBy} updatedBy={defaultValues?.updatedBy} >
                <Button type="submit" variant="brand" disabled={pending}>
                    <Spinner
                        className="absolute data-[loading='false']:opacity-0 data-[loading='true']:opacity-100"
                        data-loading={pending}
                    />
                    <span data-loading={pending} className="data-[loading='false']:opacity-100 data-[loading='true']:opacity-0">
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