"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card"
import { H3 } from "@/components/Typography"
import { BookOpen, User, FileText, Calendar } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

type MyCoursesProps = {
    disciplines: any[]
}

export function MyCourses({ disciplines }: MyCoursesProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null)

    if (disciplines.length === 0) {
        return (
            <Card className="bg-primary-100">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <BookOpen className="size-5 text-brand-400" />
                        Cursurile mele
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <BookOpen className="size-12 mx-auto mb-4 text-primary-400" />
                        <H3 className="text-lg mb-2">Niciun curs</H3>
                        <p className="text-sm text-primary-600">
                            Nu ești înscris la niciun curs momentan.
                        </p>
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
                    Cursurile mele ({disciplines.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {disciplines.map((item) => {
                        const discipline = item.discipline
                        const isExpanded = expandedId === item.id
                        const materials = discipline.courseMaterials || []
                        const nextExam = discipline.exams?.[0]

                        return (
                            <Card
                                key={item.id}
                                className="bg-primary-50 hover:bg-brand-400/10 hover:border-brand-400 transition-colors cursor-pointer"
                                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <H3 className="text-base font-semibold mb-1 truncate">
                                                {discipline.name}
                                            </H3>
                                            <div className="flex flex-wrap gap-2 text-sm text-primary-600 mb-2">
                                                {discipline.professor && (
                                                    <span className="flex items-center gap-1">
                                                        <User className="size-3" />
                                                        {discipline.professor.title && `${discipline.professor.title} `}
                                                        {discipline.professor.firstname} {discipline.professor.lastname}
                                                    </span>
                                                )}
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="size-3" />
                                                    An {discipline.studyYear?.year}, Sem. {discipline.semester}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-4 text-sm">
                                                <div className="flex items-center gap-1.5">
                                                    <FileText className="size-4 text-brand-400" />
                                                    <span className="font-medium">{materials.length}</span>
                                                    <span className="text-primary-600">
                                                        {materials.length === 1 ? "material" : "materiale"}
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

                                            {/* Expanded content - Materials */}
                                            {isExpanded && materials.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-primary-200">
                                                    <h4 className="text-sm font-semibold mb-2">Materiale disponibile:</h4>
                                                    <div className="space-y-2">
                                                        {materials.map((material: any) => (
                                                            <a
                                                                key={material.id}
                                                                href={material.fileUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 text-sm p-2 rounded hover:bg-brand-400/10 transition-colors"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <FileText className="size-4 text-brand-400 flex-shrink-0" />
                                                                <span className="flex-1 truncate">{material.title}</span>
                                                                <span className="text-xs text-primary-600">
                                                                    {material.category}
                                                                </span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
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
