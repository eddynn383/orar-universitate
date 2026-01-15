import Link from "next/link"
import { H1, H2, P } from "@/components/Typography"
import { Card, CardContent } from "@/components/Card"
import { getYearByDate } from "@/data/academicYear"
import { getAllLearningTypes } from "@/data/learningType"
import { Home, GraduationCap } from "lucide-react"
import { notFound } from "next/navigation"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/Breadcrumb"

type PageProps = {
    params: Promise<{ yearId: string }>
}

const SEMESTERS = [
    { value: 1, name: "Semestrul 1" },
    { value: 2, name: "Semestrul 2" }
]

export default async function YearIdPage({ params }: PageProps) {
    const { yearId } = await params

    const start = parseInt(yearId.split("-")[0])
    const end = parseInt(yearId.split("-")[1])

    const [academicYear, learningTypes] = await Promise.all([
        getYearByDate(start, end),
        getAllLearningTypes()
    ])

    if (!academicYear) {
        notFound()
    }

    // Count events per learning type and semester
    const getEventCount = (learningTypeId: string, semester?: number) => {
        return academicYear.events?.filter(event => {
            const matchesLearningType = event.learningId === learningTypeId
            if (semester) {
                return matchesLearningType && event.semester === semester
            }
            return matchesLearningType
        }).length || 0
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
                                <BreadcrumbPage>{yearId}</BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div className="flex flex-col gap-2">
                        <H1 className="text-left text-2xl">
                            {/* An universitar {academicYear.start} - {academicYear.end} */}
                            Tipurile de invățământ din anul universitar {academicYear.start} - {academicYear.end}
                        </H1>
                        <P className="text-base [&:not(:first-child)]:mt-0">
                            Selectează unul din tipurile de invățământ de mai jos
                        </P>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="max-w-7xl mx-auto">
                    <ul className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6">
                        {learningTypes.map((learningType) => {
                            const totalEventCount = getEventCount(learningType.id)
                            const learningTypeSlug = learningType.learningCycle.toLowerCase()

                            return (
                                <li key={learningType.id} className="min-h-[120px]">

                                    <Card className="bg-primary-100 hover:bg-brand-400/20 hover:border-brand-400 transition-all duration-300 relative overflow-hidden group h-full">
                                        <GraduationCap className="absolute size-32 top-8 -end-12 opacity-2 transition-all duration-300 group-hover:opacity-5 group-hover:-end-8" />
                                        <CardContent className="h-full">
                                            <H2 className="text-xl transition-transform duration-300">
                                                <Link href={`/orar/${yearId}/${learningTypeSlug}`}>
                                                    {learningType.learningCycle}
                                                </Link>
                                            </H2>
                                            <div className="relative h-7 overflow-hidden mt-2">
                                                {/* Evenimente - Slide up și fade out */}
                                                <P className="absolute inset-0 transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-full">
                                                    <span className="text-lg">{totalEventCount}</span> Evenimente
                                                </P>

                                                {/* Semestre - Slide up și fade in */}
                                                <div className="absolute inset-0 flex items-center gap-8 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
                                                    {
                                                        learningType.studyYears.map((studyYear) => {
                                                            return (
                                                                <Link
                                                                    key={studyYear.id}
                                                                    href={`/orar/${yearId}/${learningTypeSlug}/an/${studyYear.year}`}
                                                                    className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-500 transition-colors group/link"
                                                                >
                                                                    <span>Anul {studyYear.year}</span>

                                                                </Link>
                                                            )
                                                        })
                                                    }
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </li>
                            )
                        })}
                    </ul>
                </div>
            </div>
        </div >
    )
}

