import { H1, H2, P } from "@/components/Typography"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card"
import { StaffOnlyServer } from "@/components/RoleGateServer"
import { getCurrentUserServer } from "@/lib/auth-server"
import { redirect } from "next/navigation"
import { BookOpen, Users, Calendar, FileText, GraduationCap, ClipboardList } from "lucide-react"
import { DisciplinesList } from "./_components/DisciplinesList"
import { UpcomingExams } from "./_components/UpcomingExams"
import { QuickActions } from "./_components/QuickActions"

export default async function ProfessorDashboardPage() {
    const user = await getCurrentUserServer()

    if (!user) {
        redirect("/login")
    }

    if (user.role !== "PROFESOR") {
        redirect("/unauthorized")
    }

    return (
        <StaffOnlyServer allowedRoles={["PROFESOR"]}>
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
                                    <UpcomingExams professorId={user.id} />

                                    {/* Recent Activity */}
                                    <Card className="bg-primary-100">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <ClipboardList className="size-5 text-brand-400" />
                                                Activitate recentă
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-primary-600">
                                                Nicio activitate recentă
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </StaffOnlyServer>
    )
}
