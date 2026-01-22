// app/users/_components/CardActions.tsx

import { UserActions } from "../UserActions"
import { getUserById } from "@/data/user"

export async function CardActions({ userId }: { userId: string }) {
    const user = await getUserById(userId)

    if (!user) return null

    const defaultValues = {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email ?? "",
        role: user.role,
        image: user.image ?? undefined
    }

    return <UserActions defaultValues={defaultValues} />
}