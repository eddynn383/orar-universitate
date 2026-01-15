// app/api/ani-studiu/[id]/route.ts

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

const studyYearSchema = z.object({
    year: z.number().int().min(1).max(6),
    learningTypeId: z.string().min(1, "Ciclul de învățământ este obligatoriu")
})

type RouteParams = {
    params: Promise<{ id: string }>
}

/**
 * GET /api/ani-studiu/{id}
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params

        const studyYear = await prisma.studyYear.findUnique({
            where: { id },
            include: {
                learningType: {
                    select: {
                        id: true,
                        learningCycle: true
                    }
                },
                studentGroups: {
                    select: {
                        id: true,
                        name: true,
                        semester: true
                    },
                    orderBy: { name: 'asc' }
                },
                disciplines: {
                    select: {
                        id: true,
                        name: true,
                        semester: true,
                        teacher: {
                            select: {
                                id: true,
                                firstname: true,
                                lastname: true,
                                grade: true
                            }
                        }
                    },
                    orderBy: { name: 'asc' }
                },
                _count: {
                    select: {
                        studentGroups: true,
                        disciplines: true
                    }
                }
            }
        })

        if (!studyYear) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        const transformed = {
            id: studyYear.id,
            an: studyYear.year,
            nume: `Anul ${studyYear.year}`,
            ciclu: studyYear.learningType ? {
                id: studyYear.learningType.id,
                nume: studyYear.learningType.learningCycle
            } : null,
            grupe: studyYear.studentGroups.map(g => ({
                id: g.id,
                nume: g.name,
                semestru: g.semester
            })),
            discipline: studyYear.disciplines.map(d => ({
                id: d.id,
                nume: d.name,
                semestru: d.semester,
                profesor: d.teacher ? {
                    id: d.teacher.id,
                    nume: `${d.teacher.grade || ''} ${d.teacher.firstname} ${d.teacher.lastname}`.trim()
                } : null
            })),
            statistici: {
                numarGrupe: studyYear._count.studentGroups,
                numarDiscipline: studyYear._count.disciplines
            }
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
 * PUT /api/ani-studiu/{id}
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAdmin()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params
        const body = await request.json()

        const existing = await prisma.studyYear.findUnique({ where: { id } })
        if (!existing) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        const mappedData = {
            year: body.an ?? existing.year,
            learningTypeId: body.cicluId ?? existing.learningTypeId
        }

        const validation = studyYearSchema.safeParse(mappedData)

        if (!validation.success) {
            return errorResponse(
                "Eroare de validare: " + JSON.stringify(z.flattenError(validation.error).fieldErrors),
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Verifică dacă noul ciclu există
        if (body.cicluId && body.cicluId !== existing.learningTypeId) {
            const learningType = await prisma.learningType.findUnique({
                where: { id: body.cicluId }
            })
            if (!learningType) {
                return errorResponse(
                    "Ciclul de învățământ specificat nu există",
                    API_ERRORS.NOT_FOUND.status,
                    API_ERRORS.NOT_FOUND.code
                )
            }
        }

        // Verifică unicitatea combinației an-ciclu
        if (body.an !== existing.year || body.cicluId !== existing.learningTypeId) {
            const duplicate = await prisma.studyYear.findFirst({
                where: {
                    learningTypeId: validation.data.learningTypeId,
                    year: validation.data.year,
                    id: { not: id }
                }
            })
            if (duplicate) {
                return errorResponse(
                    "Această combinație de an și ciclu există deja",
                    API_ERRORS.CONFLICT.status,
                    API_ERRORS.CONFLICT.code
                )
            }
        }

        await prisma.studyYear.update({
            where: { id },
            data: validation.data
        })

        return successResponse({
            id,
            message: "An de studiu actualizat cu succes"
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
 * DELETE /api/ani-studiu/{id}
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAdmin()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params

        const existing = await prisma.studyYear.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        studentGroups: true,
                        disciplines: true
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

        const totalDependencies = existing._count.studentGroups + existing._count.disciplines

        if (totalDependencies > 0) {
            return errorResponse(
                `Nu se poate șterge anul de studiu. Are ${existing._count.studentGroups} grupe și ${existing._count.disciplines} discipline asociate.`,
                API_ERRORS.CONFLICT.status,
                API_ERRORS.CONFLICT.code
            )
        }

        await prisma.studyYear.delete({ where: { id } })

        return successResponse({
            id,
            message: "An de studiu șters cu succes"
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