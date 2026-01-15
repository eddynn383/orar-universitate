// data/group.ts

import prisma from "@/lib/prisma"

export async function getAllGroups() {
    return prisma.group.findMany({
        include: {
            studyYear: true,
            learningType: true
        },
        orderBy: [
            { studyYear: { year: 'asc' } },
            { name: 'asc' }
        ]
    })
}

export async function getGroupById(id: string) {
    return prisma.group.findUnique({
        where: { id },
        include: {
            studyYear: true,
            learningType: true,
            createdBy: {
                select: { id: true, name: true, email: true, image: true }
            },
            updatedBy: {
                select: { id: true, name: true, email: true, image: true }
            }
        }
    })
}

export async function getGroupsByLearningType(learningTypeId: string) {
    return prisma.group.findMany({
        where: {
            learningTypeId
        },
        include: {
            studyYear: true
        },
        orderBy: [
            { studyYear: { year: 'asc' } },
            { name: 'asc' }
        ]
    })
}

export async function getGroupsByLearningTypeAndSemester(learningTypeId: string, semester: number) {
    return prisma.group.findMany({
        where: {
            learningTypeId,
            semester
        },
        include: {
            studyYear: true
        },
        orderBy: [
            { studyYear: { year: 'asc' } },
            { name: 'asc' }
        ]
    })
}

export async function getGroupsByStudyYear(studyYearId: string) {
    return prisma.group.findMany({
        where: {
            studyYearId
        },
        orderBy: {
            name: 'asc'
        }
    })
}

export async function getGroupsByStudyYearAndSemester(studyYearId: string, semester: number) {
    return prisma.group.findMany({
        where: {
            studyYearId,
            semester
        },
        include: {
            studyYear: true
        },
        orderBy: {
            name: 'asc'
        }
    })
}





