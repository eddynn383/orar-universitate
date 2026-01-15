import { z } from "zod"

export const classroomSchema = z.object({
    name: z.string().min(1, "Numele sălii este obligatoriu"),
    capacity: z.string().transform((val) => val ? parseInt(val, 10) : 0).pipe(
        z.number().min(0, "Capacitatea trebuie să fie pozitivă")
    ),
    building: z.string().optional(),
})