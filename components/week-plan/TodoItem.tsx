'use client';

import { Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodoItemProps {
    todo: {
        id: string;
        title: string;
        time?: string | null;
        responsible: 'he' | 'she' | 'both';
        completed: boolean;
    };
    onToggle: () => void;
}

export function TodoItem({ todo, onToggle }: TodoItemProps) {
    const responsibleLabel = {
        he: 'M',
        she: 'N',
        both: 'B'
    }[todo.responsible];

    const responsibleColor = {
        he: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        she: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
        both: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    }[todo.responsible];

    return (
        <div className="flex items-center gap-2 group min-w-0">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle();
                }}
                className={cn(
                    "flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors",
                    todo.completed
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/30 hover:border-primary/50"
                )}
            >
                {todo.completed && <Check size={12} strokeWidth={3} />}
            </button>

            <div className="flex-grow flex items-center justify-between min-w-0 gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                    {todo.time && (
                        <span className="flex items-center text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                            {todo.time}
                        </span>
                    )}
                    <span className={cn(
                        "text-xs truncate transition-all",
                        todo.completed && "text-muted-foreground line-through"
                    )}>
                        {todo.title}
                    </span>
                </div>

                <span className={cn(
                    "w-4 h-4 flex-shrink-0 flex items-center justify-center rounded-full text-[8px] font-bold",
                    responsibleColor
                )}>
                    {responsibleLabel}
                </span>
            </div>
        </div>
    );
}
