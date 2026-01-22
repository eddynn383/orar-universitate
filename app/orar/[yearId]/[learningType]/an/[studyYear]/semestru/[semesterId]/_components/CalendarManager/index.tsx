"use client"

import { useState, useEffect, useMemo } from "react"
import { Calendar } from "../Calendar"
import { CreateEventModal } from "../CreateEventModal"
import { DeleteEventDialog } from "../DeleteEventDialog"
import { CalendarFilters } from "../CalendarFilters"
import { CalendarEntry } from "@/types/global"
import { Classroom, Discipline, Group } from "@/app/generated/prisma/client"
import { moveEvent, deleteEvent } from "@/actions/event"
import { Teacher } from "@/types/entities"

type CalendarManagerProps = {
    initialEntries: CalendarEntry[]
    yearId: string
    semester: number
    learningTypeId: string
    studyYearId: string
    groups: Group[]
    classrooms: Classroom[]
    teachers: Teacher[]
    disciplines: Discipline[]
    academicYear?: string
    learningCycle?: string
    studyYear?: number
}

export function CalendarManager({
    initialEntries,
    yearId,
    semester,
    learningTypeId,
    studyYearId, // NEW: Destructure studyYearId
    groups,
    classrooms,
    teachers,
    disciplines,
    academicYear,
    learningCycle,
    studyYear,
}: CalendarManagerProps) {
    const [entries, setEntries] = useState<CalendarEntry[]>(initialEntries)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<{
        day: string
        startHour: string
        endHour: string
        duration: number
    } | null>(null)
    const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null)
    const [entryToDelete, setEntryToDelete] = useState<CalendarEntry | null>(null)

    // Filter states
    const [selectedTypes, setSelectedTypes] = useState<string[]>(['C', 'S', 'L', 'P']) // All types selected by default
    const [selectedFilterGroupIds, setSelectedFilterGroupIds] = useState<string[]>([]) // Empty = show all

    // Actualizează entries când se schimbă initialEntries (după revalidatePath)
    useEffect(() => {
        setEntries(initialEntries)
    }, [initialEntries])

    // Filter entries based on selected types and groups
    const filteredEntries = useMemo(() => {
        return entries.filter(entry => {
            // Filter by type
            const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(entry.type)

            // Filter by group - if no groups selected, show all
            // If groups selected, show entries that have at least one matching group
            const groupMatch = selectedFilterGroupIds.length === 0 ||
                entry.groupIds?.some(gId => selectedFilterGroupIds.includes(gId)) ||
                entry.groups?.some(gName => {
                    const group = groups.find(g => g.name === gName)
                    return group && selectedFilterGroupIds.includes(group.id)
                })

            return typeMatch && groupMatch
        })
    }, [entries, selectedTypes, selectedFilterGroupIds, groups])

    // Handler pentru selectarea unui slot din calendar (creare eveniment nou)
    const handleSlotSelect = (day: string, startHour: string, endHour: string, duration: number) => {
        setSelectedSlot({ day, startHour, endHour, duration })
        setSelectedEntry(null)
        setIsEditModalOpen(true)
    }

    // Handler pentru editarea unui eveniment (din popover)
    const handleEntryEdit = (entry: CalendarEntry) => {
        setSelectedEntry(entry)
        setSelectedSlot({
            day: entry.day,
            startHour: entry.startHour,
            endHour: entry.endHour,
            duration: entry.duration,
        })
        setIsEditModalOpen(true)
    }

    // Handler pentru deschiderea dialogului de ștergere
    const handleEntryDeleteRequest = (entry: CalendarEntry) => {
        setEntryToDelete(entry)
        setIsDeleteDialogOpen(true)
    }

    // Handler pentru confirmarea ștergerii
    const handleDeleteConfirm = async () => {
        if (!entryToDelete) return

        setIsDeleting(true)

        // Optimistic update
        setEntries(prev => prev.filter(e => e.id !== entryToDelete.id))

        // Server action
        const formData = new FormData()
        formData.append("id", entryToDelete.id)
        formData.append("academicYearId", yearId)

        const result = await deleteEvent(null, formData)

        setIsDeleting(false)

        if (result.success) {
            setIsDeleteDialogOpen(false)
            setEntryToDelete(null)
        } else {
            // Revert pe eroare
            setEntries(initialEntries)
            console.error("Failed to delete event:", result.message)
            alert("Eroare la ștergerea evenimentului: " + result.message)
        }
    }

    // Handler pentru mutarea unui eveniment (drag & drop)
    const handleEntryMove = async (entryId: string, newDay: string, newStartHour: string) => {
        const entry = entries.find(e => e.id === entryId)
        if (!entry) return

        const duration = entry.duration
        const newEndHourNum = parseInt(newStartHour.split(':')[0], 10) + duration
        const newEndHour = `${newEndHourNum.toString().padStart(2, '0')}:00`

        // Optimistic update
        setEntries(prev => prev.map(e =>
            e.id === entryId
                ? { ...e, day: newDay as any, startHour: newStartHour as any, endHour: newEndHour as any }
                : e
        ))

        // Server action
        const formData = new FormData()
        formData.append('id', entryId)
        formData.append('day', newDay)
        formData.append('startHour', newStartHour)
        formData.append('academicYearId', yearId)

        const result = await moveEvent(null, formData)

        if (!result.success) {
            // Revert pe eroare
            setEntries(initialEntries)
            console.error('Failed to move event:', result.message)
        }
    }

    // Handler pentru închiderea modalului
    const handleModalClose = () => {
        setIsEditModalOpen(false)
        setSelectedSlot(null)
        setSelectedEntry(null)
    }

    // Handler pentru succes la creare/editare
    const handleSuccess = () => {
        handleModalClose()
    }

    // Construiește defaultValues pentru EventForm
    const getEditFormDefaultValues = () => {
        if (selectedEntry) {
            return {
                id: selectedEntry.id,
                day: selectedEntry.day,
                startHour: selectedEntry.startHour,
                endHour: selectedEntry.endHour,
                duration: selectedEntry.duration.toString(),
                eventType: selectedEntry.type,
                eventRecurrence: selectedEntry.weekType,
                teacherId: selectedEntry.teacherId,
                disciplineId: selectedEntry.disciplineId,
                classroomId: selectedEntry.classroomId,
                groupIds: selectedEntry.groupIds || [],
                createdBy: selectedEntry.createdBy,
                createdAt: selectedEntry.createdAt,
                updatedBy: selectedEntry.updatedBy,
                updatedAt: selectedEntry.updatedAt,
            }
        }

        if (selectedSlot) {
            return {
                day: selectedSlot.day,
                startHour: selectedSlot.startHour,
                endHour: selectedSlot.endHour,
                duration: selectedSlot.duration.toString(),
            }
        }

        return undefined
    }

    return (
        <>
            {/* Filters */}
            <CalendarFilters
                groups={groups}
                selectedTypes={selectedTypes}
                selectedGroupIds={selectedFilterGroupIds}
                onTypesChange={setSelectedTypes}
                onGroupsChange={setSelectedFilterGroupIds}
                academicYear={academicYear}
                learningCycle={learningCycle}
                semester={semester}
                studyYear={studyYear}
            />

            {/* Calendar */}
            <Calendar
                entries={filteredEntries}
                onSlotSelect={handleSlotSelect}
                onEntryMove={handleEntryMove}
                onEntryEdit={handleEntryEdit}
                onEntryDelete={handleEntryDeleteRequest}
            />

            <CreateEventModal
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                defaultValues={getEditFormDefaultValues()}
                academicYearId={yearId}
                semester={semester}
                learningTypeId={learningTypeId}
                studyYearId={studyYearId} // NEW: Pass studyYearId
                groups={groups}
                classrooms={classrooms}
                teachers={teachers}
                disciplines={disciplines}
                onSuccess={handleSuccess}
            />

            <DeleteEventDialog
                open={isDeleteDialogOpen}
                onOpenChange={(open) => {
                    setIsDeleteDialogOpen(open)
                    if (!open) setEntryToDelete(null)
                }}
                eventName={entryToDelete?.subject || ""}
                onConfirm={handleDeleteConfirm}
                isDeleting={isDeleting}
            />
        </>
    )
}