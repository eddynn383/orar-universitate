// app/api/grupe/route.ts

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
import { groupSchema } from "@/schemas/group"
import { z } from "zod"

/**
 * GET /api/grupe
 * Returnează lista grupelor de studiu
 * 
 * Query params:
 * - page, limit: paginare
 * - an: anul de studiu (1, 2, 3)
 * - ciclu: tipul de învățământ (licenta, master)
 * - semestru: semestrul (1, 2)
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

        const total = await prisma.group.count({ where })

        const groups = await prisma.group.findMany({
            where,
            include: {
                studyYear: {
                    include: { learningType: true }
                },
                learningType: true,
                _count: {
                    select: { events: true }
                }
            },
            orderBy: [
                { studyYear: { year: 'asc' } },
                { name: 'asc' }
            ],
            skip: (params.page - 1) * params.limit,
            take: params.limit
        })

        const transformed = groups.map(g => ({
            id: g.id,
            nume: g.name,
            numarGrupa: g.group,
            semestru: g.semester,
            anStudiu: g.studyYear?.year,
            anStudiuId: g.studyYearId,
            ciclu: g.learningType?.learningCycle || g.studyYear?.learningType?.learningCycle,
            cicluId: g.learningTypeId,
            numarEvenimente: g._count.events,
            createdAt: g.createdAt,
            updatedAt: g.updatedAt
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
 * POST /api/grupe
 * Creează o nouă grupă
 * 
 * Body:
 * {
 *   nume: "A1",
 *   numarGrupa: 1,
 *   semestru: 1,
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
            group: body.numarGrupa?.toString(),
            semester: body.semestru?.toString(),
            studyYearId: body.anStudiuId,
            learningTypeId: body.cicluId
        }

        const validation = groupSchema.safeParse(mappedData)

        if (!validation.success) {
            return errorResponse(
                "Eroare de validare: " + JSON.stringify(z.flattenError(validation.error).fieldErrors),
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Verifică unicitatea numelui pentru studyYear
        const existing = await prisma.group.findFirst({
            where: {
                studyYearId: validation.data.studyYearId,
                name: validation.data.name
            }
        })

        if (existing) {
            return errorResponse(
                "Există deja o grupă cu acest nume pentru anul de studiu selectat",
                API_ERRORS.CONFLICT.status,
                API_ERRORS.CONFLICT.code
            )
        }

        const group = await prisma.group.create({
            data: {
                ...validation.data,
                createdById: authResult.user.id,
                updatedById: authResult.user.id
            }
        })

        return successResponse({
            id: group.id,
            message: "Grupă creată cu succes"
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