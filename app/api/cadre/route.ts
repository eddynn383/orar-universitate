/**
 * @fileoverview API routes for managing teaching staff (Cadre Didactice)
 *
 * This module handles CRUD operations for teachers/professors, including
 * their personal information, academic grade, contact details, and associations
 * with disciplines and events. Supports searching and filtering by various criteria.
 *
 * @module app/api/cadre
 */

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
 *
 * Retrieves a paginated list of teaching staff with their disciplines and statistics.
 * Supports searching by name or email and filtering by academic grade.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 *
 * @query {number} [page=1] - Page number for pagination
 * @query {number} [limit=50] - Number of items per page (max: 100)
 * @query {string} [search] - Search term for filtering by first name, last name, or email (case-insensitive)
 * @query {string} [grad] - Filter by academic grade (e.g., "Prof. dr.", "Lector dr.")
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - data: Array of teacher objects with:
 *     - id: Teacher ID
 *     - nume: Full name with grade (e.g., "Prof. dr. Ion Popescu")
 *     - prenume: First name
 *     - numeFamilie: Last name
 *     - grad: Academic grade
 *     - titlu: Academic title
 *     - email: Email address
 *     - telefon: Phone number
 *     - imagine: Profile image URL
 *     - discipline: Array of associated disciplines with study year and cycle info
 *     - statistici: Statistics (numarEvenimente, numarDiscipline)
 *     - createdAt: Creation timestamp
 *     - updatedAt: Last update timestamp
 *   - meta: Pagination metadata (total, page, limit, totalPages)
 *
 * @throws {401} If user is not authenticated
 * @throws {500} If database operation fails
 *
 * @requires Authentication
 *
 * @example
 * // Request: GET /api/cadre?search=popescu&grad=Prof.%20dr.&page=1&limit=10
 * // Response: {
 * //   success: true,
 * //   data: [{ id: "...", nume: "Prof. dr. Ion Popescu", email: "ion.popescu@...", discipline: [...], ... }],
 * //   meta: { total: 15, page: 1, limit: 10, totalPages: 2 }
 * // }
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
 *
 * Creates a new teaching staff member with the specified information.
 * Validates all required fields and prevents duplicate email addresses.
 * The creating user's ID is automatically recorded.
 *
 * @async
 * @param {NextRequest} request - The incoming Next.js request object
 *
 * @body {Object} request.body - The teacher data
 * @body {string} request.body.prenume - Teacher's first name (required)
 * @body {string} request.body.numeFamilie - Teacher's last name (required)
 * @body {string} request.body.email - Teacher's email address (required, must be unique)
 * @body {string} [request.body.telefon] - Teacher's phone number
 * @body {string} [request.body.grad] - Academic grade (e.g., "Prof. dr.", "Conf. dr.", "Lector dr.")
 * @body {string} [request.body.titlu] - Academic title (e.g., "Profesor universitar")
 * @body {string} [request.body.imagine] - Profile image URL
 *
 * @returns {Promise<Response>} JSON response containing:
 *   - success: true
 *   - data: { id, message }
 *
 * @throws {400} If validation fails (missing required fields or invalid format)
 * @throws {401} If user is not authenticated
 * @throws {403} If user is not an admin
 * @throws {409} If teacher with this email already exists
 * @throws {500} If database operation fails
 *
 * @requires Admin role
 *
 * @example
 * // Request: POST /api/cadre
 * // Body: { "prenume": "Ion", "numeFamilie": "Popescu", "email": "ion.popescu@example.com", "grad": "Prof. dr." }
 * // Response: {
 * //   success: true,
 * //   data: { id: "...", message: "Cadru didactic creat cu succes" }
 * // }
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