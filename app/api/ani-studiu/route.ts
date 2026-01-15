// app/api/ani-studiu/route.ts

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
import { z } from "zod"

// Schema pentru validare
const studyYearSchema = z.object({
    year: z.number().int().min(1).max(6),
    learningTypeId: z.string().min(1, "Ciclul de învățământ este obligatoriu")
})

/**
 * GET /api/ani-studiu
 * Returnează lista anilor de studiu (An 1, An 2, An 3, etc.)
 * 
 * Query params:
 * - page, limit: paginare
 * - ciclu: ID-ul sau numele ciclului de învățământ
 */
export async function GET(request: NextRequest) {
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { searchParams } = new URL(request.url)
        const params = parseQueryParams(searchParams)
        const cicluId = searchParams.get("cicluId") || undefined
        const cicluNume = searchParams.get("ciclu") || undefined

        const where: any = {}

        if (cicluId) {
            where.learningTypeId = cicluId
        } else if (cicluNume) {
            where.learningType = {
                learningCycle: {
                    equals: cicluNume.charAt(0).toUpperCase() + cicluNume.slice(1),
                    mode: 'insensitive'
                }
            }
        }

        const total = await prisma.studyYear.count({ where })

        const studyYears = await prisma.studyYear.findMany({
            where,
            include: {
                learningType: {
                    select: {
                        id: true,
                        learningCycle: true
                    }
                },
                _count: {
                    select: {
                        studentGroups: true,
                        disciplines: true
                    }
                }
            },
            orderBy: [
                { learningType: { learningCycle: 'asc' } },
                { year: 'asc' }
            ],
            skip: (params.page - 1) * params.limit,
            take: params.limit
        })

        const transformed = studyYears.map(sy => ({
            id: sy.id,
            an: sy.year,
            nume: `Anul ${sy.year}`,
            ciclu: sy.learningType ? {
                id: sy.learningType.id,
                nume: sy.learningType.learningCycle
            } : null,
            statistici: {
                numarGrupe: sy._count.studentGroups,
                numarDiscipline: sy._count.disciplines
            }
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
 * POST /api/ani-studiu
 * Creează un nou an de studiu
 * 
 * Body:
 * {
 *   an: 1,
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
            year: body.an,
            learningTypeId: body.cicluId
        }

        const validation = studyYearSchema.safeParse(mappedData)

        if (!validation.success) {
            return errorResponse(
                "Eroare de validare: " + JSON.stringify(z.flattenError(validation.error).fieldErrors),
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Verifică dacă ciclul există
        const learningType = await prisma.learningType.findUnique({
            where: { id: validation.data.learningTypeId }
        })

        if (!learningType) {
            return errorResponse(
                "Ciclul de învățământ specificat nu există",
                API_ERRORS.NOT_FOUND.status,
                API_ERRORS.NOT_FOUND.code
            )
        }

        // Verifică dacă există deja acest an pentru ciclu
        const existing = await prisma.studyYear.findFirst({
            where: {
                learningTypeId: validation.data.learningTypeId,
                year: validation.data.year
            }
        })

        if (existing) {
            return errorResponse(
                `Anul ${validation.data.year} există deja pentru ${learningType.learningCycle}`,
                API_ERRORS.CONFLICT.status,
                API_ERRORS.CONFLICT.code
            )
        }

        const studyYear = await prisma.studyYear.create({
            data: validation.data,
            include: {
                learningType: true
            }
        })

        return successResponse({
            id: studyYear.id,
            an: studyYear.year,
            ciclu: studyYear.learningType?.learningCycle,
            message: "An de studiu creat cu succes"
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