// app/users/_components/CardActions.tsx

import { UserActions } from "../UserActions"
import { getUserById } from "@/data/user"

export async function CardActions({ userId }: { userId: string }) {
    const user = await getUserById(userId)

    if (!user) return null

    const defaultValues = {
        id: user.id,
        name: user.name ?? undefined,
        email: user.email ?? "",
        role: user.role,
        image: user.image ?? undefined
    }

    return <UserActions defaultValues={defaultValues} />
}