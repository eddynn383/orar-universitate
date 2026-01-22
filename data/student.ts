"use server"

import prisma from "@/lib/prisma"

export const setStudent = async (body: any) => {
    try {
        const newStudent = await prisma.student.create({
            data: body,
        })

        return newStudent
    } catch (error) {
        throw new Error("Failed to create a new student: " + error)
    }
}

export const getAllStudents = async () => {
    try {
        const allStudents = await prisma.student.findMany({
            orderBy: [{ user: { lastname: "asc" } }, { user: { firstname: "asc" } }],
            include: {
                user: true,
                group: {
                    include: {
                        studyYear: true,
                        learningType: true,
                    },
                },
                grades: {
                    include: {
                        discipline: true,
                    },
                },
                studentDiscipline: {
                    include: {
                        discipline: true,
                    },
                },
            },
        })

        return allStudents
    } catch (error) {
        throw new Error("Failed to get all students: " + error)
    }
}

export const getStudentById = async (id: string) => {
    try {
        const student = await prisma.student.findUnique({
            where: {
                id,
            },
            include: {
                user: {
                    select: {
                        firstname: true,
                        lastname: true,
                        image: true,
                        sex: true
                    }
                },
                group: {
                    include: {
                        studyYear: true,
                        learningType: true,
                    },
                },
                grades: {
                    include: {
                        discipline: true,
                    },
                },
                studentDiscipline: {
                    include: {
                        discipline: true,
                    },
                },
            },
        })

        return student
    } catch (error) {
        throw new Error("Failed to get the specific student: " + error)
    }
}

export const getStudentByPublicId = async (publicId: string) => {
    try {
        const student = await prisma.student.findUnique({
            where: {
                publicId,
            },
            include: {
                grades: {
                    include: {
                        discipline: true,
                    },
                },
            },
        })

        return student
    } catch (error) {
        throw new Error("Failed to get student by public ID: " + error)
    }
}
