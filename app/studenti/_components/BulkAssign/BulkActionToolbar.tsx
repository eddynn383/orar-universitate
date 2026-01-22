"use client"

import { useState } from "react"
import { Button } from "@/components/Button"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/Select"
import { useStudentSelection } from "./StudentSelectionContext"
import { X, Users, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

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

type BulkActionToolbarProps = {
    groups: GroupWithDetails[]
}

export function BulkActionToolbar({ groups }: BulkActionToolbarProps) {
    const { selectedIds, selectedCount, clearSelection } = useStudentSelection()
    const [selectedGroupId, setSelectedGroupId] = useState<string>("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleAssign = async () => {
        if (!selectedGroupId || selectedCount === 0) return

        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch("/api/students/bulk-assign", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    studentIds: Array.from(selectedIds),
                    groupId: selectedGroupId,
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || "Eroare la asignare")
            }

            if (result.success) {
                clearSelection()
                setSelectedGroupId("")
                router.refresh()
            } else if (result.errors?.length > 0) {
                setError(`${result.successful} studenți asignați, ${result.failed} erori`)
                router.refresh()
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Eroare necunoscută")
        } finally {
            setIsLoading(false)
        }
    }

    const handleRemoveFromGroup = async () => {
        if (selectedCount === 0) return

        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch("/api/students/bulk-assign", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    studentIds: Array.from(selectedIds),
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || "Eroare la eliminare")
            }

            if (result.success) {
                clearSelection()
                router.refresh()
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Eroare necunoscută")
        } finally {
            setIsLoading(false)
        }
    }

    if (selectedCount === 0) return null

    const groupedByLearningType = groups.reduce(
        (acc, group) => {
            const key = group.learningType?.learningCycle || "Fără tip"
            if (!acc[key]) {
                acc[key] = []
            }
            acc[key].push(group)
            return acc
        },
        {} as Record<string, GroupWithDetails[]>
    )

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-4 bg-primary-100 border border-primary-300 rounded-lg shadow-lg p-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <Users className="size-4" />
                    <span>{selectedCount} studenți selectați</span>
                </div>

                <div className="h-6 w-px bg-primary-300" />

                <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                    <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Selectează grupa" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(groupedByLearningType).map(([learningType, typeGroups]) => (
                            <SelectGroup key={learningType}>
                                <SelectLabel>{learningType}</SelectLabel>
                                {typeGroups.map((group) => (
                                    <SelectItem key={group.id} value={group.id}>
                                        {group.name} - An {group.studyYear?.year}, Sem {group.semester}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    variant="brand"
                    size="M"
                    onClick={handleAssign}
                    disabled={!selectedGroupId || isLoading}
                >
                    {isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : (
                        "Asignează"
                    )}
                </Button>

                <Button
                    variant="outline"
                    size="M"
                    onClick={handleRemoveFromGroup}
                    disabled={isLoading}
                >
                    Elimină din grupă
                </Button>

                <button
                    onClick={clearSelection}
                    className="p-1 hover:bg-primary-200 rounded-md transition-colors"
                    title="Anulează selecția"
                >
                    <X className="size-4" />
                </button>

                {error && (
                    <span className="text-sm text-fail-500">{error}</span>
                )}
            </div>
        </div>
    )
}
