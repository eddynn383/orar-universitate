import Link from "next/link"
import { H1, H2, P } from "@/components/Typography"
import { Card, CardContent } from "@/components/Card"
import { getYearByDate } from "@/data/academicYear"
import { getLearningTypeByName } from "@/data/learningType"
import { getStudyYearsByLearningType } from "@/data/studyYear"
import { GraduationCap, Home } from "lucide-react"
import { notFound } from "next/navigation"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/Breadcrumb"

type PageProps = {
    params: Promise<{ yearId: string; learningType: string }>
}

const SEMESTERS = [
    { value: 1, name: "Semestrul 1" },
    { value: 2, name: "Semestrul 2" }
]

export default async function LearningTypePage({ params }: PageProps) {
    const { yearId, learningType } = await params

    const start = parseInt(yearId.split("-")[0])
    const end = parseInt(yearId.split("-")[1])

    // Capitalizează primul caracter pentru a căuta în DB (licenta -> Licenta)
    const learningTypeName = learningType.charAt(0).toUpperCase() + learningType.slice(1)

    const [academicYear, learningTypeData] = await Promise.all([
        getYearByDate(start, end),
        getLearningTypeByName(learningTypeName)
    ])

    if (!academicYear || !learningTypeData) {
        notFound()
    }

    // Fetch study years for this learning type
    const studyYears = await getStudyYearsByLearningType(learningTypeData.id)

    // Count events per study year for this learning type
    const getEventCountForStudyYear = (studyYearNumber: number) => {
        // This would need to be implemented based on your event structure
        // For now, we'll show total events for the learning type
        return academicYear.events?.filter(
            event => event.learningId === learningTypeData.id
        ).length || 0
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden">
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
                                <BreadcrumbPage>{learningTypeData.learningCycle}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="flex flex-col gap-2">
                        <H1 className="text-left text-2xl">
                            Anii de studiu din Master
                        </H1>
                        <P className="text-base [&:not(:first-child)]:mt-0">
                            Selectează unul din anii de studiu de mai jos
                        </P>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-8">
                <div className="max-w-7xl mx-auto">
                    <ul className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-6">
                        {studyYears
                            .sort((a, b) => a.year - b.year)
                            .map((studyYear) => {
                                return (
                                    <li key={studyYear.id} className="min-h-[120px]">

                                        <Card className="bg-primary-100 hover:bg-brand-400/20 hover:border-brand-400 transition-all duration-300 relative overflow-hidden group">
                                            <GraduationCap className="absolute size-32 top-8 -end-12 opacity-2 transition-all duration-300 group-hover:opacity-5 group-hover:-end-8" />
                                            <CardContent>
                                                <H2 className="text-xl transition-transform duration-300">
                                                    <Link href={`/orar/${yearId}/${learningType}/an/${studyYear.year}`}>
                                                        Anul {studyYear.year}
                                                    </Link>
                                                </H2>
                                                <div className="relative h-7 overflow-hidden mt-2">
                                                    <P className="absolute inset-0 transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-full">
                                                        Selectează semestrul
                                                    </P>

                                                    <div className="absolute inset-0 inline-flex items-center gap-8 text-brand-400 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
                                                        {SEMESTERS.map((semester) => {
                                                            return (
                                                                <Link
                                                                    key={semester.value}
                                                                    href={`/orar/${yearId}/${learningType}/an/${studyYear.year}/semestru/${semester.value}`}
                                                                    className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-500 transition-colors group/link"
                                                                >
                                                                    <span>{semester.name}</span>
                                                                </Link>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </li>
                                )
                            })}
                    </ul>

                    {studyYears.length === 0 && (
                        <div className="text-center py-12">
                            <P className="text-primary-500">
                                Nu există ani de studiu configurați pentru {learningTypeData.learningCycle}.
                            </P>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}