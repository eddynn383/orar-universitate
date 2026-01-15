// app/api/ani-universitari/route.ts

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
import { yearSchema } from "@/schemas/year"
import { z } from "zod"

/**
 * GET /api/ani-universitari
 * Returnează lista anilor universitari
 * 
 * Query params:
 * - page, limit: paginare
 * - publicat: filtrare după status publicare (true/false)
 */
export async function GET(request: NextRequest) {
    const authResult = await requireAuth()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const { searchParams } = new URL(request.url)
        const params = parseQueryParams(searchParams)
        const publicat = searchParams.get("publicat")

        const where: any = {}

        if (publicat !== null) {
            where.published = publicat === "true"
        }

        const total = await prisma.academicYear.count({ where })

        const academicYears = await prisma.academicYear.findMany({
            where,
            include: {
                _count: {
                    select: { events: true }
                }
            },
            orderBy: { start: 'desc' },
            skip: (params.page - 1) * params.limit,
            take: params.limit
        })

        const transformed = academicYears.map(ciclu => ({
            id: ciclu.id,
            anInceput: ciclu.start,
            anSfarsit: ciclu.end,
            perioada: `${ciclu.start}-${ciclu.end}`,
            publicat: ciclu.published,
            numarEvenimente: ciclu._count.events,
            createdAt: ciclu.createdAt,
            updatedAt: ciclu.updatedAt
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
 * POST /api/ani-universitari
 * Creează un nou an universitar
 * 
 * Body:
 * {
 *   anInceput: 2024,
 *   anSfarsit: 2025,
 *   publicat: false
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
            start: body.anInceput,
            end: body.anSfarsit,
            published: body.publicat ?? false
        }

        const validation = yearSchema.safeParse(mappedData)

        if (!validation.success) {
            return errorResponse(
                "Eroare de validare: " + JSON.stringify(z.flattenError(validation.error).fieldErrors),
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Verifică dacă există deja
        const existing = await prisma.academicYear.findFirst({
            where: {
                start: validation.data.start,
                end: validation.data.end
            }
        })

        if (existing) {
            return errorResponse(
                "Există deja un an universitar cu această perioadă",
                API_ERRORS.CONFLICT.status,
                API_ERRORS.CONFLICT.code
            )
        }

        const academicYear = await prisma.academicYear.create({
            data: validation.data
        })

        return successResponse({
            id: academicYear.id,
            perioada: `${academicYear.start}-${academicYear.end}`,
            message: "An universitar creat cu succes"
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