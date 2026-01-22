"use client"

import { Checkbox } from "@/components/Checkbox"
import { useStudentSelection } from "./StudentSelectionContext"
import { useMemo } from "react"

type SelectAllCheckboxProps = {
    studentIds: string[]
}

export function SelectAllCheckbox({ studentIds }: SelectAllCheckboxProps) {
    const { selectedIds, selectAll, selectedCount } = useStudentSelection()

    const allSelected = useMemo(() => {
        return studentIds.length > 0 && studentIds.every((id) => selectedIds.has(id))
    }, [studentIds, selectedIds])

    const someSelected = useMemo(() => {
        return selectedCount > 0 && !allSelected
    }, [selectedCount, allSelected])

    return (
        <div className="flex items-center gap-2">
            <Checkbox
                checked={allSelected}
                ref={(el) => {
                    if (el) {
                        (el as HTMLButtonElement).dataset.state = someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"
                    }
                }}
                onCheckedChange={() => selectAll(studentIds)}
                className="data-[state=checked]:bg-brand-400 data-[state=checked]:border-brand-400 data-[state=indeterminate]:bg-brand-400 data-[state=indeterminate]:border-brand-400"
            />
            <span className="text-sm text-primary-700">
                {selectedCount > 0
                    ? `${selectedCount} selectați`
                    : "Selectează tot"}
            </span>
        </div>
    )
}
