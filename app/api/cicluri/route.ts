// app/api/cicluri/route.ts

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
const learningTypeSchema = z.object({
    learningCycle: z.string().min(1, "Numele ciclului este obligatoriu")
})

/**
 * GET /api/cicluri
 * Returnează lista ciclurilor de învățământ (Licență, Master, etc.)
 * 
 * Query params:
 * - page, limit: paginare
 */
export async function GET(request: NextRequest) {
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { searchParams } = new URL(request.url)
        const params = parseQueryParams(searchParams)

        const total = await prisma.learningType.count()

        const learningTypes = await prisma.learningType.findMany({
            include: {
                studyYears: {
                    select: {
                        id: true,
                        year: true
                    },
                    orderBy: { year: 'asc' }
                },
                _count: {
                    select: {
                        events: true,
                        disciplines: true,
                        groups: true
                    }
                }
            },
            orderBy: { learningCycle: 'asc' },
            skip: (params.page - 1) * params.limit,
            take: params.limit
        })

        const transformed = learningTypes.map(lt => ({
            id: lt.id,
            nume: lt.learningCycle,
            aniStudiu: lt.studyYears.map(sy => ({
                id: sy.id,
                an: sy.year
            })),
            statistici: {
                numarEvenimente: lt._count.events,
                numarDiscipline: lt._count.disciplines,
                numarGrupe: lt._count.groups
            },
            createdAt: lt.createdAt,
            updatedAt: lt.updatedAt
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
 * POST /api/cicluri
 * Creează un nou ciclu de învățământ
 * 
 * Body:
 * {
 *   nume: "Licență"
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
            learningCycle: body.nume
        }

        const validation = learningTypeSchema.safeParse(mappedData)

        if (!validation.success) {
            return errorResponse(
                "Eroare de validare: " + JSON.stringify(z.flattenError(validation.error).fieldErrors),
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Verifică dacă există deja
        const existing = await prisma.learningType.findFirst({
            where: {
                learningCycle: {
                    equals: validation.data.learningCycle,
                    mode: 'insensitive'
                }
            }
        })

        if (existing) {
            return errorResponse(
                "Există deja un ciclu de învățământ cu acest nume",
                API_ERRORS.CONFLICT.status,
                API_ERRORS.CONFLICT.code
            )
        }

        const learningType = await prisma.learningType.create({
            data: validation.data
        })

        return successResponse({
            id: learningType.id,
            nume: learningType.learningCycle,
            message: "Ciclu de învățământ creat cu succes"
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