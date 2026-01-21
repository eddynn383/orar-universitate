import prisma from "@/lib/prisma"

// Creează examen
export const createExam = async (data: {
    title: string;
    description?: string;
    disciplineId: string;
    examDate: Date;
    duration?: number;
    location?: string;
    examType?: string;
    maxScore?: number;
    instructions?: string;
    notes?: string;
    isPublished?: boolean;
    createdById: string;
}) => {
    try {
        const exam = await prisma.exam.create({
            data,
            include: {
                discipline: {
                    include: {
                        studyYear: true,
                        learningType: true
                    }
                },
                createdBy: true
            }
        });

        return exam;
    } catch (error) {
        throw new Error("Failed to create exam: " + error);
    }
};

// Obține toate examenele unei discipline
export const getExamsByDiscipline = async (disciplineId: string) => {
    try {
        const exams = await prisma.exam.findMany({
            where: {
                disciplineId
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        title: true
                    }
                },
                grades: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstname: true,
                                lastname: true,
                                publicId: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                examDate: 'asc'
            }
        });

        return exams;
    } catch (error) {
        throw new Error("Failed to get exams: " + error);
    }
};

// Obține examene create de un profesor
export const getExamsByProfessor = async (professorId: string) => {
    try {
        const exams = await prisma.exam.findMany({
            where: {
                createdById: professorId
            },
            include: {
                discipline: {
                    include: {
                        studyYear: true,
                        learningType: true
                    }
                },
                grades: true
            },
            orderBy: {
                examDate: 'desc'
            }
        });

        return exams;
    } catch (error) {
        throw new Error("Failed to get professor's exams: " + error);
    }
};

// Obține un examen după ID
export const getExamById = async (id: string) => {
    try {
        const exam = await prisma.exam.findUnique({
            where: {
                id
            },
            include: {
                discipline: {
                    include: {
                        studyYear: true,
                        learningType: true,
                        professor: true
                    }
                },
                createdBy: true,
                grades: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstname: true,
                                lastname: true,
                                publicId: true,
                                group: true
                            }
                        }
                    },
                    orderBy: {
                        value: 'desc'
                    }
                }
            }
        });

        return exam;
    } catch (error) {
        throw new Error("Failed to get exam: " + error);
    }
};

// Actualizează examen
export const updateExam = async (id: string, data: {
    title?: string;
    description?: string;
    examDate?: Date;
    duration?: number;
    location?: string;
    examType?: string;
    maxScore?: number;
    instructions?: string;
    notes?: string;
    isPublished?: boolean;
}) => {
    try {
        const exam = await prisma.exam.update({
            where: {
                id
            },
            data,
            include: {
                discipline: true,
                createdBy: true
            }
        });

        return exam;
    } catch (error) {
        throw new Error("Failed to update exam: " + error);
    }
};

// Șterge examen
export const deleteExam = async (id: string) => {
    try {
        const exam = await prisma.exam.delete({
            where: {
                id
            }
        });

        return exam;
    } catch (error) {
        throw new Error("Failed to delete exam: " + error);
    }
};

// Obține examene viitoare pentru o disciplină
export const getUpcomingExamsByDiscipline = async (disciplineId: string) => {
    try {
        const now = new Date();
        const exams = await prisma.exam.findMany({
            where: {
                disciplineId,
                examDate: {
                    gte: now
                },
                isPublished: true
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        title: true
                    }
                }
            },
            orderBy: {
                examDate: 'asc'
            }
        });

        return exams;
    } catch (error) {
        throw new Error("Failed to get upcoming exams: " + error);
    }
};

// Obține toate examenele viitoare pentru un student (bazat pe disciplinele la care este înscris)
export const getUpcomingExamsForStudent = async (studentId: string) => {
    try {
        const now = new Date();

        // Obținem disciplinele la care este înscris studentul
        const studentDisciplines = await prisma.studentDiscipline.findMany({
            where: {
                userId: studentId
            },
            select: {
                disciplineId: true
            }
        });

        const disciplineIds = studentDisciplines.map(sd => sd.disciplineId);

        // Obținem examenele viitoare pentru aceste discipline
        const exams = await prisma.exam.findMany({
            where: {
                disciplineId: {
                    in: disciplineIds
                },
                examDate: {
                    gte: now
                },
                isPublished: true
            },
            include: {
                discipline: {
                    include: {
                        professor: {
                            select: {
                                id: true,
                                firstname: true,
                                lastname: true,
                                title: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                examDate: 'asc'
            }
        });

        return exams;
    } catch (error) {
        throw new Error("Failed to get upcoming exams for student: " + error);
    }
};
