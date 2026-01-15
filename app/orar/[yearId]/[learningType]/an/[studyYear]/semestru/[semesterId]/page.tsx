import { H1 } from "@/components/Typography";
import { CalendarManager } from "./_components/CalendarManager";
import { getYearByDate } from "@/data/academicYear";
import { getLearningTypeByName } from "@/data/learningType";
import { getStudyYearByLearningTypeAndYear } from "@/data/studyYear";
import { getGroupsByStudyYearAndSemester } from "@/data/group";
import { getAllClassrooms } from "@/data/classroom";
import { getAllTeachers } from "@/data/teacher";
import { getDisciplinesByStudyYearAndSemester } from "@/data/discipline";
import { getEventsByAcademicYearSemesterLearningTypeAndStudyYear } from "@/data/event";
import { transformEventsToCalendarEntries } from "@/lib/event-utils";
import { redirect, notFound } from "next/navigation"
import { Home } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/Breadcrumb";

type ParamsProps = Promise<{
    yearId: string
    learningType: string
    studyYear: string
    semesterId: string
}>

export default async function SemesterPage({
    params,
}: {
    params: ParamsProps
}) {
    const { yearId, learningType, studyYear, semesterId } = await params

    const start = parseInt(yearId.split("-")[0])
    const end = parseInt(yearId.split("-")[1])
    const studyYearNumber = parseInt(studyYear)
    const semester = parseInt(semesterId)

    // Capitalizează primul caracter pentru a căuta în DB
    const learningTypeName = learningType.charAt(0).toUpperCase() + learningType.slice(1)

    // Fetch base data in parallel
    const [
        currentYear,
        learningTypeData,
        classrooms,
        teachers,
    ] = await Promise.all([
        getYearByDate(start, end),
        getLearningTypeByName(learningTypeName),
        getAllClassrooms(),
        getAllTeachers(),
    ])

    if (!currentYear || !learningTypeData) {
        redirect("/orar")
    }

    // Fetch study year data
    const studyYearData = await getStudyYearByLearningTypeAndYear(learningTypeData.id, studyYearNumber)

    if (!studyYearData) {
        notFound()
    }

    // Fetch data filtered by study year AND semester
    const [groups, disciplines, events] = await Promise.all([
        getGroupsByStudyYearAndSemester(studyYearData.id, semester),
        getDisciplinesByStudyYearAndSemester(studyYearData.id, semester),
        getEventsByAcademicYearSemesterLearningTypeAndStudyYear(
            currentYear.id,
            semester,
            learningTypeData.id,
            studyYearData.id
        ),
    ])

    // Transform events to CalendarEntry format
    const calendarEntries = transformEventsToCalendarEntries(events as any)

    return (
        <div className="content grid grid-rows-[auto_1fr] h-full overflow-hidden">
            <div className="flex flex-col items-center border-b bg-primary-200 border-primary-300 padding-l p-6">
                <div className="flex flex-col gap-4 w-full max-w-7xl">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/orar"><Home size="14" /></BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href={`/orar/${yearId}`}>
                                    {yearId}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href={`/orar/${yearId}/${learningType}`}>
                                    {learningTypeData.learningCycle}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink href={`/orar/${yearId}/${learningType}/an/${studyYear}`}>
                                    Anul {studyYearNumber}
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage>
                                    Semestrul {semesterId}
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <H1 className="text-left text-2xl">
                        {learningTypeData.learningCycle} - Anul {studyYearNumber} - Semestrul {semesterId}
                    </H1>
                </div>
            </div>

            <div className="flex flex-col items-center border-b border-primary-200 padding-l py-8 px-4 overflow-hidden">
                <div className="grid grid-rows-[auto_1fr] gap-4 w-full max-w-7xl overflow-hidden">
                    <CalendarManager
                        yearId={currentYear.id}
                        semester={semester}
                        learningTypeId={learningTypeData.id}
                        studyYearId={studyYearData.id}
                        groups={groups}
                        classrooms={classrooms}
                        teachers={teachers}
                        disciplines={disciplines}
                        initialEntries={calendarEntries}
                    />
                </div>
            </div>
        </div>
    )
}