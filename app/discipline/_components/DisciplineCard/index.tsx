import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card"
import { CardActions } from "../CardActions"
import { Badge } from "@/components/Badge"
import { AdminOnlyServer } from "@/components/RoleGateServer"
import { Discipline } from '@/types/entities';

type DisciplineCardProps = {
    discipline: Discipline
}

export const DisciplineCard = ({ discipline }: DisciplineCardProps) => {
    const isLicenta = discipline.learningType?.learningCycle === "LICENTA"
    const accentColor = isLicenta ? "green" : "orange"

    return (
        <li>
            <Card className={`bg-primary-100 hover:bg-${accentColor}-500/10 hover:border-${accentColor}-500 transition-colors justify-between relative overflow-hidden h-full`}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <CardTitle className="flex flex-col gap-4 text-lg font-semibold pr-8">
                        {discipline.name}
                    </CardTitle>
                    <AdminOnlyServer>
                        <CardActions disciplineId={discipline.id} />
                    </AdminOnlyServer>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                        <Badge className="flex items-center gap-2 py-1 px-1.5 pr-3 h-9">
                            <div className="relative size-6 rounded-full overflow-hidden flex-shrink-0">
                                {discipline?.teacher?.user?.image ? (
                                    <Image
                                        src={discipline.teacher.user.image}
                                        alt={`${discipline.teacher.user.firstname} ${discipline.teacher.user.lastname}`}
                                        fill
                                        sizes="24px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="size-6 rounded-full bg-primary-200 flex items-center justify-center text-xs">
                                        {discipline?.teacher?.user?.firstname.charAt(0)}{discipline?.teacher?.user?.lastname.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <span>{discipline?.teacher?.user?.firstname} {discipline?.teacher?.user?.lastname}</span>
                        </Badge>
                        <span className="text-sm">An: {discipline?.studyYear?.year}</span>
                        <span className="text-sm">Semester: {discipline?.semester}</span>
                    </div>
                </CardContent>
            </Card>
        </li>
    )
}