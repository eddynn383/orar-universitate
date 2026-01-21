import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card"
import { Calendar, MapPin, Clock } from "lucide-react"
import { getExamsByProfessor } from "@/data/exam"
import Link from "next/link"
import { Button } from "@/components/Button"

type UpcomingExamsProps = {
    professorId: string
}

export async function UpcomingExams({ professorId }: UpcomingExamsProps) {
    const allExams = await getExamsByProfessor(professorId)

    // Filtrăm doar examenele viitoare și publicate
    const upcomingExams = allExams
        .filter(exam => new Date(exam.examDate) >= new Date() && exam.isPublished)
        .slice(0, 5) // Luăm primele 5

    return (
        <Card className="bg-primary-100">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="size-5 text-brand-400" />
                    Examene viitoare
                </CardTitle>
            </CardHeader>
            <CardContent>
                {upcomingExams.length === 0 ? (
                    <div className="text-center py-4">
                        <Calendar className="size-8 mx-auto mb-2 text-primary-400" />
                        <p className="text-sm text-primary-600">
                            Niciun examen programat
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {upcomingExams.map((exam) => {
                            const examDate = new Date(exam.examDate)
                            const isToday = examDate.toDateString() === new Date().toDateString()
                            const isTomorrow = examDate.toDateString() === new Date(Date.now() + 86400000).toDateString()

                            let dateLabel = examDate.toLocaleDateString('ro-RO', {
                                day: 'numeric',
                                month: 'short'
                            })

                            if (isToday) {
                                dateLabel = "Astăzi"
                            } else if (isTomorrow) {
                                dateLabel = "Mâine"
                            }

                            return (
                                <Link
                                    key={exam.id}
                                    href={`/profesor/examene/${exam.id}`}
                                    className="block"
                                >
                                    <div className="p-3 rounded-lg border border-primary-300 hover:border-brand-400 hover:bg-brand-400/5 transition-colors">
                                        <div className="flex items-start gap-3">
                                            {/* Date Badge */}
                                            <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center ${
                                                isToday ? 'bg-orange-100 text-orange-700' :
                                                isTomorrow ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-brand-100 text-brand-700'
                                            }`}>
                                                <span className="text-xs font-medium">
                                                    {examDate.toLocaleDateString('ro-RO', { month: 'short' })}
                                                </span>
                                                <span className="text-lg font-bold">
                                                    {examDate.getDate()}
                                                </span>
                                            </div>

                                            {/* Exam Info */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-sm mb-1 truncate">
                                                    {exam.title}
                                                </h4>
                                                <p className="text-xs text-primary-600 mb-2 truncate">
                                                    {exam.discipline.name}
                                                </p>
                                                <div className="flex flex-wrap gap-2 text-xs text-primary-600">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="size-3" />
                                                        {examDate.toLocaleTimeString('ro-RO', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                    {exam.location && (
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="size-3" />
                                                            {exam.location}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}

                        {allExams.filter(e => new Date(e.examDate) >= new Date()).length > 5 && (
                            <Link href="/profesor/examene">
                                <Button variant="text" size="S" className="w-full">
                                    Vezi toate examenele
                                </Button>
                            </Link>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
