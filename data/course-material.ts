import prisma from "@/lib/prisma"

// Creează material de curs
export const createCourseMaterial = async (data: {
    title: string;
    description?: string;
    disciplineId: string;
    fileUrl: string;
    fileName: string;
    fileSize?: number;
    mimeType?: string;
    category?: string;
    isPublished?: boolean;
    uploadedById: string;
}) => {
    try {
        const material = await prisma.courseMaterial.create({
            data,
            include: {
                discipline: true,
                uploadedBy: true
            }
        });

        return material;
    } catch (error) {
        throw new Error("Failed to create course material: " + error);
    }
};

// Obține toate materialele unei discipline
export const getCourseMaterialsByDiscipline = async (disciplineId: string) => {
    try {
        const materials = await prisma.courseMaterial.findMany({
            where: {
                disciplineId,
                isPublished: true // Doar materialele publicate
            },
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        title: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return materials;
    } catch (error) {
        throw new Error("Failed to get course materials: " + error);
    }
};

// Obține toate materialele încărcate de un profesor
export const getCourseMaterialsByProfessor = async (professorId: string) => {
    try {
        const materials = await prisma.courseMaterial.findMany({
            where: {
                uploadedById: professorId
            },
            include: {
                discipline: {
                    include: {
                        studyYear: true,
                        learningType: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return materials;
    } catch (error) {
        throw new Error("Failed to get professor's materials: " + error);
    }
};

// Obține un material după ID
export const getCourseMaterialById = async (id: string) => {
    try {
        const material = await prisma.courseMaterial.findUnique({
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
                uploadedBy: true
            }
        });

        return material;
    } catch (error) {
        throw new Error("Failed to get course material: " + error);
    }
};

// Actualizează material de curs
export const updateCourseMaterial = async (id: string, data: {
    title?: string;
    description?: string;
    category?: string;
    isPublished?: boolean;
}) => {
    try {
        const material = await prisma.courseMaterial.update({
            where: {
                id
            },
            data,
            include: {
                discipline: true,
                uploadedBy: true
            }
        });

        return material;
    } catch (error) {
        throw new Error("Failed to update course material: " + error);
    }
};

// Șterge material de curs
export const deleteCourseMaterial = async (id: string) => {
    try {
        const material = await prisma.courseMaterial.delete({
            where: {
                id
            }
        });

        return material;
    } catch (error) {
        throw new Error("Failed to delete course material: " + error);
    }
};

// Obține materiale după categorie
export const getCourseMaterialsByCategory = async (disciplineId: string, category: string) => {
    try {
        const materials = await prisma.courseMaterial.findMany({
            where: {
                disciplineId,
                category,
                isPublished: true
            },
            include: {
                uploadedBy: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        title: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return materials;
    } catch (error) {
        throw new Error("Failed to get course materials by category: " + error);
    }
};
