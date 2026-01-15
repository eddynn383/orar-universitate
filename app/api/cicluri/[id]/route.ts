// app/api/cicluri/[id]/route.ts

import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
    successResponse,
    errorResponse,
    requireAuth,
    requireAdmin,
    API_ERRORS
} from "@/lib/api-utils"
import { z } from "zod"

const learningTypeSchema = z.object({
    learningCycle: z.string().min(1, "Numele ciclului este obligatoriu")
})

type RouteParams = {
    params: Promise<{ id: string }>
}

/**
 * GET /api/cicluri/{id}
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params

        const learningType = await prisma.learningType.findUnique({
            where: { id },
            include: {
                studyYears: {
                    select: {
                        id: true,
                        year: true
                    },
                    orderBy: { year: 'asc' }
                },
                disciplines: {
                    select: {
                        id: true,
                        name: true,
                        semester: true
                    },
                    take: 20
                },
                groups: {
                    select: {
                        id: true,
                        name: true,
                        semester: true
                    },
                    take: 20
                },
                _count: {
                    select: {
                        events: true,
                        disciplines: true,
                        groups: true,
                        studyYears: true
                    }
                }
            }
        })

        if (!learningType) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        const transformed = {
            id: learningType.id,
            nume: learningType.learningCycle,
            aniStudiu: learningType.studyYears.map(sy => ({
                id: sy.id,
                an: sy.year
            })),
            discipline: learningType.disciplines.map(d => ({
                id: d.id,
                nume: d.name,
                semestru: d.semester
            })),
            grupe: learningType.groups.map(g => ({
                id: g.id,
                nume: g.name,
                semestru: g.semester
            })),
            statistici: {
                numarEvenimente: learningType._count.events,
                numarDiscipline: learningType._count.disciplines,
                numarGrupe: learningType._count.groups,
                numarAniStudiu: learningType._count.studyYears
            },
            createdAt: learningType.createdAt,
            updatedAt: learningType.updatedAt
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
 * PUT /api/cicluri/{id}
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAdmin()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params
        const body = await request.json()

        const existing = await prisma.learningType.findUnique({ where: { id } })
        if (!existing) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        const mappedData = {
            learningCycle: body.nume ?? existing.learningCycle
        }

        const validation = learningTypeSchema.safeParse(mappedData)

        if (!validation.success) {
            return errorResponse(
                "Eroare de validare: " + JSON.stringify(z.flattenError(validation.error).fieldErrors),
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Verifică dacă noul nume este folosit de alt ciclu
        if (body.nume && body.nume !== existing.learningCycle) {
            const duplicate = await prisma.learningType.findFirst({
                where: {
                    learningCycle: {
                        equals: body.nume,
                        mode: 'insensitive'
                    },
                    id: { not: id }
                }
            })
            if (duplicate) {
                return errorResponse(
                    "Există deja un ciclu de învățământ cu acest nume",
                    API_ERRORS.CONFLICT.status,
                    API_ERRORS.CONFLICT.code
                )
            }
        }

        await prisma.learningType.update({
            where: { id },
            data: validation.data
        })

        return successResponse({
            id,
            message: "Ciclu de învățământ actualizat cu succes"
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
 * DELETE /api/cicluri/{id}
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAdmin()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params

        const existing = await prisma.learningType.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        events: true,
                        disciplines: true,
                        groups: true,
                        studyYears: true
                    }
                }
            }
        })

        if (!existing) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        const totalDependencies =
            existing._count.events +
            existing._count.disciplines +
            existing._count.groups +
            existing._count.studyYears

        if (totalDependencies > 0) {
            return errorResponse(
                `Nu se poate șterge ciclul de învățământ. Are ${existing._count.studyYears} ani de studiu, ${existing._count.disciplines} discipline, ${existing._count.groups} grupe și ${existing._count.events} evenimente asociate.`,
                API_ERRORS.CONFLICT.status,
                API_ERRORS.CONFLICT.code
            )
        }

        await prisma.learningType.delete({ where: { id } })

        return successResponse({
            id,
            message: "Ciclu de învățământ șters cu succes"
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