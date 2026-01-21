import prisma from "@/lib/prisma"

// Asignează un student la o disciplină
export const assignStudentToDiscipline = async (data: {
    userId: string; // Student
    disciplineId: string;
}) => {
    try {
        // Verificăm dacă studentul este deja asignat
        const existing = await prisma.studentDiscipline.findFirst({
            where: {
                userId: data.userId,
                disciplineId: data.disciplineId
            }
        });

        if (existing) {
            throw new Error("Student is already assigned to this discipline");
        }

        const assignment = await prisma.studentDiscipline.create({
            data,
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
                discipline: {
                    include: {
                        professor: {
                            select: {
                                id: true,
                                firstname: true,
                                lastname: true,
                                title: true
                            }
                        },
                        studyYear: true,
                        learningType: true
                    }
                }
            }
        });

        return assignment;
    } catch (error) {
        throw new Error("Failed to assign student to discipline: " + error);
    }
};

// Asignează mai mulți studenți la o disciplină
export const assignMultipleStudentsToDiscipline = async (data: {
    userIds: string[]; // Studenți
    disciplineId: string;
}) => {
    try {
        // Verificăm care studenți nu sunt deja asignați
        const existing = await prisma.studentDiscipline.findMany({
            where: {
                userId: {
                    in: data.userIds
                },
                disciplineId: data.disciplineId
            },
            select: {
                userId: true
            }
        });

        const existingUserIds = existing.map(e => e.userId);
        const newUserIds = data.userIds.filter(id => !existingUserIds.includes(id));

        if (newUserIds.length === 0) {
            throw new Error("All students are already assigned to this discipline");
        }

        // Creăm asignările
        const assignments = await prisma.studentDiscipline.createMany({
            data: newUserIds.map(userId => ({
                userId,
                disciplineId: data.disciplineId
            }))
        });

        return {
            count: assignments.count,
            assignedUserIds: newUserIds,
            alreadyAssignedUserIds: existingUserIds
        };
    } catch (error) {
        throw new Error("Failed to assign multiple students to discipline: " + error);
    }
};

// Asignează un grup întreg la o disciplină
export const assignGroupToDiscipline = async (data: {
    groupId: string;
    disciplineId: string;
}) => {
    try {
        // Obținem toți studenții din grup
        const students = await prisma.user.findMany({
            where: {
                groupId: data.groupId,
                role: 'STUDENT'
            },
            select: {
                id: true
            }
        });

        if (students.length === 0) {
            throw new Error("No students found in this group");
        }

        const userIds = students.map(s => s.id);

        // Folosim funcția de asignare multiplă
        return await assignMultipleStudentsToDiscipline({
            userIds,
            disciplineId: data.disciplineId
        });
    } catch (error) {
        throw new Error("Failed to assign group to discipline: " + error);
    }
};

// Obține toate disciplinele unui student
export const getStudentDisciplines = async (studentId: string) => {
    try {
        const disciplines = await prisma.studentDiscipline.findMany({
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
                        },
                        studyYear: true,
                        learningType: true,
                        courseMaterials: {
                            where: {
                                isPublished: true
                            },
                            orderBy: {
                                createdAt: 'desc'
                            }
                        },
                        exams: {
                            where: {
                                isPublished: true,
                                examDate: {
                                    gte: new Date()
                                }
                            },
                            orderBy: {
                                examDate: 'asc'
                            }
                        }
                    }
                }
            },
            orderBy: {
                enrolledAt: 'desc'
            }
        });

        return disciplines;
    } catch (error) {
        throw new Error("Failed to get student disciplines: " + error);
    }
};

// Obține toți studenții asignați la o disciplină
export const getStudentsByDiscipline = async (disciplineId: string) => {
    try {
        const students = await prisma.studentDiscipline.findMany({
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
                        email: true,
                        group: {
                            include: {
                                studyYear: true,
                                learningType: true
                            }
                        },
                        grades: {
                            where: {
                                disciplineId
                            },
                            orderBy: {
                                date: 'desc'
                            }
                        }
                    }
                }
            },
            orderBy: {
                user: {
                    lastname: 'asc'
                }
            }
        });

        return students;
    } catch (error) {
        throw new Error("Failed to get students by discipline: " + error);
    }
};

// Elimină un student de la o disciplină
export const removeStudentFromDiscipline = async (userId: string, disciplineId: string) => {
    try {
        const assignment = await prisma.studentDiscipline.findFirst({
            where: {
                userId,
                disciplineId
            }
        });

        if (!assignment) {
            throw new Error("Student is not assigned to this discipline");
        }

        await prisma.studentDiscipline.delete({
            where: {
                id: assignment.id
            }
        });

        return { success: true };
    } catch (error) {
        throw new Error("Failed to remove student from discipline: " + error);
    }
};

// Verifică dacă un student poate fi asignat la o disciplină
// (verifică dacă disciplina este din același an și semestru cu grupul studentului)
export const canAssignStudentToDiscipline = async (userId: string, disciplineId: string) => {
    try {
        // Obținem informații despre student
        const student = await prisma.user.findUnique({
            where: {
                id: userId,
                role: 'STUDENT'
            },
            include: {
                group: {
                    include: {
                        studyYear: true,
                        learningType: true
                    }
                }
            }
        });

        if (!student || !student.group) {
            return {
                canAssign: false,
                reason: "Student not found or not assigned to a group"
            };
        }

        // Obținem informații despre disciplină
        const discipline = await prisma.discipline.findUnique({
            where: {
                id: disciplineId
            },
            include: {
                studyYear: true,
                learningType: true
            }
        });

        if (!discipline) {
            return {
                canAssign: false,
                reason: "Discipline not found"
            };
        }

        // Verificăm dacă anul și semestrul se potrivesc
        const sameStudyYear = student.group.studyYearId === discipline.studyYearId;
        const sameSemester = student.group.semester === discipline.semester;

        if (!sameStudyYear || !sameSemester) {
            return {
                canAssign: false,
                reason: `Discipline is for year ${discipline.studyYear.year}, semester ${discipline.semester}, but student is in year ${student.group.studyYear.year}, semester ${student.group.semester}`
            };
        }

        return {
            canAssign: true,
            reason: null
        };
    } catch (error) {
        throw new Error("Failed to check if student can be assigned: " + error);
    }
};
