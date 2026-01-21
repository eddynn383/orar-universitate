"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card"
import { Calendar, MapPin, Clock, BookOpen } from "lucide-react"

type UpcomingExamsProps = {
    exams: any[]
}

export function UpcomingExams({ exams }: UpcomingExamsProps) {
    if (exams.length === 0) {
        return (
            <Card className="bg-primary-100">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Calendar className="size-5 text-brand-400" />
                        Examene viitoare
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-4">
                        <Calendar className="size-8 mx-auto mb-2 text-primary-400" />
                        <p className="text-sm text-primary-600">
                            Niciun examen programat
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-primary-100">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="size-5 text-brand-400" />
                    Examene viitoare ({exams.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {exams.slice(0, 5).map((exam) => {
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
                            <div
                                key={exam.id}
                                className="p-3 rounded-lg border border-primary-300 hover:border-brand-400 hover:bg-brand-400/5 transition-colors"
                            >
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
                                        <p className="text-xs text-primary-600 mb-2 flex items-center gap-1">
                                            <BookOpen className="size-3" />
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
                                        {exam.duration && (
                                            <p className="text-xs text-primary-600 mt-1">
                                                Durată: {exam.duration} minute
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
