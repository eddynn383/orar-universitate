"use server"

import prisma from "@/lib/prisma";

export const setStudyYear = async (body: any) => {
    try {

        const newStudyYear = await prisma.studyYear.create({
            data: body
        });

        return newStudyYear;
    } catch (error) {
        throw new Error("Failed to create a new studyYear: " + error);
    }
};

export async function getAllStudyYears() {
    return prisma.studyYear.findMany({
        include: {
            learningType: true
        },
        orderBy: {
            year: 'asc'
        }
    })
}

export async function getStudyYearById(id: string) {
    return prisma.studyYear.findUnique({
        where: { id },
        include: {
            learningType: true,
            studentGroups: true,
            disciplines: true
        },
    })
}

export async function getStudyYearsByLearningType(learningTypeId: string) {
    return prisma.studyYear.findMany({
        where: {
            learningTypeId
        },
        include: {
            learningType: true,
            studentGroups: true,
            disciplines: true
        },
        orderBy: {
            year: 'asc'
        }
    })
}

export async function getStudyYearByLearningTypeAndYear(learningTypeId: string, year: number) {
    return prisma.studyYear.findFirst({
        where: {
            learningTypeId,
            year
        }
    })
}

