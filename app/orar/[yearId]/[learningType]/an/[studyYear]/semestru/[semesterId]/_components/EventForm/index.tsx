"use client"

import Image from "next/image";
import { useActionState, useEffect, useState, useMemo } from "react";
import { createEvent, updateEvent } from "@/actions/event";
import { Button } from "@/components/Button";
import { DialogBody, DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/Dialog";
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/Field";
import { Input } from "@/components/Input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/Select";
import { Spinner } from "@/components/Spinner";
import { RadioGroup, RadioGroupItem } from "@/components/RadioGroup";
import { Label } from "@/components/Label";
import { Classroom, Discipline, Group } from "@/app/generated/prisma/client";
import { Teacher } from "@/types/entities";
import { TIME_SLOTS } from "@/types/global";

const DAYS = [
    { name: "Luni", value: "LUNI" },
    { name: "Marți", value: "MARTI" },
    { name: "Miercuri", value: "MIERCURI" },
    { name: "Joi", value: "JOI" },
    { name: "Vineri", value: "VINERI" },
]

const ACTIVITY_TYPES = [
    { name: "Curs", value: "C" },
    { name: "Seminar", value: "S" },
    { name: "Laborator", value: "L" },
    { name: "Proiect", value: "P" },
]

const WEEK_TYPES = [
    { name: "Toate săptămânile", value: "toate" },
    { name: "Săptămâni pare", value: "para" },
    { name: "Săptămâni impare", value: "impara" },
]

type ActionState = {
    success: boolean
    message?: string
    errors?: {
        errors: string[]
        properties?: {
            day?: { errors: string[] }
            startHour?: { errors: string[] }
            endHour?: { errors: string[] }
            duration?: { errors: string[] }
            academicYearId?: { errors: string[] }
            semester?: { errors: string[] }
            eventType?: { errors: string[] }
            eventRecurrence?: { errors: string[] }
            learningId?: { errors: string[] }
            teacherId?: { errors: string[] }
            disciplineId?: { errors: string[] }
            classroomId?: { errors: string[] }
            groupIds?: { errors: string[] }
        }
    }
} | null

type EventFormProps = {
    defaultValues?: {
        id?: string
        day?: string
        startHour?: string
        endHour?: string
        duration?: string
        eventType?: string
        eventRecurrence?: string
        teacherId?: string
        disciplineId?: string
        classroomId?: string
        groupIds?: string[]
    }
    academicYearId: string
    semester: number
    learningTypeId: string
    studyYearId: string // Comes from URL - no need to select
    groups: Group[] // Already filtered by studyYear and semester from server
    classrooms: Classroom[]
    teachers: Teacher[]
    disciplines: Discipline[] // Already filtered by studyYear and semester from server
    onSuccess?: () => void
}

export function EventForm({
    defaultValues,
    academicYearId,
    semester,
    learningTypeId,
    // studyYearId,
    groups,
    classrooms,
    teachers,
    disciplines,
    onSuccess
}: EventFormProps) {
    const mode = defaultValues?.id ? 'edit' : 'create'
    const action = mode === 'edit' ? updateEvent : createEvent

    const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null)

    const [selectedDay, setSelectedDay] = useState<string>(defaultValues?.day || DAYS[0].value)
    const [selectedClassroom, setSelectedClassroom] = useState<string>(defaultValues?.classroomId || "")
    const [selectedTeacher, setSelectedTeacher] = useState<string>(defaultValues?.teacherId || "")
    const [selectedDiscipline, setSelectedDiscipline] = useState<string>(defaultValues?.disciplineId || "")
    const [selectedEventType, setSelectedEventType] = useState<string>(defaultValues?.eventType || ACTIVITY_TYPES[0].value)
    const [selectedEventRecurrence, setSelectedEventRecurrence] = useState<string>(defaultValues?.eventRecurrence || WEEK_TYPES[0].value)
    const [startHour, setStartHour] = useState<string>(defaultValues?.startHour || "")
    const [endHour, setEndHour] = useState<string>(defaultValues?.endHour || "")
    const [duration, setDuration] = useState<number | "">(defaultValues?.duration ? parseInt(defaultValues.duration) : "")

    // Multi-select pentru grupe - filter out empty strings
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(() => {
        if (defaultValues?.groupIds && defaultValues.groupIds.length > 0) {
            return defaultValues.groupIds.filter(id => id && id.trim() !== '')
        }
        return []
    })

    // Check if all groups are selected
    const allGroupsSelected = groups.length > 0 && selectedGroupIds.length === groups.length

    // Calculează numărul de discipline per profesor (din disciplinele deja filtrate)
    const getDisciplineCountForTeacher = (teacherId: string) => {
        return disciplines.filter(d => d.teacherId === teacherId).length
    }

    // Obține profesorii care au discipline în acest an/semestru
    const teachersWithDisciplines = useMemo(() => {
        const teacherIds = new Set(disciplines.map(d => d.teacherId))
        return teachers.filter(t => teacherIds.has(t.id))
    }, [teachers, disciplines])

    // Filtrează disciplinele pe baza profesorului selectat
    const filteredDisciplines = useMemo(() => {
        if (!selectedTeacher) return disciplines
        return disciplines.filter(discipline => discipline.teacherId === selectedTeacher)
    }, [disciplines, selectedTeacher])

    const endHourOptions = startHour
        ? TIME_SLOTS.filter(h => h > startHour)
        : TIME_SLOTS

    const startHourOptions = endHour
        ? TIME_SLOTS.filter(h => h < endHour)
        : TIME_SLOTS

    const hourToNumber = (hour: string) =>
        parseInt(hour.split(":")[0], 10)

    const numberToHour = (num: number) =>
        `${String(num).padStart(2, "0")}:00`

    const handleTeacherChange = (value: string) => {
        setSelectedTeacher(value)
        setSelectedDiscipline("")
    }

    // Toggle group selection
    const toggleGroupSelection = (groupId: string) => {
        setSelectedGroupIds(prev =>
            prev.includes(groupId)
                ? prev.filter(id => id !== groupId)
                : [...prev, groupId]
        )
    }

    // Toggle all groups
    const toggleAllGroups = () => {
        if (allGroupsSelected) {
            setSelectedGroupIds([])
        } else {
            setSelectedGroupIds(groups.map(g => g.id))
        }
    }

    useEffect(() => {
        if (startHour && endHour) {
            const diff = hourToNumber(endHour) - hourToNumber(startHour)
            setDuration(diff > 0 ? diff : "")
        }
    }, [startHour, endHour])

    useEffect(() => {
        if (startHour && endHour) {
            const start = hourToNumber(startHour)
            const end = hourToNumber(endHour)

            if (start >= end) {
                setEndHour("")
                setDuration("")
            }
        }
    }, [startHour])

    useEffect(() => {
        if (startHour && duration !== "") {
            const newEnd = hourToNumber(startHour) + duration

            if (newEnd <= 20) {
                setEndHour(numberToHour(newEnd))
            } else {
                setEndHour("")
            }
        }
    }, [duration])

    useEffect(() => {
        if (state?.success) {
            onSuccess?.()
        }
    }, [state, onSuccess])

    // Resetează disciplina dacă nu mai este validă pentru profesorul selectat
    useEffect(() => {
        if (selectedDiscipline && !filteredDisciplines.some(d => d.id === selectedDiscipline)) {
            setSelectedDiscipline("")
        }
    }, [filteredDisciplines, selectedDiscipline])

    const errorProp = state?.errors?.properties

    const title = mode === 'edit' ? 'Editează eveniment' : 'Adaugă eveniment în orar'
    const description = mode === 'edit'
        ? 'Modifică informațiile evenimentului'
        : 'Completează detaliile pentru a adăuga un nou eveniment în orar'
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
                        <input type="hidden" name="academicYearId" value={academicYearId} />
                        <input type="hidden" name="semester" value={semester} />
                        <input type="hidden" name="learningId" value={learningTypeId} />

                        {/* Hidden inputs pentru Select-uri necompletate */}
                        {!startHour && <input type="hidden" name="startHour" value="" />}
                        {!endHour && <input type="hidden" name="endHour" value="" />}
                        {!selectedTeacher && <input type="hidden" name="teacherId" value="" />}
                        {!selectedDiscipline && <input type="hidden" name="disciplineId" value="" />}
                        {!selectedClassroom && <input type="hidden" name="classroomId" value="" />}

                        {/* Hidden inputs pentru grupele selectate (many-to-many) */}
                        {selectedGroupIds.length === 0 && <input type="hidden" name="groupIds" value="" />}
                        {selectedGroupIds.map(groupId => (
                            <input key={groupId} type="hidden" name="groupIds" value={groupId} />
                        ))}

                        {/* Ziua */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Field className="flex-1" data-invalid={errorProp?.day ? true : undefined}>
                                <FieldLabel>Ziua</FieldLabel>
                                <RadioGroup
                                    name="day"
                                    value={selectedDay}
                                    onValueChange={setSelectedDay}
                                    className="flex flex-wrap gap-4"
                                >
                                    {DAYS.map((day) => (
                                        <Label
                                            key={day.value}
                                            htmlFor={`day-${day.value}`}
                                            className={`flex items-center gap-2 px-3 py-2 border-1 rounded-lg cursor-pointer transition-all ${selectedDay === day.value
                                                ? 'border-brand-400 bg-brand-400/10'
                                                : 'border-primary-400 hover:border-primary-500'
                                                }`}
                                        >
                                            <RadioGroupItem value={day.value} id={`day-${day.value}`} />
                                            <span className="text-sm mr-2">{day.name}</span>
                                        </Label>
                                    ))}
                                </RadioGroup>
                                <FieldError>{errorProp?.day?.errors?.[0]}</FieldError>
                            </Field>
                        </div>

                        {/* Ora de început, sfârșit și durată */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Field className="flex-1" data-invalid={errorProp?.startHour ? true : undefined}>
                                <FieldLabel>Ora de început</FieldLabel>
                                <Select
                                    name="startHour"
                                    value={startHour}
                                    onValueChange={setStartHour}
                                >
                                    <SelectTrigger size="L">
                                        <SelectValue placeholder="Selectează ora de început" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {startHourOptions.map(hour => (
                                                <SelectItem key={hour} value={hour}>
                                                    {hour}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <FieldError>{errorProp?.startHour?.errors?.[0]}</FieldError>
                            </Field>

                            <Field className="flex-1" data-invalid={errorProp?.endHour ? true : undefined}>
                                <FieldLabel>Ora de sfârșit</FieldLabel>
                                <Select
                                    name="endHour"
                                    value={endHour}
                                    onValueChange={setEndHour}
                                    disabled={!startHour}
                                >
                                    <SelectTrigger size="L">
                                        <SelectValue placeholder="Selectează ora de sfârșit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {endHourOptions.map(hour => (
                                                <SelectItem key={hour} value={hour}>
                                                    {hour}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <FieldError>{errorProp?.endHour?.errors?.[0]}</FieldError>
                            </Field>

                            <Field className="flex-1" data-invalid={errorProp?.duration ? true : undefined}>
                                <FieldLabel>Durata (ore)</FieldLabel>
                                <Input
                                    name="duration"
                                    type="number"
                                    min={1}
                                    max={6}
                                    value={duration}
                                    sizes="L"
                                    disabled={!startHour}
                                    onChange={(e) => {
                                        const value = Number(e.target.value)
                                        setDuration(value > 0 ? value : "")
                                    }}
                                />
                                <FieldError>{errorProp?.duration?.errors?.[0]}</FieldError>
                            </Field>
                        </div>

                        {/* Tipul de activitate */}
                        <Field data-invalid={errorProp?.eventType ? true : undefined}>
                            <FieldLabel>Tip activitate</FieldLabel>
                            <RadioGroup
                                name="eventType"
                                value={selectedEventType}
                                onValueChange={setSelectedEventType}
                                className="flex flex-wrap gap-4"
                            >
                                {ACTIVITY_TYPES.map((type) => (
                                    <Label
                                        key={type.value}
                                        htmlFor={`eventType-${type.value}`}
                                        className={`flex items-center gap-3 p-3 border-1 rounded-lg cursor-pointer transition-all ${selectedEventType === type.value
                                            ? 'border-brand-400 bg-brand-400/10'
                                            : 'border-primary-400 hover:border-primary-500'
                                            }`}
                                    >
                                        <RadioGroupItem value={type.value} id={`eventType-${type.value}`} />
                                        <span className="text-sm mr-2">{type.name}</span>
                                    </Label>
                                ))}
                            </RadioGroup>
                            <FieldError>{errorProp?.eventType?.errors?.[0]}</FieldError>
                        </Field>

                        {/* Tip săptămână */}
                        <Field data-invalid={errorProp?.eventRecurrence ? true : undefined}>
                            <FieldLabel>Frecvența</FieldLabel>
                            <RadioGroup
                                name="eventRecurrence"
                                value={selectedEventRecurrence}
                                onValueChange={setSelectedEventRecurrence}
                                className="flex flex-wrap gap-4"
                            >
                                {WEEK_TYPES.map((weekType) => (
                                    <Label
                                        key={weekType.value}
                                        htmlFor={`eventRecurrence-${weekType.value}`}
                                        className={`flex items-center gap-3 p-3 border-1 rounded-lg cursor-pointer transition-all ${selectedEventRecurrence === weekType.value
                                            ? 'border-brand-400 bg-brand-400/10'
                                            : 'border-primary-400 hover:border-primary-500'
                                            }`}
                                    >
                                        <RadioGroupItem value={weekType.value} id={`eventRecurrence-${weekType.value}`} />
                                        <span className="text-sm mr-2">{weekType.name}</span>
                                    </Label>
                                ))}
                            </RadioGroup>
                            <FieldError>{errorProp?.eventRecurrence?.errors?.[0]}</FieldError>
                        </Field>

                        {/* Cadru didactic - Doar profesorii cu discipline în acest an/semestru */}
                        <Field data-invalid={errorProp?.teacherId ? true : undefined}>
                            <FieldLabel htmlFor="teacherId">Cadru didactic</FieldLabel>
                            <Select
                                name="teacherId"
                                value={selectedTeacher}
                                onValueChange={handleTeacherChange}
                            >
                                <SelectTrigger size="L" aria-invalid={errorProp?.teacherId ? true : undefined}>
                                    <SelectValue placeholder="Selectează cadrul didactic" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {teachersWithDisciplines.length > 0 ? (
                                            teachersWithDisciplines.map((teacher) => {
                                                const disciplineCount = getDisciplineCountForTeacher(teacher.id)

                                                return (
                                                    <SelectItem key={teacher.id} value={teacher.id}>
                                                        <div className="flex items-center gap-2 w-full">
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
                                                                    <div className="size-6 rounded-full bg-primary-200 flex items-center justify-center text-s">
                                                                        {teacher.user?.firstname.charAt(0)}{teacher.user?.lastname.charAt(0)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="flex-1">
                                                                {teacher.grade} {teacher.user?.firstname} {teacher.user?.lastname}
                                                            </span>
                                                            <span className="text-s text-primary-500 ml-2">
                                                                ({disciplineCount} {disciplineCount === 1 ? 'materie' : 'materii'})
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                )
                                            })
                                        ) : (
                                            <div className="px-3 py-2 text-sm text-muted-foreground">
                                                Nu există profesori cu discipline pentru acest an/semestru
                                            </div>
                                        )}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <FieldError>{errorProp?.teacherId?.errors?.[0]}</FieldError>
                        </Field>

                        {/* Disciplina - Deja filtrate de server după studyYear și semester */}
                        <Field data-invalid={errorProp?.disciplineId ? true : undefined}>
                            <FieldLabel htmlFor="disciplineId">Disciplina</FieldLabel>
                            <Select
                                name="disciplineId"
                                value={selectedDiscipline}
                                onValueChange={setSelectedDiscipline}
                            >
                                <SelectTrigger size="L" aria-invalid={errorProp?.disciplineId ? true : undefined}>
                                    <SelectValue placeholder="Selectează disciplina" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {filteredDisciplines.length > 0 ? (
                                            filteredDisciplines.map((discipline) => (
                                                <SelectItem key={discipline.id} value={discipline.id}>
                                                    {discipline.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-sm text-muted-foreground">
                                                {selectedTeacher
                                                    ? "Profesorul selectat nu are discipline"
                                                    : "Selectează mai întâi un profesor"
                                                }
                                            </div>
                                        )}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <FieldError>{errorProp?.disciplineId?.errors?.[0]}</FieldError>
                        </Field>

                        {/* Sala */}
                        <Field data-invalid={errorProp?.classroomId ? true : undefined}>
                            <FieldLabel htmlFor="classroomId">Sala</FieldLabel>
                            <Select
                                name="classroomId"
                                value={selectedClassroom}
                                onValueChange={setSelectedClassroom}
                            >
                                <SelectTrigger size="L" aria-invalid={errorProp?.classroomId ? true : undefined}>
                                    <SelectValue placeholder="Selectează sala" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        {classrooms?.map((classroom) => (
                                            <SelectItem key={classroom.id} value={classroom.id}>
                                                {classroom.name} {classroom.building && `(${classroom.building})`}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <FieldError>{errorProp?.classroomId?.errors?.[0]}</FieldError>
                        </Field>

                        {/* Grupe - Deja filtrate de server după studyYear și semester */}
                        <Field data-invalid={errorProp?.groupIds ? true : undefined}>
                            <div className="flex items-center justify-between">
                                <FieldLabel className="flex items-center mb-0">
                                    <span>Grupe</span>
                                    {selectedGroupIds.length > 0 && (
                                        <span className="text-s font-normal text-primary-600 ml-2">
                                            ({selectedGroupIds.length} selectate)
                                        </span>
                                    )}
                                </FieldLabel>
                                {groups.length > 0 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="S"
                                        onClick={toggleAllGroups}
                                        className={`text-xs ${allGroupsSelected ? 'text-red-600 hover:text-red-700' : ''}`}
                                    >
                                        {allGroupsSelected ? 'Deselectează toate' : 'Selectează toate'}
                                    </Button>
                                )}
                            </div>

                            {/* Available groups - toate sunt din același an de studiu și semestru */}
                            {groups.length > 0 ? (
                                <div className="flex flex-wrap gap-2 p-1">
                                    {groups.map((group) => {
                                        const isSelected = selectedGroupIds.includes(group.id)
                                        return (
                                            <button
                                                key={group.id}
                                                type="button"
                                                onClick={() => toggleGroupSelection(group.id)}
                                                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-all ${isSelected
                                                    ? 'border-brand-400 bg-brand-400/10 text-brand-1400'
                                                    : 'border-primary-400 bg-primary-50 text-primary-700 hover:border-primary-300 hover:bg-primary-100'
                                                    }`}
                                            >
                                                <span>{group.name}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="px-3 py-4 text-sm text-primary-500 text-center bg-primary-50 rounded-lg">
                                    Nu există grupe disponibile pentru acest an/semestru
                                </div>
                            )}
                            <FieldError>{errorProp?.groupIds?.errors?.[0]}</FieldError>
                        </Field>
                    </FieldGroup>
                </FieldSet>
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