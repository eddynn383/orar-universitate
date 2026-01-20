"use client"

import { useState } from "react"
import { Button } from "@/components/Button"
import { Check, Filter, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/Popover"
import { Badge } from "@/components/Badge"
import { Group } from "@/app/generated/prisma/client"
import { ExportPDFButton } from "../ExportPDFButton"

const EVENT_TYPES = [
    { name: "Curs", value: "C", color: "bg-blue-500" },
    { name: "Seminar", value: "S", color: "bg-green-500" },
    { name: "Laborator", value: "L", color: "bg-purple-500" },
    { name: "Proiect", value: "P", color: "bg-orange-500" },
]

type CalendarFiltersProps = {
    groups: Group[]
    selectedTypes: string[]
    selectedGroupIds: string[]
    onTypesChange: (types: string[]) => void
    onGroupsChange: (groupIds: string[]) => void
    academicYear?: string
    learningCycle?: string
    semester?: number
    studyYear?: number
}

export function CalendarFilters({
    groups,
    selectedTypes,
    selectedGroupIds,
    onTypesChange,
    onGroupsChange,
    academicYear,
    learningCycle,
    semester,
    studyYear,
}: CalendarFiltersProps) {
    const [isGroupFilterOpen, setIsGroupFilterOpen] = useState(false)

    // Toggle event type selection
    const toggleType = (type: string) => {
        if (selectedTypes.includes(type)) {
            onTypesChange(selectedTypes.filter(t => t !== type))
        } else {
            onTypesChange([...selectedTypes, type])
        }
    }

    // Toggle group selection
    const toggleGroup = (groupId: string) => {
        if (selectedGroupIds.includes(groupId)) {
            onGroupsChange(selectedGroupIds.filter(id => id !== groupId))
        } else {
            onGroupsChange([...selectedGroupIds, groupId])
        }
    }

    // Select all types
    const selectAllTypes = () => {
        onTypesChange(EVENT_TYPES.map(t => t.value))
    }

    // Clear all groups
    const clearAllGroups = () => {
        onGroupsChange([])
    }

    // Select all groups
    const selectAllGroups = () => {
        onGroupsChange(groups.map(g => g.id))
    }

    // Check if all types are selected
    const allTypesSelected = selectedTypes.length === EVENT_TYPES.length

    // Check if all groups are selected
    const allGroupsSelected = selectedGroupIds.length === groups.length

    return (
        <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Legend / Type Filters */}
            <div className="flex items-center gap-2 flex-1">
                <span className="text-sm text-primary-600">Legenda:</span>
                <div className="flex gap-2">
                    {EVENT_TYPES.map((type) => {
                        const isSelected = selectedTypes.includes(type.value)
                        const isFiltered = selectedTypes.length > 0 && selectedTypes.length < EVENT_TYPES.length

                        return (
                            <button
                                key={type.value}
                                onClick={() => toggleType(type.value)}
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-all text-sm ${isSelected || !isFiltered
                                    ? 'bg-primary-200 hover:bg-primary-300'
                                    : 'bg-primary-100 opacity-50 hover:opacity-75'
                                    }`}
                                title={isSelected ? `Ascunde ${type.name}` : `Afișează doar ${type.name}`}
                            >
                                <span className={`flex size-3.5 ${type.color} rounded-full ${!isSelected && isFiltered ? 'opacity-40' : ''
                                    }`} />
                                <span className={!isSelected && isFiltered ? 'line-through' : ''}>
                                    {type.name}
                                </span>
                            </button>
                        )
                    })}
                </div>

                {/* Quick actions for types */}
                {selectedTypes.length < EVENT_TYPES.length && (
                    <Button
                        variant="ghost"
                        size="S"
                        onClick={selectAllTypes}
                        className="text-xs ml-1"
                    >
                        Afișează toate
                    </Button>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                {/* Export PDF Button */}
                {academicYear && learningCycle && semester && studyYear && (
                    <ExportPDFButton
                        academicYear={academicYear}
                        learningCycle={learningCycle}
                        semester={semester}
                        studyYear={studyYear}
                        selectedGroupId={selectedGroupIds.length === 1 ? selectedGroupIds[0] : undefined}
                    />
                )}

                {/* Group Filter */}
                <Popover open={isGroupFilterOpen} onOpenChange={setIsGroupFilterOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="S"
                        className="gap-2"
                    >
                        <Filter className="w-4 h-4" />
                        <span>Grupe</span>
                        {selectedGroupIds.length > 0 && selectedGroupIds.length < groups.length && (
                            <Badge className="bg-brand-100 text-brand-700 border-brand-200 ml-1">
                                {selectedGroupIds.length}
                            </Badge>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    align="end"
                    className="w-80 p-0"
                    onInteractOutside={() => setIsGroupFilterOpen(false)}
                >
                    <div className="p-3 border-b border-primary-200">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">Filtrează după grupă</span>
                            <div className="flex gap-1">
                                {selectedGroupIds.length > 0 ? (
                                    <Button
                                        variant="ghost"
                                        size="S"
                                        onClick={clearAllGroups}
                                        className="text-xs text-red-600 hover:text-red-700"
                                    >
                                        Resetează
                                    </Button>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="S"
                                        onClick={selectAllGroups}
                                        className="text-xs"
                                    >
                                        Selectează toate
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-3 max-h-64 overflow-y-auto">
                        {groups.length > 0 ? (
                            <div className="grid grid-cols-3 gap-2">
                                {groups.map((group) => {
                                    const isSelected = selectedGroupIds.includes(group.id)
                                    return (
                                        <button
                                            key={group.id}
                                            onClick={() => toggleGroup(group.id)}
                                            className={`flex items-center justify-center gap-1.5 px-2 py-1.5 text-sm border rounded-md transition-all ${isSelected
                                                ? 'border-brand-400 bg-brand-400/10 text-brand-1400'
                                                : 'border-primary-400 bg-primary-50 text-primary-1000 hover:border-primary-400'
                                                }`}
                                        >
                                            {isSelected && <Check className="w-3 h-3" />}
                                            <span>{group.name}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-primary-500 text-center py-4">
                                Nu există grupe disponibile
                            </p>
                        )}
                    </div>

                    {selectedGroupIds.length > 0 && (
                        <div className="p-3 border-t border-primary-200 bg-primary-50">
                            <p className="text-xs text-primary-600">
                                {selectedGroupIds.length === groups.length
                                    ? 'Toate grupele selectate'
                                    : `${selectedGroupIds.length} din ${groups.length} grupe selectate`
                                }
                            </p>
                        </div>
                    )}
                </PopoverContent>
                </Popover>
            </div>
        </div>
    )
}