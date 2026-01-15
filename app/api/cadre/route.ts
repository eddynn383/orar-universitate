// app/api/cadre/route.ts

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
import { teacherSchema } from "@/schemas/teacher"
import { z } from "zod"

/**
 * GET /api/cadre
 * Returnează lista cadrelor didactice
 * 
 * Query params:
 * - page: numărul paginii (default: 1)
 * - limit: numărul de rezultate per pagină (default: 50, max: 100)
 * - search: căutare după nume sau email
 * - grad: filtrare după grad didactic
 * 
 * Requires: Authenticated user
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
        const grad = searchParams.get("grad") || undefined

        const where: any = {}

        if (search) {
            where.OR = [
                { firstname: { contains: search, mode: 'insensitive' } },
                { lastname: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ]
        }

        if (grad) {
            where.grade = grad
        }

        const total = await prisma.teacher.count({ where })

        const teachers = await prisma.teacher.findMany({
            where,
            include: {
                disciplines: {
                    select: {
                        id: true,
                        name: true,
                        semester: true,
                        studyYear: {
                            select: {
                                year: true,
                                learningType: {
                                    select: { learningCycle: true }
                                }
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        events: true,
                        disciplines: true
                    }
                }
            },
            orderBy: [
                { lastname: 'asc' },
                { firstname: 'asc' }
            ],
            skip: (params.page - 1) * params.limit,
            take: params.limit
        })

        const transformedTeachers = teachers.map(teacher => ({
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
            statistici: {
                numarEvenimente: teacher._count.events,
                numarDiscipline: teacher._count.disciplines
            },
            createdAt: teacher.createdAt,
            updatedAt: teacher.updatedAt
        }))

        return successResponse(transformedTeachers, {
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
 * POST /api/cadre
 * Creează un nou cadru didactic
 * 
 * Body:
 * {
 *   prenume: "Ion",
 *   numeFamilie: "Popescu",
 *   email: "ion.popescu@example.com",
 *   telefon: "0712345678",
 *   grad: "Prof. dr.",
 *   titlu: "Profesor universitar",
 *   imagine: "https://..."
 * }
 * 
 * Requires: ADMIN role
 */
export async function POST(request: NextRequest) {
    const authResult = await requireAdmin()
    if (!authResult.success) {
        return authResult.response
    }

    try {
        const body = await request.json()

        // Mapare din format API în format intern
        const mappedData = {
            firstname: body.prenume,
            lastname: body.numeFamilie,
            email: body.email,
            phone: body.telefon,
            grade: body.grad,
            title: body.titlu,
            image: body.imagine
        }

        const validation = teacherSchema.safeParse(mappedData)

        if (!validation.success) {
            return errorResponse(
                "Eroare de validare: " + JSON.stringify(z.flattenError(validation.error).fieldErrors),
                API_ERRORS.VALIDATION_ERROR.status,
                API_ERRORS.VALIDATION_ERROR.code
            )
        }

        // Verifică dacă există deja un cadru cu acest email
        const existing = await prisma.teacher.findFirst({
            where: { email: validation.data.email }
        })

        if (existing) {
            return errorResponse(
                "Există deja un cadru didactic cu această adresă de email",
                API_ERRORS.CONFLICT.status,
                API_ERRORS.CONFLICT.code
            )
        }

        const teacher = await prisma.teacher.create({
            data: {
                ...validation.data,
                createdById: authResult.user.id,
                updatedById: authResult.user.id
            }
        })

        return successResponse({
            id: teacher.id,
            message: "Cadru didactic creat cu succes"
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