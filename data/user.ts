import prisma from "@/lib/prisma"

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
        const allUsers = await prisma.user.findMany()

        return allUsers

    } catch (error) {
        // console.log(error)
        throw new Error("Failed to get all users: " + error);
    }
}

export const getUserByEmail = async (email: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                email
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
            }
        })

        return user

    } catch (error) {
        // console.log(error)
        throw new Error("Failed to get the user: " + error);
    }
}