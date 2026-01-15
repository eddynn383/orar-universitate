import { UserRole } from "@/app/generated/prisma/client";
import { z } from "zod";

export const LoginSchema = z.object({
    email: z.email({
        message: "Email is required!"
    }),
    password: z.string().min(1, {
        message: "Password is required!"
    }),
    // code: z.optional(z.string())
})

export const userSchema = z.object({
    name: z.string().min(1, "Numele este obligatoriu"),
    email: z.email("Email invalid"),
    role: z.nativeEnum(UserRole),
    password: z.string().min(6, "Parola trebuie să aibă cel puțin 6 caractere").optional(),
    image: z.string().optional(),
})

export const updateUserSchema = z.object({
    id: z.string().min(1, "ID-ul este obligatoriu"),
    name: z.string().min(1, "Numele este obligatoriu"),
    email: z.email("Email invalid"),
    role: z.nativeEnum(UserRole),
    password: z.string().min(6, "Parola trebuie să aibă cel puțin 6 caractere").optional().or(z.literal("")),
    image: z.string().optional(),
})