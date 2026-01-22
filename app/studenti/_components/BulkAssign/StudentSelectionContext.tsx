"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

type StudentSelectionContextType = {
    selectedIds: Set<string>
    toggleSelection: (id: string) => void
    selectAll: (ids: string[]) => void
    clearSelection: () => void
    isSelected: (id: string) => boolean
    selectedCount: number
}

const StudentSelectionContext = createContext<StudentSelectionContextType | null>(null)

export function StudentSelectionProvider({ children }: { children: ReactNode }) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    const toggleSelection = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }, [])

    const selectAll = useCallback((ids: string[]) => {
        setSelectedIds((prev) => {
            const allSelected = ids.every((id) => prev.has(id))
            if (allSelected) {
                return new Set()
            }
            return new Set(ids)
        })
    }, [])

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set())
    }, [])

    const isSelected = useCallback((id: string) => {
        return selectedIds.has(id)
    }, [selectedIds])

    return (
        <StudentSelectionContext.Provider
            value={{
                selectedIds,
                toggleSelection,
                selectAll,
                clearSelection,
                isSelected,
                selectedCount: selectedIds.size,
            }}
        >
            {children}
        </StudentSelectionContext.Provider>
    )
}

export function useStudentSelection() {
    const context = useContext(StudentSelectionContext)
    if (!context) {
        throw new Error("useStudentSelection must be used within StudentSelectionProvider")
    }
    return context
}
