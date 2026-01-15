"use client";

import React, { useState, useRef, useCallback } from 'react';
import { CalendarEntry, PRISMA_DAYS, DAY_PRISMA_TO_DISPLAY, TIME_SLOTS } from '@/types/global';
import { Clock, User, MapPin, GripVertical, AlertCircle } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
} from '@dnd-kit/core';
import {
    useDraggable,
    useDroppable,
} from '@dnd-kit/core';
import { EventDetailsPopover } from '../EventDetailsPopover';

interface CalendarProps {
    entries: CalendarEntry[];
    selectedGroup?: string;
    onSlotSelect?: (day: string, startHour: string, endHour: string, duration: number) => void;
    onEntryMove?: (entryId: string, newDay: string, newStartHour: string) => void;
    onEntryEdit?: (entry: CalendarEntry) => void;
    onEntryDelete?: (entry: CalendarEntry) => void;
}

const TYPE_BORDER_COLORS = {
    C: 'border-l-blue-500',
    S: 'border-l-green-500',
    L: 'border-l-purple-500',
    P: 'border-l-orange-500',
};

const CELL_HEIGHT = 80;

interface DraggableEntryCardProps {
    entry: CalendarEntry;
    isConflict: boolean;
    conflictIndex: number;
    totalConflicts: number;
    isDragging?: boolean;
    isPopoverOpen: boolean;
    onPopoverChange: (open: boolean) => void;
    onEdit: () => void;
    onDelete: () => void;
    dayIndex: number;
}

function DraggableEntryCard({
    entry,
    isConflict,
    conflictIndex,
    totalConflicts,
    isDragging,
    isPopoverOpen,
    onPopoverChange,
    onEdit,
    onDelete,
    dayIndex,
}: DraggableEntryCardProps) {
    const { attributes, listeners, setNodeRef } = useDraggable({
        id: entry.id,
        data: {
            entry,
        },
    });

    const cardHeight = (entry.duration * CELL_HEIGHT) - 8;
    const isSmallCard = entry.duration === 1;
    const isNarrow = totalConflicts > 2;

    // Calculate width and position based on conflicts
    const widthPercent = 100 / totalConflicts;
    const leftPercent = conflictIndex * widthPercent;

    const formatTeacherName = (name: string) => {
        if (!name) return name;
        if (isNarrow) {
            const parts = name.split(' ');
            if (parts.length >= 2) {
                return `${parts[0]} ${parts[1].charAt(0)}.`;
            }
        }
        return name;
    };

    const popoverSide = dayIndex < 2 ? "right" : "left";
    const baseZIndex = 10 + entry.duration;

    return (
        <div
            ref={setNodeRef}
            className="absolute"
            style={{
                top: '4px',
                left: `calc(${leftPercent}% + 2px)`,
                width: `calc(${widthPercent}% - 8px)`,
                height: `${cardHeight}px`,
                zIndex: isPopoverOpen ? 100 : baseZIndex,
            }}
        >
            <EventDetailsPopover
                entry={entry}
                open={isPopoverOpen}
                onOpenChange={onPopoverChange}
                onEdit={onEdit}
                onDelete={onDelete}
                side={popoverSide}
            >
                <div
                    className={`entry-card h-full border-l-4 rounded shadow-sm transition-all cursor-pointer bg-primary-300 border-gray-200 ${TYPE_BORDER_COLORS[entry.type]
                        } ${isDragging ? 'opacity-30' : 'hover:shadow-lg'
                        } ${isPopoverOpen ? 'ring-2 ring-brand-400' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!isDragging) {
                            onPopoverChange(true);
                        }
                    }}
                >
                    {/* Drag handle */}
                    <div
                        className="absolute top-0 left-0 cursor-grab active:cursor-grabbing py-2 px-1.5 rounded text-primary-600 hover:text-primary-1200 z-20"
                        {...listeners}
                        {...attributes}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <GripVertical className="w-3 h-3" />
                    </div>

                    <div className="p-1.5 h-full flex flex-col gap-1 relative overflow-hidden">
                        {/* Week type indicator */}
                        {entry.weekType && entry.weekType !== 'toate' && (
                            <div className="absolute top-1 right-1 group/week">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium ${entry.weekType === 'para'
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-amber-500 text-white'
                                    }`}>
                                    {entry.weekType === 'para' ? 'P' : 'I'}
                                </div>
                                <div className="absolute top-full right-0 mt-1 hidden group-hover/week:block z-50">
                                    <div className={`text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg ${entry.weekType === 'para' ? 'bg-purple-600' : 'bg-amber-600'
                                        }`}>
                                        {entry.weekType === 'para' ? 'Săptămână pară' : 'Săptămână impară'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Subject name */}
                        <div className={`text-sm font-medium text-primary-1400 pl-3 flex-1 ${entry.weekType && entry.weekType !== 'toate' ? 'pr-6' : ''} ${isSmallCard ? 'line-clamp-2' : ''}`} title={entry.subject}>
                            {entry.subject}
                        </div>
                        {
                            entry.duration === 1 &&
                            <div className="flex gap-2 items-center">
                                {entry.teacher && (
                                    <div className="flex flex-1 items-center gap-1.5 text-xs text-primary-800 px-1 line-clamp-1" title={entry.teacher}>
                                        <User className="w-3 h-3 flex-shrink-0 text-primary-600" />
                                        <span className="truncate">{entry.teacher}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5 text-xs text-primary-800">
                                    <span>{entry.duration}h</span>
                                </div>
                            </div>
                        }
                        {
                            entry.duration > 1 &&
                            <div className={`flex flex-col mt-1 space-y-0.5 text-xs text-primary-800 overflow-hidden`}>
                                {entry.teacher && (
                                    <div className="flex flex-1 items-center gap-1.5 text-xs text-primary-800 px-1 line-clamp-1" title={entry.teacher}>
                                        <User className="w-3 h-3 flex-shrink-0 text-primary-600" />
                                        <span className="truncate">{entry.teacher}</span>
                                    </div>
                                )}
                                <div className="flex gap-2 items-center">
                                    {entry.room && (
                                        <div className="flex flex-1 items-center gap-1.5 px-1 line-clamp-1" title={entry.room}>
                                            <MapPin className="w-3 h-3 flex-shrink-0 text-primary-600" />
                                            <span className="truncate">{entry.room}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5 text-xs text-primary-800">
                                        <span>{entry.duration}h</span>
                                    </div>
                                </div>


                            </div>

                        }
                    </div>

                    {/* Conflict indicator */}
                    {isConflict && (
                        <div className="absolute bottom-0 right-0 group">
                            <div className="w-0 h-0 border-l-[20px] border-l-transparent border-b-[20px] border-b-red-500"></div>
                            <div className="absolute bottom-0.5 right-0.5">
                                <AlertCircle className="w-2 h-2 text-white" />
                            </div>
                            <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block z-51">
                                <div className="bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
                                    Conflict de orar!
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </EventDetailsPopover>
        </div>
    );
}

interface DroppableSlotProps {
    day: string;
    slotIndex: number;
    children?: React.ReactNode;
    inDragSelection: boolean;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseEnter: () => void;
    onMouseUp: () => void;
}

function DroppableSlot({ day, slotIndex, children, inDragSelection, onMouseDown, onMouseEnter, onMouseUp }: DroppableSlotProps) {
    const { isOver, setNodeRef } = useDroppable({
        id: `${day}-${slotIndex}`,
        data: {
            day,
            slotIndex,
        },
    });

    return (
        <div
            ref={setNodeRef}
            className={`relative border-r border-b border-primary-300 cursor-pointer select-none transition-colors ${inDragSelection ? 'bg-primary-200' : isOver ? 'bg-green-100' : 'bg-primary-100 hover:bg-primary-200'
                }`}
            style={{ height: `${CELL_HEIGHT}px`, overflow: 'visible' }}
            onMouseDown={onMouseDown}
            onMouseEnter={onMouseEnter}
            onMouseUp={onMouseUp}
        >
            {children}
        </div>
    );
}

export function Calendar({ entries, selectedGroup, onSlotSelect, onEntryMove, onEntryEdit, onEntryDelete }: CalendarProps) {
    const [dragStart, setDragStart] = useState<{ day: string; slotIndex: number } | null>(null);
    const [dragEnd, setDragEnd] = useState<{ day: string; slotIndex: number } | null>(null);
    const [activeEntry, setActiveEntry] = useState<CalendarEntry | null>(null);
    const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

    // Only blocks cell click -> create modal, NOT edit/delete from popover buttons
    const blockCellClickRef = useRef(false);
    const isSelectingRef = useRef(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor)
    );

    const getSlotIndex = (startHour: string) => TIME_SLOTS.indexOf(startHour as any);

    const getEntriesStartingInSlot = (day: string, slotIndex: number) => {
        return entries.filter(entry => {
            const entryStartIndex = getSlotIndex(entry.startHour);
            const matchesSlot = entry.day === day && entryStartIndex === slotIndex;
            if (!selectedGroup) return matchesSlot;
            return matchesSlot && entry.groups.includes(selectedGroup);
        });
    };

    const areEntriesInConflict = (entries: CalendarEntry[]) => {
        if (entries.length <= 1) return false;

        const allWeeks = entries.filter(e => !e.weekType || e.weekType === 'toate');
        const evenWeeks = entries.filter(e => e.weekType === 'para');
        const oddWeeks = entries.filter(e => e.weekType === 'impara');

        const hasAllWeeksConflict = allWeeks.length > 1;
        const hasEvenWeeksConflict = evenWeeks.length > 1;
        const hasOddWeeksConflict = oddWeeks.length > 1;
        const hasAllWeeksWithOthers = allWeeks.length > 0 && (evenWeeks.length > 0 || oddWeeks.length > 0);

        return hasAllWeeksConflict || hasEvenWeeksConflict || hasOddWeeksConflict || hasAllWeeksWithOthers;
    };

    const handleMouseDown = useCallback((day: string, slotIndex: number, e: React.MouseEvent) => {
        // Don't start selection if clicking on an entry card
        if ((e.target as HTMLElement).closest('.entry-card')) {
            return;
        }

        // If popover is open, close it and block this click from opening create modal
        if (openPopoverId) {

            console.log("openPopoverId: ", openPopoverId)
            setOpenPopoverId(null);
            blockCellClickRef.current = true;
            return;
        }

        // If we just closed a popover by clicking outside, don't open create modal
        if (blockCellClickRef.current) {
            console.log("blockCellClickRef.current: ", blockCellClickRef.current)
            blockCellClickRef.current = false;
            return;
        }

        isSelectingRef.current = true;
        setDragStart({ day, slotIndex });
        setDragEnd({ day, slotIndex });
    }, [openPopoverId]);

    const handleMouseEnter = useCallback((day: string, slotIndex: number) => {
        if (dragStart && dragStart.day === day && isSelectingRef.current) {
            setDragEnd({ day, slotIndex });
        }
    }, [dragStart]);

    const handleMouseUp = useCallback(() => {
        // If block flag is set, just reset it
        if (blockCellClickRef.current) {
            setDragStart(null);
            setDragEnd(null);
            isSelectingRef.current = false;
            blockCellClickRef.current = false;
            return;
        }

        if (dragStart && dragEnd && dragStart.day === dragEnd.day && isSelectingRef.current) {
            const startIndex = Math.min(dragStart.slotIndex, dragEnd.slotIndex);
            const endIndex = Math.max(dragStart.slotIndex, dragEnd.slotIndex);
            const duration = endIndex - startIndex + 1;
            const startHour = TIME_SLOTS[startIndex];
            const endHour = TIME_SLOTS[endIndex + 1] || TIME_SLOTS[TIME_SLOTS.length - 1];

            onSlotSelect?.(dragStart.day, startHour, endHour, duration);
        }
        setDragStart(null);
        setDragEnd(null);
        isSelectingRef.current = false;
    }, [dragStart, dragEnd, onSlotSelect]);

    const isInDragSelection = (day: string, slotIndex: number) => {
        if (!dragStart || !dragEnd || dragStart.day !== day || dragEnd.day !== day) return false;
        const minIndex = Math.min(dragStart.slotIndex, dragEnd.slotIndex);
        const maxIndex = Math.max(dragStart.slotIndex, dragEnd.slotIndex);
        return slotIndex >= minIndex && slotIndex <= maxIndex;
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const entry = active.data.current?.entry as CalendarEntry;
        if (entry) {
            setActiveEntry(entry);
            setOpenPopoverId(null);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveEntry(null);

        if (!over) return;

        const entry = active.data.current?.entry as CalendarEntry;
        const { day, slotIndex } = over.data.current as { day: string; slotIndex: number };
        const newStartHour = TIME_SLOTS[slotIndex];

        if (entry.day !== day || entry.startHour !== newStartHour) {
            onEntryMove?.(entry.id, day, newStartHour);
        }
    };

    // Edit handler - close popover and call parent callback
    // This is NOT blocked by blockCellClickRef because it comes from popover button, not cell click
    const handleEntryEdit = useCallback((entry: CalendarEntry) => {
        console.log("Entry: ", entry)
        setOpenPopoverId(null);
        onEntryEdit?.(entry);
    }, [onEntryEdit]);

    // Delete handler - close popover and call parent callback
    // This is NOT blocked by blockCellClickRef because it comes from popover button, not cell click
    const handleEntryDelete = useCallback((entry: CalendarEntry) => {
        setOpenPopoverId(null);
        onEntryDelete?.(entry);
    }, [onEntryDelete]);

    // Popover open/close handler - only sets blockCellClickRef when closing via outside click
    const handlePopoverChange = useCallback((entryId: string, open: boolean) => {
        if (open) {
            setOpenPopoverId(entryId);
        } else {
            setOpenPopoverId(null);
            // Set flag to block next cell click from opening create modal
            blockCellClickRef.current = true;
            // Reset flag after a short delay (for clicks outside calendar area)
            setTimeout(() => {
                blockCellClickRef.current = false;
            }, 200);
        }
    }, []);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="overflow-x-auto overflow-y-auto max-h-full">
                <div className="inline-block min-w-full">
                    <div className="grid grid-cols-[100px_repeat(5,1fr)] gap-0">
                        {/* Header Row */}
                        <div className="bg-primary-200 border border-primary-300 rounded-tl-md p-3 flex items-center justify-center sticky top-0 z-[49]">
                            <span>Ora</span>
                        </div>

                        {PRISMA_DAYS.map((day, index) => (
                            <div key={day} className={`bg-primary-200 border-r border-b border-t border-primary-300 p-3 flex items-center justify-center sticky top-0 z-[49] ${index === PRISMA_DAYS.length - 1 ? 'rounded-tr-md' : ''}`}>
                                <span>{DAY_PRISMA_TO_DISPLAY[day]}</span>
                            </div>
                        ))}

                        {/* Time Slot Rows */}
                        {TIME_SLOTS.map((timeSlot, slotIndex) => (
                            <React.Fragment key={timeSlot}>
                                <div className="bg-primary-50 border-r border-l border-b border-primary-300 p-3 flex items-center justify-center" style={{ height: `${CELL_HEIGHT}px` }}>
                                    <span className="text-sm">{timeSlot}</span>
                                </div>
                                {PRISMA_DAYS.map((day, dayIndex) => {
                                    const inDragSelection = isInDragSelection(day, slotIndex);
                                    const startingEntries = getEntriesStartingInSlot(day, slotIndex);
                                    const hasConflicts = areEntriesInConflict(startingEntries);

                                    return (
                                        <DroppableSlot
                                            key={`${day}-${timeSlot}`}
                                            day={day}
                                            slotIndex={slotIndex}
                                            inDragSelection={inDragSelection}
                                            onMouseDown={(e) => handleMouseDown(day, slotIndex, e)}
                                            onMouseEnter={() => handleMouseEnter(day, slotIndex)}
                                            onMouseUp={handleMouseUp}
                                        >
                                            {startingEntries.length > 0 && (
                                                <>
                                                    {startingEntries.map((entry, index) => {
                                                        const isDragging = activeEntry?.id === entry.id;
                                                        return (
                                                            <DraggableEntryCard
                                                                key={entry.id}
                                                                entry={entry}
                                                                isConflict={hasConflicts}
                                                                conflictIndex={index}
                                                                totalConflicts={startingEntries.length}
                                                                isDragging={isDragging}
                                                                isPopoverOpen={openPopoverId === entry.id}
                                                                onPopoverChange={(open) => handlePopoverChange(entry.id, open)}
                                                                onEdit={() => handleEntryEdit(entry)}
                                                                onDelete={() => handleEntryDelete(entry)}
                                                                dayIndex={dayIndex}
                                                            />
                                                        );
                                                    })}
                                                </>
                                            )}
                                        </DroppableSlot>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
                {dragStart && isSelectingRef.current && (
                    <div className="mt-3 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded p-2 inline-block">
                        💡 Trageți pentru a selecta durata cursului... Eliberați pentru a continua.
                    </div>
                )}
            </div>

            <DragOverlay>
                {activeEntry ? (
                    <div
                        className={`entry-card border-l-4 rounded shadow-lg ${TYPE_BORDER_COLORS[activeEntry.type]} bg-primary-300 border-gray-200 opacity-90`}
                        style={{
                            width: '200px',
                            height: `${(activeEntry.duration * CELL_HEIGHT) - 8}px`,
                        }}
                    >
                        <div className={`${activeEntry.duration === 1 ? 'p-1.5' : 'p-3'} h-full flex flex-col`}>
                            <div className="text-sm font-medium text-primary-1400 flex-shrink-0">
                                {activeEntry.subject}
                            </div>
                            <div className="flex-grow flex flex-col justify-end mt-1 space-y-0.5 text-xs text-primary-800">
                                {activeEntry.teacher && (
                                    <div className="flex items-center gap-1.5 pl-1">
                                        <User className="w-3 h-3 flex-shrink-0 text-primary-600" />
                                        <span className="truncate">{activeEntry.teacher}</span>
                                    </div>
                                )}
                                {activeEntry.room && activeEntry.duration > 1 && (
                                    <div className="flex items-center gap-1.5">
                                        <MapPin className="w-3 h-3 flex-shrink-0 text-primary-600" />
                                        <span className="truncate">{activeEntry.room}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 flex-shrink-0 text-primary-600" />
                                    <span>{activeEntry.duration}h</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}