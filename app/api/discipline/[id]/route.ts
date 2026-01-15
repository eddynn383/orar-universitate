// app/api/discipline/[id]/route.ts

import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
    successResponse,
    errorResponse,
    requireAuth,
    requireAdmin,
    API_ERRORS
} from "@/lib/api-utils"
import { disciplineSchema } from "@/schemas/discipline"
import { z } from "zod"

type RouteParams = {
    params: Promise<{ id: string }>
}

/**
 * GET /api/discipline/{id}
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params

        const discipline = await prisma.discipline.findUnique({
            where: { id },
            include: {
                teacher: true,
                studyYear: {
                    include: { learningType: true }
                },
                learningType: true,
                _count: { select: { events: true } }
            }
        })

        if (!discipline) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        const transformed = {
            id: discipline.id,
            nume: discipline.name,
            semestru: discipline.semester,
            anStudiu: discipline.studyYear?.year,
            anStudiuId: discipline.studyYearId,
            ciclu: discipline.learningType?.learningCycle || discipline.studyYear?.learningType?.learningCycle,
            cicluId: discipline.learningTypeId,
            profesor: discipline.teacher ? {
                id: discipline.teacher.id,
                nume: `${discipline.teacher.grade || ''} ${discipline.teacher.firstname} ${discipline.teacher.lastname}`.trim(),
                email: discipline.teacher.email
            } : null,
            numarEvenimente: discipline._count.events,
            createdAt: discipline.createdAt,
            updatedAt: discipline.updatedAt
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
 * PUT /api/discipline/{id}
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAdmin()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params
        const body = await request.json()

        const existing = await prisma.discipline.findUnique({ where: { id } })
        if (!existing) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        const mappedData = {
            name: body.nume ?? existing.name,
            semester: (body.semestru ?? existing.semester).toString(),
            teacherId: body.profesorId ?? existing.teacherId,
            studyYearId: body.anStudiuId ?? existing.studyYearId,
            learningTypeId: body.cicluId ?? existing.learningTypeId
        }

        const validation = disciplineSchema.safeParse(mappedData)

        if (!validation.success) {
            return errorResponse(
                "Eroare de validare: " + JSON.stringify(z.flattenError(validation.error).fieldErrors),
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        await prisma.discipline.update({
            where: { id },
            data: {
                ...validation.data,
                updatedById: authResult.user.id
            }
        })

        return successResponse({
            id,
            message: "Disciplină actualizată cu succes"
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
 * DELETE /api/discipline/{id}
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAdmin()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params

        const existing = await prisma.discipline.findUnique({
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
                `Nu se poate șterge disciplina. Are ${existing._count.events} evenimente asociate.`,
                API_ERRORS.CONFLICT.status,
                API_ERRORS.CONFLICT.code
            )
        }

        await prisma.discipline.delete({ where: { id } })

        return successResponse({
            id,
            message: "Disciplină ștearsă cu succes"
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