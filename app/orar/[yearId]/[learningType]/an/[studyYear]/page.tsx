import Link from "next/link"
import { H1, H2, P } from "@/components/Typography"
import { Card, CardContent } from "@/components/Card"
import { getYearByDate } from "@/data/academicYear"
import { getLearningTypeByName } from "@/data/learningType"
import { getStudyYearByLearningTypeAndYear } from "@/data/studyYear"
import { Calendar, Home } from "lucide-react"
import { notFound } from "next/navigation"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/Breadcrumb"

type PageProps = {
    params: Promise<{ yearId: string; learningType: string; studyYear: string }>
}

const SEMESTERS = [
    { value: 1, name: "Semestrul 1" },
    { value: 2, name: "Semestrul 2" }
]

export default async function StudyYearPage({ params }: PageProps) {
    const { yearId, learningType, studyYear } = await params

    const start = parseInt(yearId.split("-")[0])
    const end = parseInt(yearId.split("-")[1])
    const studyYearNumber = parseInt(studyYear)

    // Capitalizează primul caracter pentru a căuta în DB (licenta -> Licenta)
    const learningTypeName = learningType.charAt(0).toUpperCase() + learningType.slice(1)

    const [academicYear, learningTypeData] = await Promise.all([
        getYearByDate(start, end),
        getLearningTypeByName(learningTypeName)
    ])

    if (!academicYear || !learningTypeData) {
        notFound()
    }

    // Fetch the specific study year
    const studyYearData = await getStudyYearByLearningTypeAndYear(learningTypeData.id, studyYearNumber)

    if (!studyYearData) {
        notFound()
    }

    // Count events per semester for this study year
    // Note: This assumes events have a way to be linked to study years through groups or disciplines
    const getEventCountForSemester = (semester: number) => {
        return academicYear.events?.filter(
            event => event.semester === semester && event.learningId === learningTypeData.id
        ).length || 0
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            {/* Header - Fixed */}
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
                                <BreadcrumbPage>Anul {studyYearNumber}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="flex flex-col gap-2">
                        <H1 className="text-left text-2xl">
                            Semestrele din anul {studyYearNumber}
                        </H1>
                        <P className="text-base [&:not(:first-child)]:mt-0">
                            Selectează unul din semestrele de mai jos pentru a vizualiza orarul
                        </P>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-8">
                <div className="max-w-7xl mx-auto">
                    <ul className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6">
                        {SEMESTERS.map((semester) => {
                            const eventCount = getEventCountForSemester(semester.value)

                            return (
                                <li key={semester.value} className="min-h-[120px]">
                                    <Link href={`/orar/${yearId}/${learningType}/an/${studyYear}/semestru/${semester.value}`}>
                                        <Card className="bg-primary-100 hover:bg-brand-400/20 hover:border-brand-400 transition-all duration-300 relative overflow-hidden group">
                                            <Calendar className="absolute size-32 top-8 -end-12 opacity-2 transition-all duration-300 group-hover:opacity-5 group-hover:-end-8" />
                                            <CardContent>
                                                <H2 className="text-xl transition-transform duration-300">
                                                    {semester.name}
                                                </H2>
                                                <div className="relative h-7 overflow-hidden mt-2">
                                                    {/* Evenimente - Slide up și fade out */}
                                                    <P className="absolute inset-0 transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-full">
                                                        <span className="text-lg">{eventCount}</span> Evenimente
                                                    </P>

                                                    {/* Deschide - Slide up și fade in */}
                                                    <span className="absolute inset-0 inline-flex items-center gap-0 text-brand-400 translate-y-full opacity-0 group-hover:gap-1 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
                                                        Accesează orar
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </div>
        </div>
    )
}