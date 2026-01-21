"use client"

import { Button } from "@/components/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card"
import { UserPlus, CalendarPlus, FileUp, ClipboardCheck } from "lucide-react"
import { useRouter } from "next/navigation"

type QuickActionsProps = {
    professorId: string
}

export function QuickActions({ professorId }: QuickActionsProps) {
    const router = useRouter()

    const actions = [
        {
            label: "Asignează Studenți",
            description: "Asignează studenți la disciplinele tale",
            icon: UserPlus,
            onClick: () => router.push("/profesor/asignare-studenti"),
            color: "text-blue-500"
        },
        {
            label: "Creează Examen",
            description: "Programează un nou examen",
            icon: CalendarPlus,
            onClick: () => router.push("/profesor/examene/nou"),
            color: "text-green-500"
        },
        {
            label: "Încarcă Material",
            description: "Adaugă materiale de curs",
            icon: FileUp,
            onClick: () => router.push("/profesor/materiale/nou"),
            color: "text-purple-500"
        },
        {
            label: "Adaugă Note",
            description: "Notează studenții",
            icon: ClipboardCheck,
            onClick: () => router.push("/profesor/notare"),
            color: "text-orange-500"
        }
    ]

    return (
        <Card className="bg-primary-100">
            <CardHeader>
                <CardTitle className="text-lg">Acțiuni rapide</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {actions.map((action) => {
                        const Icon = action.icon
                        return (
                            <Button
                                key={action.label}
                                variant="outline"
                                className="h-auto flex-col py-6 gap-3 hover:bg-brand-400/10 hover:border-brand-400"
                                onClick={action.onClick}
                            >
                                <Icon className={`size-8 ${action.color}`} />
                                <div className="flex flex-col gap-1 text-center">
                                    <span className="font-semibold text-sm">
                                        {action.label}
                                    </span>
                                    <span className="text-xs text-primary-600 font-normal">
                                        {action.description}
                                    </span>
                                </div>
                            </Button>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
