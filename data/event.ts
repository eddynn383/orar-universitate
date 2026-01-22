// data/event.ts

import prisma from "@/lib/prisma"

const eventInclude = {
    teacher: {
        include: {
            user: {
                select: {
                    firstname: true,
                    lastname: true
                }
            }
        }
    },
    discipline: {
        include: {
            studyYear: true
        }
    },
    classroom: true,
    groups: {
        include: {
            group: {
                include: {
                    studyYear: true
                }
            }
        }
    },
    learnings: true,
    createdBy: {
        select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            image: true
        }
    },
    updatedBy: {
        select: {
            id: true,
            firstname: true,
            lastname: true,
            email: true,
            image: true
        }
    }
}

export async function getAllEvents() {
    return prisma.event.findMany({
        include: {
            ...eventInclude,
            academicYear: true
        },
        orderBy: [
            { day: 'asc' },
            { startHour: 'asc' }
        ]
    })
}

export async function getEventById(id: string) {
    return prisma.event.findUnique({
        where: { id },
        include: eventInclude,
    })
}

export async function getEventsByTeacher(teacherId: string) {
    return prisma.event.findMany({
        where: { teacherId },
        include: eventInclude,
        orderBy: [
            { day: 'asc' },
            { startHour: 'asc' }
        ]
    })
}

export async function getEventsByClassroom(classroomId: string) {
    return prisma.event.findMany({
        where: { classroomId },
        include: eventInclude,
        orderBy: [
            { day: 'asc' },
            { startHour: 'asc' }
        ]
    })
}

export async function getEventsByGroup(groupId: string) {
    return prisma.event.findMany({
        where: {
            groups: {
                some: {
                    groupId,
                },
            },
        },
        include: eventInclude,
        orderBy: [
            { day: 'asc' },
            { startHour: 'asc' },
        ],
    });
}

export async function getEventsByAcademicYear(academicYearId: string) {
    return prisma.event.findMany({
        where: { academicYearId },
        include: eventInclude,
        orderBy: [
            { day: 'asc' },
            { startHour: 'asc' }
        ]
    })
}

export async function getEventsByAcademicYearAndSemester(academicYearId: string, semester: number) {
    return prisma.event.findMany({
        where: {
            academicYearId,
            semester
        },
        include: eventInclude,
        orderBy: [
            { day: 'asc' },
            { startHour: 'asc' }
        ]
    })
}

export async function getEventsByAcademicYearSemesterAndLearningType(
    academicYearId: string,
    semester: number,
    learningId: string
) {
    const events = prisma.event.findMany({
        where: {
            academicYearId,
            semester,
            learningId
        },
        include: eventInclude,
        orderBy: [
            { day: 'asc' },
            { startHour: 'asc' }
        ]
    })

    console.log("getEventsByAcademicYearSemesterAndLearningType: ", events)
    return events
}

export async function getEventsByAcademicYearSemesterLearningTypeAndStudyYear(
    academicYearId: string,
    semester: number,
    learningTypeId: string,
    studyYearId: string
) {
    return prisma.event.findMany({
        where: {
            academicYearId,
            semester,
            learningId: learningTypeId,
            // Filtrăm după studyYear prin discipline
            discipline: {
                studyYearId
            }
        },
        include: eventInclude,
        orderBy: [
            { day: 'asc' },
            { startHour: 'asc' }
        ]
    })
}

