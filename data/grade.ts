import prisma from "@/lib/prisma"

// Adaugă notă
export const createGrade = async (data: {
    value: number;
    gradeType: string;
    date?: Date;
    feedback?: string;
    userId: string; // Student
    disciplineId: string;
    examId?: string;
    professorId: string; // Profesor care dă nota
}) => {
    try {
        const grade = await prisma.grade.create({
            data,
            include: {
                user: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        publicId: true
                    }
                },
                discipline: true,
                exam: true,
                professor: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        title: true
                    }
                }
            }
        });

        return grade;
    } catch (error) {
        throw new Error("Failed to create grade: " + error);
    }
};

// Obține notele unui student
export const getGradesByStudent = async (studentId: string) => {
    try {
        const grades = await prisma.grade.findMany({
            where: {
                userId: studentId
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
                },
                exam: true,
                professor: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        title: true
                    }
                }
            },
            orderBy: {
                date: 'desc'
            }
        });

        return grades;
    } catch (error) {
        throw new Error("Failed to get student grades: " + error);
    }
};

// Obține notele pentru o disciplină
export const getGradesByDiscipline = async (disciplineId: string) => {
    try {
        const grades = await prisma.grade.findMany({
            where: {
                disciplineId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        publicId: true,
                        group: true
                    }
                },
                exam: true,
                professor: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        title: true
                    }
                }
            },
            orderBy: [
                {
                    user: {
                        lastname: 'asc'
                    }
                },
                {
                    date: 'desc'
                }
            ]
        });

        return grades;
    } catch (error) {
        throw new Error("Failed to get discipline grades: " + error);
    }
};

// Obține notele pentru un examen
export const getGradesByExam = async (examId: string) => {
    try {
        const grades = await prisma.grade.findMany({
            where: {
                examId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        publicId: true,
                        group: true
                    }
                },
                professor: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        title: true
                    }
                }
            },
            orderBy: {
                value: 'desc'
            }
        });

        return grades;
    } catch (error) {
        throw new Error("Failed to get exam grades: " + error);
    }
};

// Obține nota unui student la o disciplină
export const getGradeByStudentAndDiscipline = async (studentId: string, disciplineId: string) => {
    try {
        const grades = await prisma.grade.findMany({
            where: {
                userId: studentId,
                disciplineId
            },
            include: {
                exam: true,
                professor: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        title: true
                    }
                }
            },
            orderBy: {
                date: 'desc'
            }
        });

        return grades;
    } catch (error) {
        throw new Error("Failed to get student grade for discipline: " + error);
    }
};

// Actualizează notă
export const updateGrade = async (id: string, data: {
    value?: number;
    gradeType?: string;
    date?: Date;
    feedback?: string;
}) => {
    try {
        const grade = await prisma.grade.update({
            where: {
                id
            },
            data,
            include: {
                user: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        publicId: true
                    }
                },
                discipline: true,
                exam: true,
                professor: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        title: true
                    }
                }
            }
        });

        return grade;
    } catch (error) {
        throw new Error("Failed to update grade: " + error);
    }
};

// Șterge notă
export const deleteGrade = async (id: string) => {
    try {
        const grade = await prisma.grade.delete({
            where: {
                id
            }
        });

        return grade;
    } catch (error) {
        throw new Error("Failed to delete grade: " + error);
    }
};

// Calculează media unui student la o disciplină
export const calculateAverageGrade = async (studentId: string, disciplineId: string) => {
    try {
        const grades = await prisma.grade.findMany({
            where: {
                userId: studentId,
                disciplineId
            },
            select: {
                value: true,
                gradeType: true
            }
        });

        if (grades.length === 0) {
            return null;
        }

        // Calculăm media ponderată (de exemplu, examenele pot avea o pondere mai mare)
        const weights: { [key: string]: number } = {
            'Examen': 0.5,
            'Colocviu': 0.3,
            'Laborator': 0.1,
            'Prezentare': 0.05,
            'Activitate': 0.05
        };

        let totalWeight = 0;
        let weightedSum = 0;

        grades.forEach(grade => {
            const weight = weights[grade.gradeType] || 0.1;
            weightedSum += grade.value * weight;
            totalWeight += weight;
        });

        const average = totalWeight > 0 ? weightedSum / totalWeight : 0;

        return {
            average: parseFloat(average.toFixed(2)),
            totalGrades: grades.length
        };
    } catch (error) {
        throw new Error("Failed to calculate average grade: " + error);
    }
};
