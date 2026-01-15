// data/learningType.ts

import prisma from "@/lib/prisma"

export async function getAllLearningTypes() {
    return prisma.learningType.findMany({
        include: {
            studyYears: true,
            events: true,
        },
        orderBy: {
            learningCycle: 'asc'
        }
    })
}

export async function getLearningTypeById(id: string) {
    return prisma.learningType.findUnique({
        where: { id },
        include: {
            studyYears: true,
        }
    })
}

export async function getLearningTypeByName(name: string) {
    return prisma.learningType.findFirst({
        where: {
            learningCycle: {
                equals: name,
                mode: 'insensitive'
            }
        },
        include: {
            studyYears: true,
        }
    })
}