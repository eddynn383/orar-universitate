"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/Avatar"
import { Card, CardContent } from "@/components/Card"
import { H2, P } from "@/components/Typography"
import { Checkbox } from "@/components/Checkbox"
import { useStudentSelection } from "./StudentSelectionContext"
import { cn } from "@/lib/utils"

type Student = {
    id: string
    publicId: string
    email: string
    user: {
        firstname: string
        lastname: string
        image: string | null
    } | null
    group: {
        id: string
        name: string
    } | null
}

type SelectableStudentCardProps = {
    student: Student
    showCheckbox: boolean
    children?: React.ReactNode
}

export function SelectableStudentCard({
    student,
    showCheckbox,
    children,
}: SelectableStudentCardProps) {
    const { isSelected, toggleSelection } = useStudentSelection()
    const selected = isSelected(student.id)

    const handleCardClick = () => {
        if (showCheckbox) {
            toggleSelection(student.id)
        }
    }

    const handleCheckboxClick = (e: React.MouseEvent) => {
        e.stopPropagation()
    }

    return (
        <Card
            className={cn(
                "bg-primary-100 hover:bg-brand-400/20 hover:border-brand-400 transition-colors relative overflow-hidden p-4 h-full justify-center",
                showCheckbox && "cursor-pointer",
                selected && "bg-brand-400/20 border-brand-400"
            )}
            onClick={handleCardClick}
        >
            <CardContent className="px-0">
                <div className="flex gap-4 items-center">
                    {showCheckbox && (
                        <div onClick={handleCheckboxClick}>
                            <Checkbox
                                checked={selected}
                                onCheckedChange={() => toggleSelection(student.id)}
                                className="data-[state=checked]:bg-brand-400 data-[state=checked]:border-brand-400"
                            />
                        </div>
                    )}
                    <Avatar className="size-16 rounded-md">
                        <AvatarImage src={student.user?.image || ""} />
                        <AvatarFallback className="rounded-md">
                            {student.user?.firstname.charAt(0)} {student.user?.lastname.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1 flex-1">
                        <P className="text-md text-primary-600">{student.publicId}</P>
                        <H2 className="text-lg pb-0">
                            {student.user?.firstname} {student.user?.lastname}
                        </H2>
                        {student.group && (
                            <P className="text-sm text-primary-500">
                                Grupa {student.group.name}
                            </P>
                        )}
                    </div>
                    {children}
                </div>
            </CardContent>
        </Card>
    )
}
