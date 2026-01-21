import prisma from "@/lib/prisma"
import { UserRole } from "@/types/global"

export const setUser = async (body: any) => {
    try {
        const newUser = await prisma.user.create({
            data: body
        });

        return newUser;
    } catch (error) {
        throw new Error("Failed to create a new user: " + error);
    }
};

export const getAllUsers = async () => {
    try {
        const allUsers = await prisma.user.findMany({
            include: {
                group: true, // Pentru studenți
                teachingDisciplines: true, // Pentru profesori
                grades: true, // Pentru studenți
            }
        })

        return allUsers

    } catch (error) {
        // console.log(error)
        throw new Error("Failed to get all users: " + error);
    }
}

// Obține useri filtrați după rol
export const getUsersByRole = async (role: UserRole) => {
    try {
        const users = await prisma.user.findMany({
            where: {
                role
            },
            include: {
                group: true, // Pentru studenți
                teachingDisciplines: {
                    include: {
                        studyYear: true,
                        learningType: true
                    }
                }, // Pentru profesori
                grades: true, // Pentru studenți
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return users
    } catch (error) {
        throw new Error("Failed to get users by role: " + error);
    }
}

// Obține toți profesorii
export const getAllProfessors = async () => {
    try {
        const professors = await prisma.user.findMany({
            where: {
                role: 'PROFESOR'
            },
            include: {
                teachingDisciplines: {
                    include: {
                        studyYear: true,
                        learningType: true
                    }
                },
            },
            orderBy: {
                lastname: 'asc'
            }
        })

        return professors
    } catch (error) {
        throw new Error("Failed to get all professors: " + error);
    }
}

// Obține toți studenții
export const getAllStudents = async () => {
    try {
        const students = await prisma.user.findMany({
            where: {
                role: 'STUDENT'
            },
            include: {
                group: {
                    include: {
                        studyYear: true,
                        learningType: true
                    }
                },
                grades: {
                    include: {
                        discipline: true,
                        exam: true
                    }
                },
                studentDisciplines: {
                    include: {
                        discipline: {
                            include: {
                                professor: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                lastname: 'asc'
            }
        })

        return students
    } catch (error) {
        throw new Error("Failed to get all students: " + error);
    }
}

// Obține studenți dintr-un grup
export const getStudentsByGroup = async (groupId: string) => {
    try {
        const students = await prisma.user.findMany({
            where: {
                role: 'STUDENT',
                groupId
            },
            include: {
                grades: {
                    include: {
                        discipline: true,
                        exam: true
                    }
                },
                studentDisciplines: {
                    include: {
                        discipline: true
                    }
                }
            },
            orderBy: {
                lastname: 'asc'
            }
        })

        return students
    } catch (error) {
        throw new Error("Failed to get students by group: " + error);
    }
}

export const getUserByEmail = async (email: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                email
            },
            include: {
                group: true,
                teachingDisciplines: true,
            }
        })

        return user

    } catch (error) {
        // console.log(error)
        throw new Error("Failed to get the user: " + error);
    }
}

export const getUserById = async (id: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                id
            },
            include: {
                group: {
                    include: {
                        studyYear: true,
                        learningType: true
                    }
                },
                teachingDisciplines: {
                    include: {
                        studyYear: true,
                        learningType: true
                    }
                },
                grades: {
                    include: {
                        discipline: true,
                        exam: true,
                        professor: true
                    }
                },
                studentDisciplines: {
                    include: {
                        discipline: {
                            include: {
                                professor: true,
                                studyYear: true
                            }
                        }
                    }
                }
            }
        })

        return user

    } catch (error) {
        // console.log(error)
        throw new Error("Failed to get the user: " + error);
    }
}

// Obține student după publicId (pentru GDPR - afișare note publice)
export const getStudentByPublicId = async (publicId: string) => {
    try {
        const student = await prisma.user.findUnique({
            where: {
                publicId,
                role: 'STUDENT'
            },
            include: {
                group: {
                    include: {
                        studyYear: true,
                        learningType: true
                    }
                },
                grades: {
                    include: {
                        discipline: true,
                        exam: true
                    },
                    orderBy: {
                        date: 'desc'
                    }
                }
            }
        })

        return student
    } catch (error) {
        throw new Error("Failed to get student by public ID: " + error);
    }
}