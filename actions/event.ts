// actions/event.ts

"use server"

import prisma from "@/lib/prisma"
import { z } from "zod"
import { revalidatePath } from "next/cache"
import { eventSchema } from "@/schemas/event"

export async function createEvent(prevState: any, formData: FormData) {
    // Handle groupIds as array from FormData
    const groupIdsRaw = formData.getAll("groupIds") as string[]
    // Filter out empty strings and whitespace-only strings
    const groupIds = groupIdsRaw.filter(id => id && id.trim().length > 0)

    // Get current user ID from formData (should be passed from client)
    const currentUserId = formData.get("currentUserId") as string | null

    // Remove groupIds from formData entries to avoid conflicts
    const entries = Object.fromEntries(formData)
    delete entries.groupIds
    delete entries.currentUserId

    const data = {
        ...entries,
        groupIds: groupIds.length > 0 ? groupIds : undefined,
    }

    console.log("createEvent data: ", data)

    const validation = eventSchema.safeParse(data)

    console.log("validation: ", validation)

    if (!validation.success) {
        return {
            success: false,
            errors: z.treeifyError(validation.error),
            message: "Validation failed"
        }
    }

    try {
        const { groupIds, duration, ...eventData } = validation.data

        // Create event with many-to-many groups relation and audit fields
        await prisma.event.create({
            data: {
                ...eventData,
                // Create EventGroup entries for each selected group
                groups: {
                    create: groupIds.map(groupId => ({
                        groupId
                    }))
                },
                // Audit fields
                createdById: currentUserId || undefined,
                updatedById: currentUserId || undefined,
            }
        })

        revalidatePath(`/orar/${validation.data.academicYearId}`)
        return { success: true, message: "Event created successfully" }
    } catch (error) {
        console.error("Database error:", error)
        return {
            success: false,
            message: "Failed to create event"
        }
    }
}

export async function updateEvent(prevState: any, formData: FormData) {
    // Handle groupIds as array from FormData
    const groupIdsRaw = formData.getAll("groupIds") as string[]
    // Filter out empty strings and whitespace-only strings
    const groupIds = groupIdsRaw.filter(id => id && id.trim().length > 0)

    // Get current user ID from formData (should be passed from client)
    const currentUserId = formData.get("currentUserId") as string | null

    // Remove groupIds from formData entries to avoid conflicts
    const entries = Object.fromEntries(formData)
    delete entries.groupIds
    delete entries.currentUserId

    const data = {
        ...entries,
        groupIds: groupIds.length > 0 ? groupIds : undefined,
    }

    console.log("updateEvent data: ", data)

    const id = formData.get("id") as string | null;

    if (!id) {
        return {
            success: false,
            message: "Event ID is required"
        }
    }

    const validation = eventSchema.safeParse(data)

    if (!validation.success) {
        return {
            success: false,
            errors: z.treeifyError(validation.error),
            message: "Validation failed"
        }
    }

    try {
        const { groupIds, duration, ...eventData } = validation.data

        // Update event and replace all group associations
        await prisma.event.update({
            where: { id },
            data: {
                ...eventData,
                // Delete all existing EventGroup entries and create new ones
                groups: {
                    deleteMany: {}, // Remove all existing associations
                    create: groupIds.map(groupId => ({
                        groupId
                    }))
                },
                // Audit field - only update updatedBy
                updatedById: currentUserId || undefined,
            }
        })

        revalidatePath(`/orar/${validation.data.academicYearId}`)
        return { success: true, message: "Event updated successfully" }
    } catch (error) {
        console.error("Database error:", error)
        return {
            success: false,
            message: "Failed to update event"
        }
    }
}

export async function deleteEvent(prevState: any, formData: FormData) {
    const id = formData.get("id") as string
    const academicYearId = formData.get("academicYearId") as string

    if (!id) {
        return {
            success: false,
            message: "Event ID is required"
        }
    }

    try {
        // EventGroup entries will be deleted automatically due to onDelete: Cascade
        await prisma.event.delete({
            where: { id }
        })

        if (academicYearId) {
            revalidatePath(`/orar/${academicYearId}`)
        }
        return { success: true, message: "Event deleted successfully" }
    } catch (error) {
        console.error("Database error:", error)
        return {
            success: false,
            message: "Failed to delete event"
        }
    }
}

export async function moveEvent(prevState: any, formData: FormData) {
    const id = formData.get("id") as string
    const day = formData.get("day") as string
    const startHour = formData.get("startHour") as string
    const academicYearId = formData.get("academicYearId") as string

    if (!id || !day || !startHour) {
        return {
            success: false,
            message: "Missing required fields"
        }
    }

    try {
        const currentEvent = await prisma.event.findUnique({ where: { id } })
        if (!currentEvent) {
            return { success: false, message: "Event not found" }
        }

        // Calculează noul endHour păstrând durata originală
        const startNum = parseInt(currentEvent.startHour.split(':')[0], 10)
        const endNum = parseInt(currentEvent.endHour.split(':')[0], 10)
        const duration = endNum - startNum

        const newStartNum = parseInt(startHour.split(':')[0], 10)
        const newEndNum = newStartNum + duration
        const newEndHour = `${newEndNum.toString().padStart(2, '0')}:00`

        await prisma.event.update({
            where: { id },
            data: {
                day: day as any,
                startHour,
                endHour: newEndHour
            }
        })

        if (academicYearId) {
            revalidatePath(`/orar/${academicYearId}`)
        }
        return { success: true, message: "Event moved successfully" }
    } catch (error) {
        console.error("Database error:", error)
        return {
            success: false,
            message: "Failed to move event"
        }
    }
}