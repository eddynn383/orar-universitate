import bcrypt from "bcryptjs";

export const passwordsMatch = async (password: string, userPassword: string) => {
    return await bcrypt.compare(
        password,
        userPassword
    );
}