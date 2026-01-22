/**
 * @fileoverview API route for exporting schedule as PDF
 *
 * This endpoint generates a PDF document of the schedule based on provided filters.
 * All users can export schedules, but visibility is filtered by role (students see only published events).
 */

import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAuth, API_ERRORS } from "@/lib/api-utils"

/**
 * GET /api/orar/export-pdf
 *
 * Generates a PDF export of the schedule with applied filters.
 * Returns JSON data that can be used by client-side PDF generation.
 *
 * @query {string} [anUniversitar] - Academic year filter
 * @query {string} [ciclu] - Learning cycle filter
 * @query {number} [semestru] - Semester filter
 * @query {number} [an] - Study year filter
 * @query {string} [grupa] - Group filter
 *
 * @returns JSON data for PDF generation
 */
export async function GET(request: NextRequest) {
    // Verifică autentificarea
    const authResult = await requireAuth()
    if (!authResult.success) {
        return NextResponse.json(
            { error: "Neautorizat" },
            { status: 401 }
        )
    }

    const userRole = authResult.user.role
    const userId = authResult.user.id

    try {
        const { searchParams } = new URL(request.url)

        // Parse filters
        const filters: any = {
            anUniversitar: searchParams.get("anUniversitar"),
            ciclu: searchParams.get("ciclu"),
            semestru: searchParams.get("semestru") ? parseInt(searchParams.get("semestru")!) : undefined,
            an: searchParams.get("an") ? parseInt(searchParams.get("an")!) : undefined,
            grupa: searchParams.get("grupa")
        }

        // Build where clause
        const where: any = {}

        // Role-based status filtering
        if (userRole === "STUDENT") {
            where.status = "PUBLISHED"
        } else if (userRole === "PROFESOR") {
            const teacher = await prisma.teacher.findFirst({
                where: {
                    OR: [
                        { createdById: userId },
                        { email: authResult.user.email }
                    ]
                }
            })

            if (teacher) {
                where.OR = [
                    { status: "PUBLISHED" },
                    { teacherId: teacher.id }
                ]
            } else {
                where.status = "PUBLISHED"
            }
        }

        // Apply filters
        if (filters.anUniversitar) {
            const [start, end] = filters.anUniversitar.split("-").map(Number)
            const academicYear = await prisma.academicYear.findFirst({
                where: { start, end }
            })
            if (academicYear) {
                where.academicYearId = academicYear.id
            }
        }

        if (filters.ciclu) {
            const learningType = await prisma.learningType.findFirst({
                where: {
                    learningCycle: {
                        equals: filters.ciclu.charAt(0).toUpperCase() + filters.ciclu.slice(1),
                        mode: 'insensitive'
                    }
                }
            })
            if (learningType) {
                where.learningId = learningType.id
            }
        }

        if (filters.semestru) {
            where.semester = filters.semestru
        }

        if (filters.an) {
            where.discipline = {
                studyYear: {
                    year: filters.an
                }
            }
        }

        if (filters.grupa) {
            where.groups = {
                some: {
                    groupId: filters.grupa
                }
            }
        }

        // Fetch events
        const events = await prisma.event.findMany({
            where,
            include: {
                teacher: {
                    select: {
                        grade: true,
                        user: {
                            select: {
                                firstname: true,
                                lastname: true
                            }
                        }
                    }
                },
                discipline: {
                    select: {
                        name: true,
                        studyYear: {
                            select: {
                                year: true
                            }
                        }
                    }
                },
                classroom: {
                    select: {
                        name: true,
                        building: true
                    }
                },
                groups: {
                    select: {
                        group: {
                            select: {
                                name: true
                            }
                        }
                    }
                },
                learnings: {
                    select: {
                        learningCycle: true
                    }
                },
                academicYear: {
                    select: {
                        start: true,
                        end: true
                    }
                }
            },
            orderBy: [
                { day: 'asc' },
                { startHour: 'asc' }
            ]
        })

        // Transform events for PDF generation
        const transformedEvents = events.map(event => ({
            zi: event.day,
            oraInceput: event.startHour,
            oraSfarsit: event.endHour,
            tipActivitate: event.eventType,
            frecventa: event.eventRecurrence,
            profesor: `${event.teacher.grade || ''} ${event.teacher.user?.firstname} ${event.teacher.user?.lastname}`.trim(),
            disciplina: event.discipline.name,
            sala: event.classroom.building ? `${event.classroom.name} (${event.classroom.building})` : event.classroom.name,
            grupe: event.groups.map(g => g.group.name).join(", ")
        }))

        // Metadata for PDF
        const metadata = {
            anUniversitar: filters.anUniversitar || (events[0]?.academicYear ? `${events[0].academicYear.start}-${events[0].academicYear.end}` : "N/A"),
            ciclu: filters.ciclu || events[0]?.learnings?.learningCycle || "N/A",
            semestru: filters.semestru || events[0]?.semester || "N/A",
            an: filters.an || events[0]?.discipline?.studyYear?.year || "N/A",
            dataGenerare: new Date().toLocaleDateString("ro-RO")
        }

        return NextResponse.json({
            success: true,
            data: transformedEvents,
            metadata
        })

    } catch (error) {
        console.error("PDF Export Error:", error)
        return NextResponse.json(
            { error: "Eroare la generarea PDF-ului" },
            { status: 500 }
        )
    }
}
