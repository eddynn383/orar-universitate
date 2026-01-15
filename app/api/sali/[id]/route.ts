// app/api/sali/[id]/route.ts

import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
    successResponse,
    errorResponse,
    requireAuth,
    requireAdmin,
    API_ERRORS
} from "@/lib/api-utils"
import { classroomSchema } from "@/schemas/classroom"
import { z } from "zod"

type RouteParams = {
    params: Promise<{ id: string }>
}

/**
 * GET /api/sali/{id}
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params

        const classroom = await prisma.classroom.findUnique({
            where: { id },
            include: {
                _count: { select: { events: true } }
            }
        })

        if (!classroom) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        const transformed = {
            id: classroom.id,
            nume: classroom.name,
            cladire: classroom.building,
            capacitate: classroom.capacity,
            numarEvenimente: classroom._count.events,
            createdAt: classroom.createdAt,
            updatedAt: classroom.updatedAt
        }

        return successResponse(transformed)

    } catch (error) {
        console.error("API Error:", error)
        return errorResponse(
            API_ERRORS.INTERNAL_ERROR.message,
            API_ERRORS.INTERNAL_ERROR.status,
            API_ERRORS.INTERNAL_ERROR.code
        )
    }
}

/**
 * PUT /api/sali/{id}
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAdmin()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params
        const body = await request.json()

        const existing = await prisma.classroom.findUnique({ where: { id } })
        if (!existing) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        const mappedData = {
            name: body.nume ?? existing.name,
            building: body.cladire ?? existing.building,
            capacity: (body.capacitate ?? existing.capacity)?.toString()
        }

        const validation = classroomSchema.safeParse(mappedData)

        if (!validation.success) {
            return errorResponse(
                "Eroare de validare: " + JSON.stringify(z.flattenError(validation.error).fieldErrors),
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Verifică dacă noul nume este folosit de altă sală
        if (body.nume && body.nume !== existing.name) {
            const nameExists = await prisma.classroom.findFirst({
                where: { name: body.nume, id: { not: id } }
            })
            if (nameExists) {
                return errorResponse(
                    "Există deja o sală cu acest nume",
                    API_ERRORS.CONFLICT.status,
                    API_ERRORS.CONFLICT.code
                )
            }
        }

        await prisma.classroom.update({
            where: { id },
            data: {
                ...validation.data,
                updatedById: authResult.user.id
            }
        })

        return successResponse({
            id,
            message: "Sală actualizată cu succes"
        })

    } catch (error) {
        console.error("API Error:", error)
        return errorResponse(
            API_ERRORS.INTERNAL_ERROR.message,
            API_ERRORS.INTERNAL_ERROR.status,
            API_ERRORS.INTERNAL_ERROR.code
        )
    }
}

/**
 * DELETE /api/sali/{id}
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAdmin()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params

        const existing = await prisma.classroom.findUnique({
            where: { id },
            include: { _count: { select: { events: true } } }
        })

        if (!existing) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        if (existing._count.events > 0) {
            return errorResponse(
                `Nu se poate șterge sala. Are ${existing._count.events} evenimente asociate.`,
                API_ERRORS.CONFLICT.status,
                API_ERRORS.CONFLICT.code
            )
        }

        await prisma.classroom.delete({ where: { id } })

        return successResponse({
            id,
            message: "Sală ștearsă cu succes"
        })

    } catch (error) {
        console.error("API Error:", error)
        return errorResponse(
            API_ERRORS.INTERNAL_ERROR.message,
            API_ERRORS.INTERNAL_ERROR.status,
            API_ERRORS.INTERNAL_ERROR.code
        )
    }
}