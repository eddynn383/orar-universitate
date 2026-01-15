import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { ProfileForm } from "./_components/ProfileForm"
import { H1, P } from "@/components/Typography"

export default async function ProfilePage() {
    const session = await auth()

    if (!session?.user?.id) {
        redirect("/login")
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            phone: true,
            address: true,
            city: true,
            country: true,
            bio: true,
            role: true,
            createdAt: true,
        }
    })

    if (!user) {
        redirect("/login")
    }

    return (
        <div className="content grid grid-rows-[auto_1fr] h-full overflow-hidden">
            <div className="flex flex-col items-center border-b bg-primary-200 border-primary-300 padding-l p-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-end w-full max-w-7xl">
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                        <H1 className="text-left text-2xl">Profilul meu</H1>
                        <P className="text-base [&:not(:first-child)]:mt-0">Actualizează informațiile tale personale</P>
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-center border-b border-primary-200 padding-l py-8 px-6 overflow-y-auto">
                <div className="flex flex-col gap-1 w-full max-w-7xl h-full">
                    <div className="flex flex-col gap-8 w-full">
                        <ProfileForm user={user} />
                    </div>
                </div>
            </div>
        </div>
    )
}