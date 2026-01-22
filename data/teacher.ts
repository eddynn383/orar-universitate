"use server"

import prisma from "@/lib/prisma";

export const setTeacher = async (body: any) => {
    try {

        const newTeacher = await prisma.teacher.create({
            data: body
        });

        return newTeacher;
    } catch (error) {
        throw new Error("Failed to create a new teacher: " + error);
    }
};

export const getAllTeachers = async () => {
    try {

        const allTeachers = await prisma.teacher.findMany({
            orderBy: [
                { user: { lastname: "asc" }, },
                { user: { firstname: "asc" }, }
            ],
            include: {
                user: true,
                events: true,
                disciplines: true
            }
        })

        return allTeachers;

    } catch (error) {

        throw new Error("Failed to get all teachers: " + error);
    }
}

export const getTeacherById = async (id: string) => {
    try {

        const teacher = await prisma.teacher.findUnique({
            where: {
                id
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true
                    }
                },
                updatedBy: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true
                    }
                }
            }
        })

        return teacher;

    } catch (error) {

        throw new Error("Failed to get the specific teacher: " + error);
    }
}