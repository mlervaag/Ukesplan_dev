'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ChevronDown, ChevronRight, RotateCcw, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HiddenTodosSectionProps {
    todos: any[];
    onRestore: (id: string) => Promise<void>;
}

export function HiddenTodosSection({ todos, onRestore }: HiddenTodosSectionProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (todos.length === 0) return null;

    const responsibleLetter = {
        he: 'M',
        she: 'N',
        both: 'B'
    } as Record<string, string>;

    const responsibleColor = {
        he: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        she: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
        both: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    } as Record<string, string>;

    return (
        <div className="space-y-3 pt-4 border-t">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-1"
            >
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span>Skjulte gjøremål ({todos.length})</span>
            </button>

            {isOpen && (
                <div className="space-y-2">
                    {todos.map((todo) => (
                        <div key={todo.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-transparent hover:border-accent/20 transition-all group">
                            <div className="flex items-center gap-3 min-w-0 opacity-60">
                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-2">
                                        {todo.time && (
                                            <span className="flex items-center text-xs text-muted-foreground whitespace-nowrap">
                                                <Clock size={12} className="mr-1" />
                                                {todo.time}
                                            </span>
                                        )}
                                        <span className="font-medium truncate line-through decoration-muted-foreground/50">
                                            {todo.title}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                <span className={cn(
                                    "w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold shadow-sm opacity-50",
                                    responsibleColor[todo.responsible]
                                )}>
                                    {responsibleLetter[todo.responsible]}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onRestore(todo.id)}
                                    className="h-8 px-3 text-xs gap-1.5 hover:bg-surface"
                                >
                                    <RotateCcw size={14} />
                                    Gjenopprett
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
