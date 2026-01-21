"use client"

import { Button } from "@/components/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card"
import { UserPlus, CalendarPlus, FileUp, ClipboardCheck } from "lucide-react"

type QuickActionsProps = {
    professorId: string
}

export function QuickActions({ professorId }: QuickActionsProps) {
    const actions = [
        {
            label: "Asignează Studenți",
            description: "Funcționalitate în dezvoltare",
            icon: UserPlus,
            color: "text-blue-500"
        },
        {
            label: "Creează Examen",
            description: "Funcționalitate în dezvoltare",
            icon: CalendarPlus,
            color: "text-green-500"
        },
        {
            label: "Încarcă Material",
            description: "Funcționalitate în dezvoltare",
            icon: FileUp,
            color: "text-purple-500"
        },
        {
            label: "Adaugă Note",
            description: "Funcționalitate în dezvoltare",
            icon: ClipboardCheck,
            color: "text-orange-500"
        }
    ]

    return (
        <Card className="bg-primary-100">
            <CardHeader>
                <CardTitle className="text-lg">Acțiuni rapide (În curând)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {actions.map((action) => {
                        const Icon = action.icon
                        return (
                            <Button
                                key={action.label}
                                variant="outline"
                                className="h-auto flex-col py-6 gap-3 opacity-60 cursor-not-allowed"
                                disabled
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
