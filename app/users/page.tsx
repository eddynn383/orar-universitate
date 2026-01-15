// app/users/page.tsx

import { Avatar, AvatarFallback, AvatarImage } from "@/components/Avatar"
import { Card, CardContent } from "@/components/Card"
import { H1, H2, P } from "@/components/Typography"
import { Mail, Shield } from "lucide-react"
import { CardActions } from "./_components/CardActions"
import { CreateUserModal } from "./_components/CreateUserModal"
import { SearchInput } from "./_components/Search"
import { Suspense } from "react"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/Empty"
import { getAllUsers } from "@/data/user"

type UsersPageProps = {
    searchParams: Promise<{ search?: string }>
}

const ROLE_COLORS: Record<string, string> = {
    ADMIN: "bg-red-100 text-red-700",
    SECRETAR: "bg-blue-100 text-blue-700",
    PROFESOR: "bg-green-100 text-green-700",
    STUDENT: "bg-yellow-100 text-yellow-700",
    USER: "bg-gray-100 text-gray-700",
}

const ROLE_LABELS: Record<string, string> = {
    ADMIN: "Administrator",
    SECRETAR: "Secretar",
    PROFESOR: "Profesor",
    STUDENT: "Student",
    USER: "Utilizator",
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
    const users = await getAllUsers()
    const params = await searchParams

    // Filter users based on search query
    const searchQuery = params.search?.toLowerCase() || ""

    const filteredUsers = users.filter((user) => {
        if (!searchQuery) return true

        const name = user.name?.toLowerCase() || ""
        const email = user.email?.toLowerCase() || ""
        const role = user.role.toLowerCase()

        return (
            name.includes(searchQuery) ||
            email.includes(searchQuery) ||
            role.includes(searchQuery)
        )
    })

    return (
        <div className="content grid grid-rows-[auto_1fr] h-full overflow-hidden">
            <div className="flex flex-col items-center border-b bg-primary-200 border-primary-300 p-6">
                <div className="flex flex-col gap-1 w-full max-w-7xl">
                    <H1 className="text-left text-2xl">Utilizatori</H1>
                    <P className="text-lg [&:not(:first-child)]:mt-0">
                        Gestionează utilizatorii care au acces la aplicație
                    </P>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                <div className="flex flex-col items-center py-8 px-6">
                    <div className="flex flex-col gap-8 w-full max-w-7xl">
                        <div className="flex w-full justify-between gap-4">
                            <SearchInput placeholder="Caută utilizatori..." />
                            <CreateUserModal />
                        </div>
                        <Suspense fallback={"Loading..."}>
                            {filteredUsers.length === 0 && searchQuery ? (
                                <Empty>
                                    <EmptyHeader>
                                        <EmptyMedia variant="default">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="400" height="285" viewBox="0 0 748.974 457.275" role="img">
                                                <g id="Group_201" data-name="Group 201" transform="translate(-382.003 -195.455)">
                                                    <g id="Group_200" data-name="Group 200" transform="translate(382.003 195.455)">
                                                        <path id="Path_3120-90" data-name="Path 3120" d="M695.225,508.82,433.394,576.244a34.622,34.622,0,0,1-42.114-24.866L312.1,243.879a34.622,34.622,0,0,1,24.866-42.114l243.591-62.727L642.9,166.948l77.191,299.757A34.622,34.622,0,0,1,695.225,508.82Z" transform="translate(-311.003 -139.037)" fill="var(--primary-background-200, #f5f6f8)" />
                                                        <circle id="Ellipse_44" data-name="Ellipse 44" cx="20.355" cy="20.355" r="20.355" transform="translate(121.697 319.055)" fill="var(--accent-brand-400, #5752ff)" />
                                                    </g>
                                                    <circle id="Ellipse_44-4" data-name="Ellipse 44" cx="57.007" cy="57.007" r="57.007" transform="translate(672.542 442.858) rotate(19)" fill="var(--accent-brand-400, #5752ff)" />
                                                </g>
                                            </svg>
                                        </EmptyMedia>
                                        <EmptyTitle>Niciun rezultat</EmptyTitle>
                                        <EmptyDescription>
                                            Nu au fost găsiți utilizatori care să corespundă criteriilor "{searchQuery}"
                                        </EmptyDescription>
                                    </EmptyHeader>
                                </Empty>
                            ) : filteredUsers.length === 0 ? (
                                <Empty>
                                    <EmptyHeader>
                                        <EmptyMedia variant="icon">
                                            <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                        </EmptyMedia>
                                        <EmptyTitle>Niciun utilizator</EmptyTitle>
                                        <EmptyDescription>
                                            Nu există utilizatori înregistrați. Adaugă primul utilizator pentru a începe.
                                        </EmptyDescription>
                                    </EmptyHeader>
                                </Empty>
                            ) : (
                                <ul className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] auto-rows-min gap-6 w-full">
                                    {filteredUsers.map((user) => {
                                        const initials = user.name
                                            ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                                            : (user.email?.[0]?.toUpperCase() ?? "")

                                        return (
                                            <li key={user.id}>
                                                <Card className="bg-primary-100 hover:bg-brand-400/20 hover:border-brand-400 transition-colors relative overflow-hidden p-4 h-full">
                                                    <CardContent className="px-0">
                                                        <div className="flex gap-4 items-start">
                                                            <Avatar className="size-16 rounded-md">
                                                                <AvatarImage src={user.image || ""} />
                                                                <AvatarFallback className="rounded-md text-lg">
                                                                    {initials}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                                                <H2 className="text-lg pb-0 truncate">
                                                                    {user.name || "Utilizator"}
                                                                </H2>

                                                                {/* Role badge */}
                                                                <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${ROLE_COLORS[user.role] || ROLE_COLORS.USER}`}>
                                                                    {ROLE_LABELS[user.role] || user.role}
                                                                </span>

                                                                {/* Email */}
                                                                <div className="flex items-center gap-1.5 text-primary-600 mt-1">
                                                                    <Mail className="size-4 text-brand-400 flex-shrink-0" />
                                                                    <span className="text-sm truncate">
                                                                        {user.email}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <CardActions userId={user.id} />
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    )
}