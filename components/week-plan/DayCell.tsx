'use client';

import { useState } from 'react';
import { MoreVertical, Plus, Send, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getDayName } from '@/lib/utils/date';
import { clsx } from 'clsx';
import { DayTodosBlock } from './DayTodosBlock';

interface DayCellProps {
    dayId: string;
    dayOfWeek: number;
    dinnerId?: string | null;
    dinnerName?: string | null;
    dinnerIcon?: string | null;
    todos?: any[];
    isPending?: boolean;
    onAssign: () => void;
    onClear: () => void;
    onSend: () => void;
    onToggleTodo: (todoId: string, currentStatus: boolean) => void;
    onAddTodo: () => void;
}

export function DayCell({
    dayId,
    dayOfWeek,
    dinnerId,
    dinnerName,
    dinnerIcon,
    todos = [],
    isPending,
    onAssign,
    onClear,
    onSend,
    onToggleTodo,
    onAddTodo
}: DayCellProps) {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div className="relative bg-surface border rounded-radius shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b bg-secondary/50">
                <span className="font-semibold text-sm">{getDayName(dayOfWeek)}</span>
                <div className="relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setShowMenu(!showMenu)}
                        disabled={isPending}
                    >
                        <MoreVertical size={16} />
                    </Button>

                    {showMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-50"
                                onClick={() => setShowMenu(false)}
                            />
                            <div className="absolute right-0 top-9 z-50 w-44 bg-surface border rounded-radius shadow-md p-1 animate-in fade-in zoom-in-95 duration-100">
                                <button
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-radius hover:bg-accent/50 transition-colors"
                                    onClick={() => { onSend(); setShowMenu(false); }}
                                >
                                    <Send size={14} /> Send til handleliste
                                </button>
                                <button
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-radius hover:bg-accent/50 transition-colors text-destructive"
                                    onClick={() => { onClear(); setShowMenu(false); }}
                                >
                                    <Trash2 size={14} /> Tøm dag
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div
                className={clsx(
                    "p-4 min-h-[72px] flex flex-col items-center justify-center transition-colors",
                    isPending ? 'cursor-wait' : 'cursor-pointer',
                    dinnerName ? 'bg-surface active:bg-accent/30' : 'bg-surface hover:bg-accent/20 active:bg-accent/30'
                )}
                onClick={isPending ? undefined : onAssign}
            >
                {isPending ? (
                    <div className="flex flex-col items-center text-center gap-1.5 text-muted-foreground">
                        <Loader2 size={24} className="animate-spin text-primary" />
                        <span className="text-xs">Legger til...</span>
                    </div>
                ) : dinnerName ? (
                    <div className="flex flex-col items-center text-center gap-1.5">
                        <span className="text-2xl">{dinnerIcon || '🍽️'}</span>
                        <span className="font-medium text-sm">{dinnerName}</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center gap-1 text-muted-foreground">
                        <Plus size={20} className="opacity-50" />
                        <span className="text-xs">Velg middag</span>
                    </div>
                )}
            </div>

            <DayTodosBlock
                todos={todos}
                onToggleTodo={onToggleTodo}
                onAddTodo={onAddTodo}
            />

            {/* AI Suggestion Placeholder (Hidden) */}
            <div
                className="ai-suggestion"
                style={{ display: 'none' }}
                aria-hidden="true"
                data-day-id={dayId}
                data-day-of-week={dayOfWeek}
                data-dinner-id={dinnerId || ''}
                data-dinner-name={dinnerName || ''}
            />
        </div>
    );
}
