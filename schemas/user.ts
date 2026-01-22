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
    firstname: z.string().min(1, "Prenumele este obligatoriu"),
    lastname: z.string().min(1, "Numele de familie este obligatoriu"),
    email: z.email("Email invalid"),
    role: z.enum(UserRole),
    password: z.string().min(6, "Parola trebuie să aibă cel puțin 6 caractere").optional(),
    image: z.string().optional(),
    sex: z.enum(["MASCULIN", "FEMININ"]).refine(val => val !== undefined, {
        message: "Te rog să selectezi sexul",
    }),
})

export const updateUserSchema = z.object({
    id: z.string().min(1, "ID-ul este obligatoriu"),
    firstname: z.string().min(1, "Prenumele este obligatoriu"),
    lastname: z.string().min(1, "Numele de familie este obligatoriu"),
    email: z.email("Email invalid"),
    role: z.nativeEnum(UserRole),
    password: z.string().min(6, "Parola trebuie să aibă cel puțin 6 caractere").optional().or(z.literal("")),
    image: z.string().optional(),
})