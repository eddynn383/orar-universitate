import prisma from "@/lib/prisma"

export async function getAllClassrooms() {
    return prisma.classroom.findMany({
        orderBy: {
            name: 'asc'
        },
        include: {
            createdBy: {
                select: {
                    id: true,
                    firstname: true,
                    lastname: true,
                }
            },
            updatedBy: {
                select: {
                    id: true,
                    firstname: true,
                    lastname: true,
                }
            }
        }
    })
}

export async function getClassroomById(id: string) {
    return prisma.classroom.findUnique({
        where: { id },
        include: {
            createdBy: {
                select: {
                    id: true,
                    firstname: true,
                    lastname: true,
                }
            },
            updatedBy: {
                select: {
                    id: true,
                    firstname: true,
                    lastname: true,
                }
            }
        }
    })
}

export async function getClassroomsByBuilding(building: string) {
    return prisma.classroom.findMany({
        where: { building },
        orderBy: {
            name: 'asc'
        }
    })
}