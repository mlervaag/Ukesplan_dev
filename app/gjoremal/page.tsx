'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { CheckSquare, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import useSWR from 'swr';
import { useState } from 'react';
import { getISOWeekDetails, getWeekDisplay } from '@/lib/utils/date';
import { WeekDayGroup } from '@/components/todos/WeekDayGroup';
import { Button } from '@/components/ui/Button';
import { toastBus } from '@/lib/utils/toast';

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        const error = new Error('An error occurred while fetching the data.') as any;
        error.info = await res.json();
        error.status = res.status;
        throw error;
    }
    return res.json();
};

export default function GjoremalPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const { year, week } = getISOWeekDetails(currentDate);
    const { range: weekRangeText } = getWeekDisplay(year, week);

    const { data, mutate, isLoading, error } = useSWR(`/api/todos?year=${year}&week=${week}`, fetcher);

    const isUnauthorized = error?.status === 401;

    const navigateWeek = (offset: number) => {
        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + (offset * 7));
        setCurrentDate(nextDate);
    };

    if (error) {
        return (
            <>
                <PageHeader title="Gjøremål" />
                <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                    <p className="text-destructive font-medium">
                        {isUnauthorized ? 'Du er ikke logget inn' : 'Kunne ikke laste gjøremål'}
                    </p>
                    {isUnauthorized ? (
                        <Button onClick={() => window.location.href = '/login'} variant="outline">Logg inn</Button>
                    ) : (
                        <button onClick={() => mutate()} className="text-primary underline font-medium">Prøv igjen</button>
                    )}
                </div>
            </>
        );
    }

    // Group todos by dayOfWeek (1-7)
    const groupedTodos: Record<number, any[]> = {};
    for (let i = 1; i <= 7; i++) groupedTodos[i] = [];

    if (data) {
        data.forEach((todo: any) => {
            const day = todo.weekPlanDay.dayOfWeek;
            groupedTodos[day].push(todo);
        });
    }

    const hasTodos = data && data.length > 0;

    return (
        <>
            <PageHeader title="Gjøremål">
                <div className="flex items-center space-x-2 mt-2">
                    <button
                        onClick={() => navigateWeek(-1)}
                        className="p-1 hover:bg-muted rounded-full transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm font-medium min-w-[140px] text-center">
                        {weekRangeText}
                    </span>
                    <button
                        onClick={() => navigateWeek(1)}
                        className="p-1 hover:bg-muted rounded-full transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </PageHeader>

            <div className="p-4 space-y-8 pb-32 max-w-2xl mx-auto">
                {isLoading && !data ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : !hasTodos ? (
                    <EmptyState
                        icon={CheckSquare}
                        title="Ingen gjøremål denne uken"
                        description="Planlegg uken for å se faste gjøremål, eller legg til nye i ukeplanen."
                    />
                ) : (
                    <div className="space-y-8">
                        {[1, 2, 3, 4, 5, 6, 7].map(day => (
                            groupedTodos[day].length > 0 && (
                                <WeekDayGroup
                                    key={day}
                                    dayOfWeek={day}
                                    todos={groupedTodos[day]}
                                    onUpdate={() => mutate()}
                                />
                            )
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
