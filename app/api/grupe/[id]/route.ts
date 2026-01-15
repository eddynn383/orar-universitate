// app/api/grupe/[id]/route.ts

import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
    successResponse,
    errorResponse,
    requireAuth,
    requireAdmin,
    API_ERRORS
} from "@/lib/api-utils"
import { groupSchema } from "@/schemas/group"
import { z } from "zod"

type RouteParams = {
    params: Promise<{ id: string }>
}

/**
 * GET /api/grupe/{id}
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params

        const group = await prisma.group.findUnique({
            where: { id },
            include: {
                studyYear: {
                    include: { learningType: true }
                },
                learningType: true,
                _count: { select: { events: true } }
            }
        })

        if (!group) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        const transformed = {
            id: group.id,
            nume: group.name,
            numarGrupa: group.group,
            semestru: group.semester,
            anStudiu: group.studyYear?.year,
            anStudiuId: group.studyYearId,
            ciclu: group.learningType?.learningCycle || group.studyYear?.learningType?.learningCycle,
            cicluId: group.learningTypeId,
            numarEvenimente: group._count.events,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt
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
 * PUT /api/grupe/{id}
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAdmin()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params
        const body = await request.json()

        const existing = await prisma.group.findUnique({ where: { id } })
        if (!existing) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        const mappedData = {
            name: body.nume ?? existing.name,
            group: (body.numarGrupa ?? existing.group).toString(),
            semester: (body.semestru ?? existing.semester).toString(),
            studyYearId: body.anStudiuId ?? existing.studyYearId,
            learningTypeId: body.cicluId ?? existing.learningTypeId
        }

        const validation = groupSchema.safeParse(mappedData)

        if (!validation.success) {
            return errorResponse(
                "Eroare de validare: " + JSON.stringify(z.flattenError(validation.error).fieldErrors),
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Verifică unicitatea numelui pentru studyYear (excluzând grupa curentă)
        if (body.nume && body.nume !== existing.name) {
            const nameExists = await prisma.group.findFirst({
                where: {
                    studyYearId: validation.data.studyYearId,
                    name: body.nume,
                    id: { not: id }
                }
            })
            if (nameExists) {
                return errorResponse(
                    "Există deja o grupă cu acest nume pentru anul de studiu selectat",
                    API_ERRORS.CONFLICT.status,
                    API_ERRORS.CONFLICT.code
                )
            }
        }

        await prisma.group.update({
            where: { id },
            data: {
                ...validation.data,
                updatedById: authResult.user.id
            }
        })

        return successResponse({
            id,
            message: "Grupă actualizată cu succes"
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
 * DELETE /api/grupe/{id}
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAdmin()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params

        const existing = await prisma.group.findUnique({
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
                `Nu se poate șterge grupa. Are ${existing._count.events} evenimente asociate.`,
                API_ERRORS.CONFLICT.status,
                API_ERRORS.CONFLICT.code
            )
        }

        await prisma.group.delete({ where: { id } })

        return successResponse({
            id,
            message: "Grupă ștearsă cu succes"
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