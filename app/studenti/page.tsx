"use server"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/Avatar"
import { Card, CardContent } from "@/components/Card"
import { H1, H2, P } from "@/components/Typography"
import { getAllStudents } from "@/data/student"
import { decryptCNP, censorCNP } from "@/lib/encryption"
import { CirclePlus } from "lucide-react"
import { CardActions } from "./_components/CardActions"
import { CreateStudentModal } from "./_components/CreateStudentModal"
import { SearchInput } from "./_components/Search"
import { Suspense } from "react"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/Empty"
import { Button } from "@/components/Button"
import { AdminOnlyServer } from "@/components/RoleGateServer"

type StudentsPageProps = {
    searchParams: Promise<{ search?: string }>
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
    const students = await getAllStudents()

    const params = await searchParams

    // Filter students based on search query
    const searchQuery = params.search?.toLowerCase() || ""
    const filteredStudents = students.filter((student) => {
        if (!searchQuery) return true

        const fullName = `${student.firstname} ${student.lastname}`.toLowerCase()
        const email = student.email.toLowerCase()
        const publicId = student.publicId.toLowerCase()
        const groupName = student.group?.name?.toLowerCase() || ""

        return (
            fullName.includes(searchQuery) ||
            email.includes(searchQuery) ||
            publicId.includes(searchQuery) ||
            groupName.includes(searchQuery)
        )
    })

    return (
        <div className="content grid grid-rows-[auto_1fr] h-full overflow-hidden">
            <div className="flex flex-col items-center border-b bg-primary-200 border-primary-300 padding-l p-6">
                <div className="flex gap-4 justify-between w-full max-w-7xl">
                    <div className="flex flex-col gap-2">
                        <H1 className="text-left text-2xl">Studenți</H1>
                        <P className="text-base [&:not(:first-child)]:mt-0">Gestionează studenții din platformă</P>
                    </div>
                    <div className="flex justify-end items-end gap-4 flex-1">
                        <SearchInput />
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-center border-b border-primary-200 padding-l py-8 px-6 overflow-y-auto">
                <div className="flex flex-col gap-1 w-full max-w-7xl h-full">
                    <div className="flex flex-col gap-8 w-full">
                        <Suspense fallback={"Loading..."}>
                            {filteredStudents.length === 0 && searchQuery ? (
                                <Empty>
                                    <EmptyHeader>
                                        <EmptyMedia variant="default">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="400" height="285" viewBox="0 0 748.974 457.275" role="img">
                                                <g id="Group_201" data-name="Group 201" transform="translate(-382.003 -195.455)">
                                                    <g id="Group_200" data-name="Group 200" transform="translate(382.003 195.455)">
                                                        <path id="Path_3120-90" data-name="Path 3120" d="M695.225,508.82,433.394,576.244a34.622,34.622,0,0,1-42.114-24.866L312.1,243.879a34.622,34.622,0,0,1,24.866-42.114l243.591-62.727L642.9,166.948l77.191,299.757A34.622,34.622,0,0,1,695.225,508.82Z" transform="translate(-311.003 -139.037)" fill="var(--primary-background-200, #f5f6f8)" />
                                                        <circle id="Ellipse_44" data-name="Ellipse 44" cx="20.355" cy="20.355" r="20.355" transform="translate(121.697 319.055)" fill="var(--accent-brand-400, #5752ff)" />
                                                    </g>
                                                </g>
                                            </svg>
                                        </EmptyMedia>
                                        <EmptyTitle>Nici-un rezultat</EmptyTitle>
                                        <EmptyDescription>Nu au fost găsiți studenți care să corespundă criteriilor &quot;{searchQuery}&quot;</EmptyDescription>
                                    </EmptyHeader>
                                </Empty>
                            ) : (
                                <>
                                    {
                                        filteredStudents.length === 0 ? (
                                            <Empty>
                                                <EmptyHeader>
                                                    <EmptyMedia variant="default">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 550.71039 567.98584">
                                                            <circle cx="171.67023" cy="98.07194" r="25.65727" fill="#9e616a" />
                                                        </svg>
                                                    </EmptyMedia>
                                                    <EmptyTitle>Lista este goală pentru moment</EmptyTitle>
                                                    <EmptyDescription>Nu ai adăugat încă niciun student. Creează primul profil pentru a începe organizarea.</EmptyDescription>
                                                </EmptyHeader>
                                                <AdminOnlyServer>
                                                    <CreateStudentModal trigger={
                                                        <Button variant="brand" size="L">
                                                            <CirclePlus className="size-4" />
                                                            Crează student
                                                        </Button>
                                                    } />
                                                </AdminOnlyServer>
                                            </Empty>
                                        ) : (
                                            <ul className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] auto-rows-min gap-6 w-full mb-6">
                                                {
                                                    filteredStudents.map((student) => {
                                                        return (
                                                            <li key={student.id}>
                                                                <Card className="bg-primary-100 hover:bg-brand-400/20 hover:border-brand-400 transition-colors relative overflow-hidden p-4 h-full justify-center">
                                                                    <CardContent className="px-0">
                                                                        <div className="flex gap-4 items-center">
                                                                            <Avatar className="size-16 rounded-md">
                                                                                <AvatarImage src={student.image || ""} />
                                                                                <AvatarFallback className="rounded-md">{student.firstname.charAt(0)} {student.lastname.charAt(0)}</AvatarFallback>
                                                                            </Avatar>
                                                                            <div className="flex flex-col gap-1 flex-1">
                                                                                <P className="text-md text-primary-600">{student.publicId}</P>
                                                                                <H2 className="text-lg pb-0">{student.firstname} {student.lastname}</H2>
                                                                                {student.group && (
                                                                                    <P className="text-sm text-primary-500">
                                                                                        Grupa {student.group.name}
                                                                                    </P>
                                                                                )}
                                                                            </div>
                                                                            <AdminOnlyServer>
                                                                                <CardActions studentId={student.id} />
                                                                            </AdminOnlyServer>
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            </li>
                                                        )
                                                    })
                                                }
                                                <AdminOnlyServer>
                                                    <li key="student-create" className="min-h-[98px]">
                                                        <CreateStudentModal trigger={
                                                            <Card className="bg-primary-100 h-full p-0 hover:bg-brand-400/20 hover:border-brand-400 transition-colors cursor-pointer">
                                                                <CardContent className="h-full flex items-center justify-center p-0">
                                                                    <Button className="flex-col py-4 px-6 w-full h-full text-base" variant="text" size="L">
                                                                        <CirclePlus className="size-6" /> Adaugă student
                                                                    </Button>
                                                                </CardContent>
                                                            </Card>
                                                        } />
                                                    </li>
                                                </AdminOnlyServer>
                                            </ul>
                                        )
                                    }
                                </>
                            )}
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    )
}
