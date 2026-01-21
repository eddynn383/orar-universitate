import { H1, P } from "@/components/Typography"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card"
import { getCurrentUserServer } from "@/lib/auth-server"
import { redirect } from "next/navigation"
import { BookOpen, Award, Calendar, FileText, GraduationCap, Users } from "lucide-react"

// Componente Profesor
import { DisciplinesList } from "../profesor/dashboard/_components/DisciplinesList"
import { UpcomingExams as ProfessorUpcomingExams } from "../profesor/dashboard/_components/UpcomingExams"
import { QuickActions } from "../profesor/dashboard/_components/QuickActions"

// Componente Student
import { MyCourses } from "../student/dashboard/_components/MyCourses"
import { MyGrades } from "../student/dashboard/_components/MyGrades"
import { UpcomingExams as StudentUpcomingExams } from "../student/dashboard/_components/UpcomingExams"

// Data functions
import { getStudentDisciplines } from "@/data/student-discipline"
import { getGradesByStudent } from "@/data/grade"
import { getUpcomingExamsForStudent } from "@/data/exam"

export default async function DashboardPage() {
    const user = await getCurrentUserServer()

    if (!user) {
        redirect("/login")
    }

    // Redirect pentru admin/secretar către utilizatori
    if (user.role === "ADMIN" || user.role === "SECRETAR") {
        redirect("/utilizatori")
    }

    // Redirect pentru USER generic către orar
    if (user.role === "USER") {
        redirect("/orar")
    }

    // Dashboard pentru PROFESOR
    if (user.role === "PROFESOR") {
        return (
            <div className="content grid grid-rows-[auto_1fr] h-full overflow-hidden">
                {/* Header */}
                <div className="flex flex-col items-center border-b bg-primary-200 border-primary-300 p-6">
                    <div className="flex gap-2 w-full max-w-7xl">
                        <div className="flex flex-col gap-2">
                            <H1 className="text-left text-2xl">
                                Dashboard Profesor
                            </H1>
                            <P className="text-base [&:not(:first-child)]:mt-0">
                                Bine ai revenit, {user.title && `${user.title} `}
                                {user.firstname} {user.lastname}!
                            </P>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="flex flex-col items-center py-8 px-6">
                        <div className="flex flex-col gap-8 w-full max-w-7xl">
                            {/* Quick Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card className="bg-primary-100">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <BookOpen className="size-5 text-brand-400" />
                                            Discipline
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-primary-900">
                                            -
                                        </div>
                                        <p className="text-sm text-primary-600 mt-1">
                                            Discipline active
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-primary-100">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <GraduationCap className="size-5 text-brand-400" />
                                            Studenți
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-primary-900">
                                            -
                                        </div>
                                        <p className="text-sm text-primary-600 mt-1">
                                            Studenți înscriși
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-primary-100">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Calendar className="size-5 text-brand-400" />
                                            Examene
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-primary-900">
                                            -
                                        </div>
                                        <p className="text-sm text-primary-600 mt-1">
                                            Examene viitoare
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-primary-100">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <FileText className="size-5 text-brand-400" />
                                            Materiale
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-primary-900">
                                            -
                                        </div>
                                        <p className="text-sm text-primary-600 mt-1">
                                            Materiale încărcate
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Quick Actions */}
                            <QuickActions professorId={user.id} />

                            {/* Main Content Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Disciplines List - Takes 2 columns */}
                                <div className="lg:col-span-2">
                                    <DisciplinesList professorId={user.id} />
                                </div>

                                {/* Sidebar - Takes 1 column */}
                                <div className="space-y-6">
                                    {/* Upcoming Exams */}
                                    <ProfessorUpcomingExams professorId={user.id} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Dashboard pentru STUDENT
    if (user.role === "STUDENT") {
        // Obținem datele studentului
        const disciplines = await getStudentDisciplines(user.id)
        const grades = await getGradesByStudent(user.id)
        const upcomingExams = await getUpcomingExamsForStudent(user.id)

        // Calculăm statistici
        const totalCourses = disciplines.length
        const totalGrades = grades.length
        const averageGrade = totalGrades > 0
            ? (grades.reduce((sum, g) => sum + g.value, 0) / totalGrades).toFixed(2)
            : "-"

        return (
            <div className="content grid grid-rows-[auto_1fr] h-full overflow-hidden">
                {/* Header */}
                <div className="flex flex-col items-center border-b bg-primary-200 border-primary-300 p-6">
                    <div className="flex gap-2 w-full max-w-7xl">
                        <div className="flex flex-col gap-2">
                            <H1 className="text-left text-2xl">
                                Dashboard Student
                            </H1>
                            <P className="text-base [&:not(:first-child)]:mt-0">
                                Bine ai revenit, {user.firstname} {user.lastname}!
                                {user.group && ` (Grupa ${user.group.name})`}
                            </P>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="flex flex-col items-center py-8 px-6">
                        <div className="flex flex-col gap-8 w-full max-w-7xl">
                            {/* Quick Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <Card className="bg-primary-100">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <BookOpen className="size-5 text-brand-400" />
                                            Cursuri
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-primary-900">
                                            {totalCourses}
                                        </div>
                                        <p className="text-sm text-primary-600 mt-1">
                                            Cursuri înscrise
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-primary-100">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Award className="size-5 text-brand-400" />
                                            Media
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-primary-900">
                                            {averageGrade}
                                        </div>
                                        <p className="text-sm text-primary-600 mt-1">
                                            Media generală
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-primary-100">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <GraduationCap className="size-5 text-brand-400" />
                                            Note
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-primary-900">
                                            {totalGrades}
                                        </div>
                                        <p className="text-sm text-primary-600 mt-1">
                                            Note primite
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card className="bg-primary-100">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Calendar className="size-5 text-brand-400" />
                                            Examene
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-primary-900">
                                            {upcomingExams.length}
                                        </div>
                                        <p className="text-sm text-primary-600 mt-1">
                                            Examene viitoare
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Main Content Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Courses List - Takes 2 columns */}
                                <div className="lg:col-span-2 space-y-6">
                                    <MyCourses disciplines={disciplines} />
                                    <MyGrades grades={grades} />
                                </div>

                                {/* Sidebar - Takes 1 column */}
                                <div className="space-y-6">
                                    <StudentUpcomingExams exams={upcomingExams} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Fallback (nu ar trebui să ajungem aici)
    redirect("/orar")
}
