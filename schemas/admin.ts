import { z } from "zod"

export const adminSchema = z.object({
    // Date de bază
    firstname: z.string().min(2, "Prenumele trebuie să fie format din minim 2 caractere"),
    lastname: z.string().min(2, "Numele trebuie să fie format din minim 2 caractere"),
    email: z.string().email("Adresa de email introdusă este invalidă"),
    sex: z.enum(["MASCULIN", "FEMININ"]),
    phone: z.string().optional(),
    image: z.url("URL invalid pentru imagine").optional().nullable().or(z.literal("")),

    // Informații specifice administratorului
    department: z.string().optional(),
    adminRole: z.string().optional(),
    officePhone: z.string().optional(),
    responsibilities: z.string().optional(),
    accessLevel: z.number().int().min(1).max(5).default(1),
})

export const adminIdSchema = z.object({
    id: z.string().min(1, "ID-ul lipsește"),
})

export type CreateAdminInput = z.infer<typeof adminSchema>
