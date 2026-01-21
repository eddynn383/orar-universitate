import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card"
import { H3, P } from "@/components/Typography"
import { BookOpen, Users, Calendar, FileText, ArrowRight } from "lucide-react"
import { Button } from "@/components/Button"
import Link from "next/link"
import prisma from "@/lib/prisma"

type DisciplinesListProps = {
    professorId: string
}

export async function DisciplinesList({ professorId }: DisciplinesListProps) {
    // Obținem disciplinele profesorului
    const disciplines = await prisma.discipline.findMany({
        where: {
            professorId
        },
        include: {
            studyYear: true,
            learningType: true,
            students: {
                where: {
                    userId: {
                        not: null
                    }
                },
                include: {
                    user: true
                }
            },
            exams: {
                where: {
                    examDate: {
                        gte: new Date()
                    },
                    isPublished: true
                },
                orderBy: {
                    examDate: 'asc'
                },
                take: 1
            },
            courseMaterials: {
                where: {
                    isPublished: true
                }
            }
        },
        orderBy: {
            name: 'asc'
        }
    })

    if (disciplines.length === 0) {
        return (
            <Card className="bg-primary-100">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="size-5 text-brand-400" />
                        Disciplinele mele
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <BookOpen className="size-12 mx-auto mb-4 text-primary-400" />
                        <H3 className="text-lg mb-2">Nicio disciplină</H3>
                        <P className="text-primary-600">
                            Nu ai discipline asignate momentan. Contactează un administrator pentru a-ți asigna discipline.
                        </P>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-primary-100">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <BookOpen className="size-5 text-brand-400" />
                    Disciplinele mele ({disciplines.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {disciplines.map((discipline) => {
                        const studentCount = discipline.students.length
                        const nextExam = discipline.exams[0]
                        const materialCount = discipline.courseMaterials.length

                        return (
                            <Card key={discipline.id} className="bg-primary-50 hover:bg-brand-400/10 hover:border-brand-400 transition-colors">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <H3 className="text-base font-semibold mb-1 truncate">
                                                {discipline.name}
                                            </H3>
                                            <div className="flex flex-wrap gap-2 text-sm text-primary-600 mb-3">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="size-3" />
                                                    An {discipline.studyYear.year}, Sem. {discipline.semester}
                                                </span>
                                                {discipline.learningType && (
                                                    <span>• {discipline.learningType.learningCycle}</span>
                                                )}
                                            </div>

                                            {/* Stats */}
                                            <div className="flex flex-wrap gap-4 text-sm">
                                                <div className="flex items-center gap-1.5">
                                                    <Users className="size-4 text-brand-400" />
                                                    <span className="font-medium">{studentCount}</span>
                                                    <span className="text-primary-600">
                                                        {studentCount === 1 ? "student" : "studenți"}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <FileText className="size-4 text-brand-400" />
                                                    <span className="font-medium">{materialCount}</span>
                                                    <span className="text-primary-600">
                                                        {materialCount === 1 ? "material" : "materiale"}
                                                    </span>
                                                </div>
                                                {nextExam && (
                                                    <div className="flex items-center gap-1.5 text-orange-600">
                                                        <Calendar className="size-4" />
                                                        <span className="font-medium">
                                                            Examen: {new Date(nextExam.examDate).toLocaleDateString('ro-RO')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <Link href={`/profesor/discipline/${discipline.id}`}>
                                            <Button variant="text" size="S" className="gap-1">
                                                Detalii
                                                <ArrowRight className="size-4" />
                                            </Button>
                                        </Link>
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
