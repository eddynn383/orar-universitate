"use server"

import prisma from "@/lib/prisma";

export const setYear = async (body: any) => {
    try {

        const newYear = await prisma.academicYear.create({
            data: body
        });

        return newYear;
    } catch (error) {
        throw new Error("Failed to create a new year: " + error);
    }
};

export const getAllYears = async () => {
    try {

        const allYears = await prisma.academicYear.findMany({
            include: {
                events: true
            }
        })

        return allYears;

    } catch (error) {

        throw new Error("Failed to get all years: " + error);
    }
}

export const getYearById = async (id: string) => {
    try {

        const year = await prisma.academicYear.findUnique({
            where: {
                id
            },
            include: {
                events: true
            }
        })

        return year;

    } catch (error) {

        throw new Error("Failed to get the specific year: " + error);
    }
}

export const getYearByDate = async (start: number, end: number) => {
    try {

        const year = await prisma.academicYear.findUnique({
            where: {
                start_end: {
                    start: start,
                    end: end
                }
            },
            include: {
                events: true
            }
        })

        return year;

    } catch (error) {

        throw new Error("Failed to get the specific year: " + error);
    }
}

export const deleteYearById = async (id: string) => {
    try {
        const deletedYear = await prisma.academicYear.delete({
            where: { id }
        })



        return deletedYear;
    } catch (error) {

        throw new Error("Failed to get the specific year: " + error);
    }
}
