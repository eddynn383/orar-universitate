// app/api/ani-universitari/[id]/route.ts

import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
    successResponse,
    errorResponse,
    requireAuth,
    requireAdmin,
    API_ERRORS
} from "@/lib/api-utils"
import { yearSchema } from "@/schemas/year"
import { z } from "zod"

type RouteParams = {
    params: Promise<{ id: string }>
}

/**
 * GET /api/ani-universitari/{id}
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params

        const academicYear = await prisma.academicYear.findUnique({
            where: { id },
            include: {
                events: {
                    select: {
                        id: true,
                        day: true,
                        startHour: true,
                        endHour: true,
                        semester: true,
                        eventType: true
                    },
                    take: 10,
                    orderBy: { createdAt: 'desc' }
                },
                _count: {
                    select: { events: true }
                }
            }
        })

        if (!academicYear) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        const transformed = {
            id: academicYear.id,
            anInceput: academicYear.start,
            anSfarsit: academicYear.end,
            perioada: `${academicYear.start}-${academicYear.end}`,
            publicat: academicYear.published,
            numarEvenimente: academicYear._count.events,
            evenimenteRecente: academicYear.events.map(e => ({
                id: e.id,
                zi: e.day,
                oraInceput: e.startHour,
                oraSfarsit: e.endHour,
                semestru: e.semester,
                tipActivitate: e.eventType
            })),
            createdAt: academicYear.createdAt,
            updatedAt: academicYear.updatedAt
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
 * PUT /api/ani-universitari/{id}
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAdmin()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params
        const body = await request.json()

        const existing = await prisma.academicYear.findUnique({ where: { id } })
        if (!existing) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        const mappedData = {
            start: body.anInceput ?? existing.start,
            end: body.anSfarsit ?? existing.end,
            published: body.publicat ?? existing.published
        }

        const validation = yearSchema.safeParse(mappedData)

        if (!validation.success) {
            return errorResponse(
                "Eroare de validare: " + JSON.stringify(z.flattenError(validation.error).fieldErrors),
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Verifică dacă noua perioadă este folosită de alt an
        if (body.anInceput || body.anSfarsit) {
            const duplicate = await prisma.academicYear.findFirst({
                where: {
                    start: validation.data.start,
                    end: validation.data.end,
                    id: { not: id }
                }
            })
            if (duplicate) {
                return errorResponse(
                    "Există deja un an universitar cu această perioadă",
                    API_ERRORS.CONFLICT.status,
                    API_ERRORS.CONFLICT.code
                )
            }
        }

        await prisma.academicYear.update({
            where: { id },
            data: validation.data
        })

        return successResponse({
            id,
            message: "An universitar actualizat cu succes"
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
 * DELETE /api/ani-universitari/{id}
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAdmin()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params

        const existing = await prisma.academicYear.findUnique({
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
                `Nu se poate șterge anul universitar. Are ${existing._count.events} evenimente asociate.`,
                API_ERRORS.CONFLICT.status,
                API_ERRORS.CONFLICT.code
            )
        }

        await prisma.academicYear.delete({ where: { id } })

        return successResponse({
            id,
            message: "An universitar șters cu succes"
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