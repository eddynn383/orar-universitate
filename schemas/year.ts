import { z } from "zod"

export const yearSchema = z.object({
    start: z.string().transform((val) => parseInt(val, 10)).pipe(
        z.number().min(2000, "Anul de început trebuie să fie valid")
    ),
    end: z.string().transform((val) => parseInt(val, 10)).pipe(
        z.number().min(2000, "Anul de sfârșit trebuie să fie valid")
    ),
})