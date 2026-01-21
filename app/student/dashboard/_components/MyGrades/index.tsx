"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card"
import { H3 } from "@/components/Typography"
import { Award, TrendingUp, TrendingDown, Minus } from "lucide-react"

type MyGradesProps = {
    grades: any[]
}

export function MyGrades({ grades }: MyGradesProps) {
    if (grades.length === 0) {
        return (
            <Card className="bg-primary-100">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Award className="size-5 text-brand-400" />
                        Notele mele
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <Award className="size-12 mx-auto mb-4 text-primary-400" />
                        <H3 className="text-lg mb-2">Nicio notă</H3>
                        <p className="text-sm text-primary-600">
                            Nu ai încă note înregistrate.
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Grupăm notele după disciplină
    const gradesByDiscipline = grades.reduce((acc: any, grade: any) => {
        const disciplineId = grade.discipline.id
        if (!acc[disciplineId]) {
            acc[disciplineId] = {
                discipline: grade.discipline,
                grades: []
            }
        }
        acc[disciplineId].grades.push(grade)
        return acc
    }, {})

    const getGradeColor = (value: number) => {
        if (value >= 9) return "text-green-600"
        if (value >= 7) return "text-blue-600"
        if (value >= 5) return "text-orange-600"
        return "text-red-600"
    }

    const getGradeTrend = (disciplineGrades: any[]) => {
        if (disciplineGrades.length < 2) return null

        const sorted = [...disciplineGrades].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        )

        const lastGrade = sorted[sorted.length - 1].value
        const prevGrade = sorted[sorted.length - 2].value

        if (lastGrade > prevGrade) return "up"
        if (lastGrade < prevGrade) return "down"
        return "same"
    }

    return (
        <Card className="bg-primary-100">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="size-5 text-brand-400" />
                    Notele mele (Total: {grades.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {Object.values(gradesByDiscipline).map((item: any) => {
                        const disciplineGrades = item.grades
                        const average = (
                            disciplineGrades.reduce((sum: number, g: any) => sum + g.value, 0) /
                            disciplineGrades.length
                        ).toFixed(2)
                        const trend = getGradeTrend(disciplineGrades)

                        return (
                            <Card key={item.discipline.id} className="bg-primary-50">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1 min-w-0">
                                            <H3 className="text-base font-semibold mb-1 truncate">
                                                {item.discipline.name}
                                            </H3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-primary-600">
                                                    Media: <span className="font-bold text-primary-900">{average}</span>
                                                </span>
                                                {trend && (
                                                    <span className="flex items-center gap-0.5">
                                                        {trend === "up" && <TrendingUp className="size-4 text-green-600" />}
                                                        {trend === "down" && <TrendingDown className="size-4 text-red-600" />}
                                                        {trend === "same" && <Minus className="size-4 text-gray-600" />}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {disciplineGrades
                                            .sort((a: any, b: any) =>
                                                new Date(b.date).getTime() - new Date(a.date).getTime()
                                            )
                                            .map((grade: any) => (
                                                <div
                                                    key={grade.id}
                                                    className="flex justify-between items-center p-2 rounded bg-primary-100/50"
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-2xl font-bold ${getGradeColor(grade.value)}`}>
                                                                {grade.value.toFixed(2)}
                                                            </span>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium">
                                                                    {grade.gradeType}
                                                                </span>
                                                                <span className="text-xs text-primary-600">
                                                                    {new Date(grade.date).toLocaleDateString('ro-RO')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {grade.feedback && (
                                                            <p className="text-xs text-primary-600 mt-1 italic">
                                                                "{grade.feedback}"
                                                            </p>
                                                        )}
                                                    </div>
                                                    {grade.professor && (
                                                        <span className="text-xs text-primary-600">
                                                            {grade.professor.title && `${grade.professor.title} `}
                                                            {grade.professor.lastname}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
