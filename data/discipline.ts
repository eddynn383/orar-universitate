import prisma from "@/lib/prisma"

export async function getAllDisciplines() {
    return prisma.discipline.findMany({
        include: {
            teacher: {
                include: {
                    user: {
                        select: {
                            firstname: true,
                            lastname: true,
                            image: true,
                            phone: true
                        }
                    }
                }
            },
            studyYear: true,
            learningType: true
        },
        orderBy: [
            { studyYear: { year: 'asc' } },
            { name: 'asc' }
        ]
    })
}


export async function getDisciplineById(id: string) {
    return prisma.discipline.findUnique({
        where: { id },
        include: {
            teacher: {
                include: {
                    user: {
                        select: {
                            firstname: true,
                            lastname: true,
                            image: true,
                            phone: true
                        }
                    }
                }
            },
            studyYear: true,
            learningType: true,
            createdBy: {
                select: { id: true, firstname: true, lastname: true, email: true, image: true }
            },
            updatedBy: {
                select: { id: true, firstname: true, lastname: true, email: true, image: true }
            }
        }
    })
}


export async function getDisciplinesByLearningType(learningTypeId: string) {
    return prisma.discipline.findMany({
        where: {
            learningTypeId
        },
        include: {
            teacher: {
                include: {
                    user: {
                        select: {
                            firstname: true,
                            lastname: true,
                            image: true,
                            phone: true
                        }
                    }
                }
            },
            studyYear: true
        },
        orderBy: [
            { studyYear: { year: 'asc' } },
            { name: 'asc' }
        ]
    })
}


export async function getDisciplinesByLearningTypeAndSemester(learningTypeId: string, semester: number) {
    return prisma.discipline.findMany({
        where: {
            learningTypeId,
            semester
        },
        include: {
            teacher: {
                include: {
                    user: {
                        select: {
                            firstname: true,
                            lastname: true,
                            image: true,
                            phone: true
                        }
                    }
                }
            },
            studyYear: true
        },
        orderBy: [
            { studyYear: { year: 'asc' } },
            { name: 'asc' }
        ]
    })
}


export async function getDisciplinesByTeacher(teacherId: string) {
    return prisma.discipline.findMany({
        where: {
            teacherId
        },
        include: {
            studyYear: true,
            learningType: true
        },
        orderBy: {
            name: 'asc'
        }
    })
}


export async function getDisciplinesByStudyYear(studyYearId: string) {
    return prisma.discipline.findMany({
        where: {
            studyYearId
        },
        include: {
            teacher: true
        },
        orderBy: {
            name: 'asc'
        }
    })
}


export async function getDisciplinesByStudyYearAndSemester(studyYearId: string, semester: number) {
    return prisma.discipline.findMany({
        where: {
            studyYearId,
            semester
        },
        include: {
            teacher: {
                include: {
                    user: {
                        select: {
                            firstname: true,
                            lastname: true,
                            image: true,
                            phone: true
                        }
                    }
                }
            },
            studyYear: true
        },
        orderBy: {
            name: 'asc'
        }
    })
}

