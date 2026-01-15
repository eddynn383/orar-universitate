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
                { lastname: "asc" },
                { firstname: "asc" }
            ],
            include: {
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
            }
        })

        return teacher;

    } catch (error) {

        throw new Error("Failed to get the specific teacher: " + error);
    }
}