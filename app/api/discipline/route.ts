// app/api/discipline/route.ts

import { NextRequest } from "next/server"
import prisma from "@/lib/prisma"
import {
    successResponse,
    errorResponse,
    requireAuth,
    requireAdmin,
    parseQueryParams,
    API_ERRORS
} from "@/lib/api-utils"
import { disciplineSchema } from "@/schemas/discipline"
import { z } from "zod"

/**
 * GET /api/discipline
 * Returnează lista disciplinelor
 * 
 * Query params:
 * - page, limit: paginare
 * - an: anul de studiu (1, 2, 3)
 * - ciclu: tipul de învățământ (licenta, master)
 * - semestru: semestrul (1, 2)
 * - profesor: ID-ul profesorului
 * - search: căutare după nume
 */
export async function GET(request: NextRequest) {
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { searchParams } = new URL(request.url)
        const params = parseQueryParams(searchParams)
        const search = searchParams.get("search") || undefined

        const where: any = {}

        if (search) {
            where.name = { contains: search, mode: 'insensitive' }
        }

        if (params.semestru) {
            where.semester = params.semestru
        }

        if (params.profesor) {
            where.teacherId = params.profesor
        }

        if (params.an) {
            where.studyYear = { year: params.an }
        }

        if (params.ciclu) {
            where.learningType = {
                learningCycle: {
                    equals: params.ciclu.charAt(0).toUpperCase() + params.ciclu.slice(1),
                    mode: 'insensitive'
                }
            }
        }

        const total = await prisma.discipline.count({ where })

        const disciplines = await prisma.discipline.findMany({
            where,
            include: {
                teacher: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        grade: true
                    }
                },
                studyYear: {
                    select: {
                        id: true,
                        year: true,
                        learningType: {
                            select: {
                                id: true,
                                learningCycle: true
                            }
                        }
                    }
                },
                learningType: {
                    select: {
                        id: true,
                        learningCycle: true
                    }
                },
                _count: {
                    select: { events: true }
                }
            },
            orderBy: { name: 'asc' },
            skip: (params.page - 1) * params.limit,
            take: params.limit
        })

        const transformed = disciplines.map(d => ({
            id: d.id,
            nume: d.name,
            semestru: d.semester,
            anStudiu: d.studyYear?.year,
            ciclu: d.learningType?.learningCycle || d.studyYear?.learningType?.learningCycle,
            cicluId: d.learningTypeId || d.studyYear?.learningType?.id,
            anStudiuId: d.studyYearId,
            profesor: d.teacher ? {
                id: d.teacher.id,
                nume: `${d.teacher.grade || ''} ${d.teacher.firstname} ${d.teacher.lastname}`.trim()
            } : null,
            numarEvenimente: d._count.events,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt
        }))

        return successResponse(transformed, {
            total,
            page: params.page,
            limit: params.limit,
            totalPages: Math.ceil(total / params.limit)
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
 * POST /api/discipline
 * Creează o nouă disciplină
 * 
 * Body:
 * {
 *   nume: "Programare Web",
 *   semestru: 1,
 *   profesorId: "...",
 *   anStudiuId: "...",
 *   cicluId: "..."
 * }
 */
export async function POST(request: NextRequest) {
    const authResult = await requireAdmin()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const body = await request.json()

        const mappedData = {
            name: body.nume,
            semester: body.semestru?.toString(),
            teacherId: body.profesorId,
            studyYearId: body.anStudiuId,
            learningTypeId: body.cicluId
        }

        const validation = disciplineSchema.safeParse(mappedData)

        if (!validation.success) {
            return errorResponse(
                "Eroare de validare: " + JSON.stringify(z.flattenError(validation.error).fieldErrors),
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        const discipline = await prisma.discipline.create({
            data: {
                ...validation.data,
                createdById: authResult.user.id,
                updatedById: authResult.user.id
            }
        })

        return successResponse({
            id: discipline.id,
            message: "Disciplină creată cu succes"
        }, undefined, 201)

    } catch (error) {
        console.error("API Error:", error)
        return errorResponse(
            API_ERRORS.INTERNAL_ERROR.message,
            API_ERRORS.INTERNAL_ERROR.status,
            API_ERRORS.INTERNAL_ERROR.code
        )
    }
}