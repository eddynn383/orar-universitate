"use client"

import {
    StudentSelectionProvider,
    BulkActionToolbar,
    SelectableStudentCard,
    SelectAllCheckbox,
} from "../BulkAssign"

type Student = {
    id: string
    publicId: string
    email: string
    user: {
        firstname: string
        lastname: string
        image: string | null
    } | null
    group: {
        id: string
        name: string
    } | null
}

type GroupWithDetails = {
    id: string
    name: string
    group: number
    semester: number
    studyYear: {
        id: string
        year: number
    } | null
    learningType: {
        id: string
        learningCycle: string
    } | null
}

type StudentListWithSelectionProps = {
    students: Student[]
    groups: GroupWithDetails[]
    canManage: boolean
    createModal: React.ReactNode
    cardActions: Record<string, React.ReactNode>
}

export function StudentListWithSelection({
    students,
    groups,
    canManage,
    createModal,
    cardActions,
}: StudentListWithSelectionProps) {
    const studentIds = students.map((s) => s.id)

    return (
        <StudentSelectionProvider>
            {canManage && students.length > 0 && (
                <div className="flex items-center justify-between mb-4">
                    <SelectAllCheckbox studentIds={studentIds} />
                </div>
            )}

            <ul className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] auto-rows-min gap-6 w-full mb-6">
                {students.map((student) => (
                    <li key={student.id}>
                        <SelectableStudentCard
                            student={student}
                            showCheckbox={canManage}
                        >
                            {canManage && cardActions[student.id]}
                        </SelectableStudentCard>
                    </li>
                ))}
                {canManage && (
                    <li key="student-create" className="min-h-[98px]">
                        {createModal}
                    </li>
                )}
            </ul>

            {canManage && <BulkActionToolbar groups={groups} />}
        </StudentSelectionProvider>
    )
}
