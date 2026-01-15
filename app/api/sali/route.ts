// app/api/sali/route.ts

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
import { classroomSchema } from "@/schemas/classroom"
import { z } from "zod"

/**
 * GET /api/sali
 * Returnează lista sălilor de clasă
 * 
 * Query params:
 * - page, limit: paginare
 * - cladire: filtrare după clădire
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
        const cladire = searchParams.get("cladire") || undefined

        const where: any = {}

        if (search) {
            where.name = { contains: search, mode: 'insensitive' }
        }

        if (cladire) {
            where.building = { contains: cladire, mode: 'insensitive' }
        }

        const total = await prisma.classroom.count({ where })

        const classrooms = await prisma.classroom.findMany({
            where,
            include: {
                _count: { select: { events: true } }
            },
            orderBy: [
                { building: 'asc' },
                { name: 'asc' }
            ],
            skip: (params.page - 1) * params.limit,
            take: params.limit
        })

        const transformed = classrooms.map(c => ({
            id: c.id,
            nume: c.name,
            cladire: c.building,
            capacitate: c.capacity,
            numarEvenimente: c._count.events,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt
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
 * POST /api/sali
 * Creează o nouă sală
 * 
 * Body:
 * {
 *   nume: "A101",
 *   cladire: "Corp A",
 *   capacitate: 100
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
            building: body.cladire,
            capacity: body.capacitate?.toString()
        }

        const validation = classroomSchema.safeParse(mappedData)

        if (!validation.success) {
            return errorResponse(
                "Eroare de validare: " + JSON.stringify(z.flattenError(validation.error).fieldErrors),
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Verifică dacă există deja o sală cu acest nume
        const existing = await prisma.classroom.findFirst({
            where: { name: validation.data.name }
        })

        if (existing) {
            return errorResponse(
                "Există deja o sală cu acest nume",
                API_ERRORS.CONFLICT.status,
                API_ERRORS.CONFLICT.code
            )
        }

        const classroom = await prisma.classroom.create({
            data: {
                ...validation.data,
                createdById: authResult.user.id,
                updatedById: authResult.user.id
            }
        })

        return successResponse({
            id: classroom.id,
            message: "Sală creată cu succes"
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