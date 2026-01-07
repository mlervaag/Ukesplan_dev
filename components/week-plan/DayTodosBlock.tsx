'use client';

import { Plus } from 'lucide-react';
import { TodoItem } from './TodoItem';
import Link from 'next/link';

interface Todo {
    id: string;
    title: string;
    time?: string | null;
    responsible: 'he' | 'she' | 'both';
    completed: boolean;
    hidden: boolean;
}

interface DayTodosBlockProps {
    todos: Todo[];
    onToggleTodo: (todoId: string, currentStatus: boolean) => void;
    onAddTodo: () => void;
}

export function DayTodosBlock({ todos, onToggleTodo, onAddTodo }: DayTodosBlockProps) {
    // Safety filter (domain logic should have already filtered these)
    const activeTodos = todos.filter(t => !t.hidden);
    const visibleTodos = activeTodos.slice(0, 4);
    const hasMore = activeTodos.length > 4;

    return (
        <div className="w-full px-3 py-2 border-t bg-secondary/10 flex flex-col gap-1.5">
            {todos.length > 0 ? (
                <div className="space-y-1.5">
                    {visibleTodos.map((todo) => (
                        <TodoItem
                            key={todo.id}
                            todo={todo}
                            onToggle={() => onToggleTodo(todo.id, todo.completed)}
                        />
                    ))}

                    {hasMore && (
                        <Link
                            href="/gjoremal"
                            className="text-[10px] text-primary hover:underline block text-center mt-1"
                        >
                            Vis {todos.length - 4} til...
                        </Link>
                    )}
                </div>
            ) : null}

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onAddTodo();
                }}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors mt-0.5"
            >
                <div className="w-4 h-4 rounded border border-dashed border-muted-foreground/30 flex items-center justify-center">
                    <Plus size={10} />
                </div>
                <span className="text-[11px] font-medium">Legg til</span>
            </button>
        </div>
    );
}
