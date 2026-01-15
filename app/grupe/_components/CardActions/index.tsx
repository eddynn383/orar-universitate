"use server"

import { GroupsActions } from "../GroupsActions"
import { getGroupById } from "@/data/group"
import { getAllLearningTypes } from "@/data/learningType"

export async function CardActions({ groupId }: { groupId: string }) {
    const [group, learningTypes] = await Promise.all([
        getGroupById(groupId),
        getAllLearningTypes()
    ])

    const defaultValues = {
        id: group?.id,
        name: group?.name || "",
        learningTypeId: group?.learningTypeId || "",
        studyYearId: group?.studyYearId || "",
        semester: group?.semester?.toString() || "1"
    }

    return (
        <GroupsActions
            defaultValues={defaultValues}
            learningTypes={learningTypes}
        />
    )
}