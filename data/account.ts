import prisma from "@/lib/prisma";

export const getAccountByUserId = async (userId: string) => {
    try {
        const account = await prisma.account.findFirst({
            where: { userId },
        });

        // console.log("GET ACCOUNT BY USER ID (DATA): ", account)

        return account;

    } catch {
        return null;
    }
};
