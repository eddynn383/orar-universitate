import prisma from "@/lib/prisma"

export async function getAllClassrooms() {
    return prisma.classroom.findMany({
        orderBy: {
            name: 'asc'
        }
    })
}

export async function getClassroomById(id: string) {
    return prisma.classroom.findUnique({
        where: { id }
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