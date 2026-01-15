"use server"

import { getDisciplineById } from "@/data/discipline"
import { DisciplineActions } from "../DisciplineActions"
import { getAllTeachers } from "@/data/teacher"
import { getAllLearningTypes } from "@/data/learningType"

export async function CardActions({ disciplineId }: { disciplineId: string }) {
    const discipline = await getDisciplineById(disciplineId)
    const teachers = await getAllTeachers()
    const learningTypes = await getAllLearningTypes()
    const defaultValues = {
        id: discipline?.id,
        name: discipline?.name || "",
        semester: discipline?.semester.toString() || "1",
        teacherId: discipline?.teacherId || "",
        studyYearId: discipline?.studyYearId || "",
        learningTypeId: discipline?.learningTypeId || ""
    }

    return (
        <>
            <DisciplineActions defaultValues={defaultValues} teachers={teachers} learningTypes={learningTypes} />
        </>
    )
}
