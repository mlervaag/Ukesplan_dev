'use client';

import { useState } from 'react';
import { Check, Clock, Trash2, Edit2 } from 'lucide-react';
import { toastBus } from '@/lib/utils/toast';
import { cn } from '@/lib/utils';

interface TodoListItemProps {
    todo: {
        id: string;
        title: string;
        time?: string | null;
        responsible: 'he' | 'she' | 'both';
        completed: boolean;
        source: 'adhoc' | 'recurring';
    };
    onUpdate: () => void;
}

export function TodoListItem({ todo, onUpdate }: TodoListItemProps) {
    const [isUpdating, setIsUpdating] = useState(false);

    const toggleCompleted = async () => {
        if (isUpdating) return;
        setIsUpdating(true);
        try {
            const res = await fetch(`/api/todos/${todo.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !todo.completed }),
            });
            if (res.ok) {
                onUpdate();
            } else {
                toastBus.show('Kunne ikke oppdatere gjøremål', 'error');
            }
        } catch (e) {
            toastBus.show('Nettverksfeil', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const deleteTodo = async () => {
        if (!confirm(`Slette "${todo.title}"?`)) return;
        try {
            const res = await fetch(`/api/todos/${todo.id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                onUpdate();
                toastBus.show('Slettet', 'success');
            }
        } catch (e) {
            toastBus.show('Kunne ikke slette', 'error');
        }
    };

    const responsibleColor = {
        he: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        she: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
        both: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    }[todo.responsible];

    const responsibleLetter = {
        he: 'M',
        she: 'N',
        both: 'B'
    }[todo.responsible];

    return (
        <div className={cn(
            "group flex items-center space-x-3 p-3 rounded-xl border transition-all duration-200",
            todo.completed ? "bg-muted/30 border-transparent" : "bg-card border-border hover:border-primary/30"
        )}>
            <button
                onClick={toggleCompleted}
                disabled={isUpdating}
                className={cn(
                    "flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors",
                    todo.completed
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/30 hover:border-primary/50"
                )}
            >
                {todo.completed && <Check size={16} strokeWidth={3} />}
            </button>

            <div className="flex-grow flex items-center justify-between min-w-0">
                <div
                    onClick={toggleCompleted}
                    className="flex flex-col min-w-0 cursor-pointer"
                >
                    <div className="flex items-center space-x-2">
                        {todo.time && (
                            <span className="flex items-center text-xs font-medium text-muted-foreground whitespace-nowrap">
                                <Clock size={12} className="mr-1" />
                                {todo.time}
                            </span>
                        )}
                        <span className={cn(
                            "font-medium truncate transition-all",
                            todo.completed && "text-muted-foreground line-through decoration-2"
                        )}>
                            {todo.title}
                        </span>
                    </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                    <span className={cn(
                        "w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold shadow-sm",
                        responsibleColor
                    )}>
                        {responsibleLetter}
                    </span>

                    {todo.source === 'adhoc' && !todo.completed && (
                        <button
                            onClick={(e) => { e.stopPropagation(); deleteTodo(); }}
                            className="p-1.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
