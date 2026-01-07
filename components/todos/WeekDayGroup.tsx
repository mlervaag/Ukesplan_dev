'use client';

import { getDayName } from '@/lib/utils/date';
import { TodoListItem } from './TodoListItem';

interface WeekDayGroupProps {
    dayOfWeek: number;
    todos: any[];
    onUpdate: () => void;
}

export function WeekDayGroup({ dayOfWeek, todos, onUpdate }: WeekDayGroupProps) {
    return (
        <section className="space-y-3">
            <h3 className="font-semibold text-lg text-primary/80 sticky top-[72px] bg-background/95 backdrop-blur-sm py-2">
                {getDayName(dayOfWeek)}
            </h3>
            <div className="space-y-2">
                {todos.map(todo => (
                    <TodoListItem
                        key={todo.id}
                        todo={todo}
                        onUpdate={onUpdate}
                    />
                ))}
            </div>
        </section>
    );
}
