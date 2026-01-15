// app/api/cadre/[id]/route.ts

import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
    successResponse,
    errorResponse,
    requireAuth,
    requireAdmin,
    API_ERRORS
} from "@/lib/api-utils"
import { teacherSchema } from "@/schemas/teacher"
import { z } from "zod"

type RouteParams = {
    params: Promise<{ id: string }>
}

/**
 * GET /api/cadre/{id}
 * Returnează detaliile unui cadru didactic
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params

        const teacher = await prisma.teacher.findUnique({
            where: { id },
            include: {
                disciplines: {
                    include: {
                        studyYear: {
                            include: {
                                learningType: true
                            }
                        }
                    }
                },
                events: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        discipline: true,
                        classroom: true,
                        academicYear: true
                    }
                },
                _count: {
                    select: {
                        events: true,
                        disciplines: true
                    }
                }
            }
        })

        if (!teacher) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        const transformed = {
            id: teacher.id,
            nume: `${teacher.grade || ''} ${teacher.firstname} ${teacher.lastname}`.trim(),
            prenume: teacher.firstname,
            numeFamilie: teacher.lastname,
            grad: teacher.grade,
            titlu: teacher.title,
            email: teacher.email,
            telefon: teacher.phone,
            imagine: teacher.image,
            discipline: teacher.disciplines.map(d => ({
                id: d.id,
                nume: d.name,
                semestru: d.semester,
                anStudiu: d.studyYear?.year,
                ciclu: d.studyYear?.learningType?.learningCycle
            })),
            evenimenteRecente: teacher.events.map(e => ({
                id: e.id,
                zi: e.day,
                oraInceput: e.startHour,
                oraSfarsit: e.endHour,
                disciplina: e.discipline?.name,
                sala: e.classroom?.name,
                anUniversitar: e.academicYear ? `${e.academicYear.start}-${e.academicYear.end}` : null
            })),
            statistici: {
                numarEvenimente: teacher._count.events,
                numarDiscipline: teacher._count.disciplines
            },
            createdAt: teacher.createdAt,
            updatedAt: teacher.updatedAt
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
 * PUT /api/cadre/{id}
 * Actualizează un cadru didactic
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAdmin()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params
        const body = await request.json()

        const existing = await prisma.teacher.findUnique({ where: { id } })
        if (!existing) {
            return errorResponse(
                API_ERRORS.NOT_FOUND.message,
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        const mappedData = {
            firstname: body.prenume ?? existing.firstname,
            lastname: body.numeFamilie ?? existing.lastname,
            email: body.email ?? existing.email,
            phone: body.telefon ?? existing.phone,
            grade: body.grad ?? existing.grade,
            title: body.titlu ?? existing.title,
            image: body.imagine ?? existing.image
        }

        const validation = teacherSchema.safeParse(mappedData)

        if (!validation.success) {
            return errorResponse(
                "Eroare de validare: " + JSON.stringify(z.flattenError(validation.error).fieldErrors),
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Verifică dacă noul email este folosit de alt cadru
        if (body.email && body.email !== existing.email) {
            const emailExists = await prisma.teacher.findFirst({
                where: { email: body.email, id: { not: id } }
            })
            if (emailExists) {
                return errorResponse(
                    "Această adresă de email este deja folosită",
                    API_ERRORS.CONFLICT.status,
                    API_ERRORS.CONFLICT.code
                )
            }
        }

        await prisma.teacher.update({
            where: { id },
            data: {
                ...validation.data,
                updatedById: authResult.user.id
            }
        })

        return successResponse({
            id,
            message: "Cadru didactic actualizat cu succes"
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
 * DELETE /api/cadre/{id}
 * Șterge un cadru didactic
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const authResult = await requireAdmin()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { id } = await params

        const existing = await prisma.teacher.findUnique({
            where: { id },
            include: {
                _count: { select: { events: true } }
            }
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
                `Nu se poate șterge cadrul didactic. Are ${existing._count.events} evenimente asociate.`,
                API_ERRORS.CONFLICT.status,
                API_ERRORS.CONFLICT.code
            )
        }

        await prisma.teacher.delete({ where: { id } })

        return successResponse({
            id,
            message: "Cadru didactic șters cu succes"
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