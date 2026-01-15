"use client"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/Popover"
import { Button } from "@/components/Button"
import { CalendarEntry, DAY_PRISMA_TO_DISPLAY } from "@/types/global"
import { Clock, User, MapPin, Users, Calendar, Repeat, Pencil, Trash2, X } from "lucide-react"
import { Badge } from "@/components/Badge"
import { H3 } from "@/components/Typography"

const TYPE_LABELS: Record<string, string> = {
    C: "Curs",
    S: "Seminar",
    L: "Laborator",
    P: "Proiect",
}

const TYPE_COLORS: Record<string, string> = {
    C: "bg-blue-100 text-blue-700 border-blue-200",
    S: "bg-green-100 text-green-700 border-green-200",
    L: "bg-purple-100 text-purple-700 border-purple-200",
    P: "bg-orange-100 text-orange-700 border-orange-200",
}

const WEEK_TYPE_LABELS: Record<string, string> = {
    toate: "Toate săptămânile",
    para: "Săptămâni pare",
    impara: "Săptămâni impare",
}

type EventDetailsPopoverProps = {
    entry: CalendarEntry
    open: boolean
    onOpenChange: (open: boolean) => void
    onEdit: () => void
    onDelete: () => void
    children: React.ReactNode
    side?: "left" | "right" | "top" | "bottom"
}

export function EventDetailsPopover({
    entry,
    open,
    onOpenChange,
    onEdit,
    onDelete,
    children,
    side = "right",
}: EventDetailsPopoverProps) {

    console.log("Entry in popover: ", entry)

    const handleEdit = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        onOpenChange(false)
        onEdit()
    }

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        onOpenChange(false)
        onDelete()
    }

    const handleClose = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        onOpenChange(false)
    }

    return (
        <Popover open={open} onOpenChange={onOpenChange}>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            <PopoverContent
                side={side}
                sideOffset={8}
                align="start"
                className="w-80 p-0"
                collisionPadding={16}
                onPointerDownOutside={(e) => {
                    // Allow closing when clicking outside
                }}
                onInteractOutside={(e) => {
                    // Allow closing when interacting outside
                }}
                // Prevent focus from leaving and closing
                onFocusOutside={(e) => {
                    e.preventDefault()
                }}
            >
                <div
                    className="flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col gap-3 flex-1 min-w-0">
                                <H3 className="text-xl">{entry.subject}</H3>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge className={`${TYPE_COLORS[entry.type]} border text-xs`}>
                                        {TYPE_LABELS[entry.type]}
                                    </Badge>
                                    {entry.weekType && entry.weekType !== "toate" && (
                                        <Badge className={`${entry.weekType === "para"
                                            ? "bg-purple-100 text-purple-700 border-purple-200"
                                            : "bg-amber-100 text-amber-700 border-amber-200"
                                            } border text-xs`}>
                                            {entry.weekType === "para" ? "Pară" : "Impară"}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <Button
                                variant="text"
                                size="icon-s"
                                onClick={handleClose}
                                className="flex-shrink-0 -mr-2 -mt-2"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 pt-1 space-y-3">
                        {/* Ziua și ora */}
                        <div className="flex items-center gap-3 p-2.5 bg-primary-200 rounded-lg">
                            <Calendar className="w-4 h-4 text-primary-600 flex-shrink-0" />
                            <div className="text-sm">
                                <span className="font-medium text-primary-1400">
                                    {DAY_PRISMA_TO_DISPLAY[entry.day]}
                                </span>
                                <span className="text-primary-600 ml-2">
                                    {entry.startHour} - {entry.endHour} ({entry.duration}h)
                                </span>
                            </div>
                        </div>

                        {/* Detalii */}
                        <div className="space-y-2.5">
                            {/* Cadru didactic */}
                            {entry.teacher && (
                                <div className="flex items-center gap-3 text-sm px-2.5">
                                    <div title="Cadru didactic">
                                        <User className="w-4 h-4 text-primary-600 flex-shrink-0" />
                                    </div>
                                    <span className="text-primary-900">{entry.teacher}</span>
                                </div>
                            )}

                            {/* Sala */}
                            {entry.room && (
                                <div className="flex items-center gap-3 text-sm px-2.5">
                                    <div title="Sala">
                                        <MapPin className="w-4 h-4 text-primary-600 flex-shrink-0" />
                                    </div>
                                    <span className="text-primary-900">{entry.room}</span>
                                </div>
                            )}

                            {/* Grupe */}
                            {entry.groups.length > 0 && (
                                <div className="flex items-center gap-3 text-sm px-2.5">
                                    <div title="Grupe">
                                        <Users className="w-4 h-4 text-primary-600 flex-shrink-0" />
                                    </div>
                                    <span className="text-primary-900">{entry.groups.join(", ")}</span>
                                </div>
                            )}

                            {/* Frecvența */}
                            <div className="flex items-center gap-3 text-sm px-2.5">
                                <div title="Frecvența">
                                    <Repeat className="w-4 h-4 text-primary-600 flex-shrink-0" />
                                </div>
                                <span className="text-primary-900">
                                    {WEEK_TYPE_LABELS[entry.weekType || "toate"]}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-2 p-3 border-t border-primary-400 bg-primary-50">
                        <Button
                            type="button"
                            variant="ghost"
                            size="S"
                            onClick={handleDelete}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <Trash2 className="w-4 h-4 mr-1.5" />
                            Șterge
                        </Button>
                        <Button
                            type="button"
                            variant="brand"
                            size="S"
                            onClick={handleEdit}
                        >
                            <Pencil className="w-4 h-4 mr-1.5" />
                            Editează
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}