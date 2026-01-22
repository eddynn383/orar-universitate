import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card"
// import { Classroom } from "@/app/generated/prisma/client"
import { Building, Users } from "lucide-react"
import { CardActions } from "../CardActions"
import { AdminOnlyServer } from "@/components/RoleGateServer"
import { Classroom } from "@/types/entities"

type ClassroomCardProps = {
    classroom: Classroom
}

export function ClassroomCard({ classroom }: ClassroomCardProps) {
    return (
        <Card className="gap-4 hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">
                    {classroom.name}
                </CardTitle>
                <AdminOnlyServer>
                    <CardActions classroomId={classroom.id} />
                </AdminOnlyServer>
            </CardHeader>
            <CardContent>
                <div className="flex gap-6 text-sm text-gray-600">
                    {classroom.building && (
                        <div className="flex items-center gap-2">
                            <Building className="size-4" />
                            <span>{classroom.building}</span>
                        </div>
                    )}
                    {classroom.capacity !== null && classroom.capacity > 0 && (
                        <div className="flex items-center gap-2">
                            <Users className="size-4" />
                            <span>{classroom.capacity} locuri</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}