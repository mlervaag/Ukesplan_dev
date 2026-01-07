'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { CheckSquare, Loader2 } from 'lucide-react';
import useSWR from 'swr';
import { getISOWeekDetails, getWeekDisplay } from '@/lib/utils/date';
import { WeekDayGroup } from '@/components/todos/WeekDayGroup';
import { TodoListActions } from '@/components/todos/TodoListActions';
import { HiddenTodosSection } from '@/components/todos/HiddenTodosSection';
import { toastBus } from '@/lib/utils/toast';
import { formatTodosForClipboard } from '@/lib/domain/todos';
import { Button } from '@/components/ui/Button';

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
    const { year, week } = getISOWeekDetails(new Date());
    const { range: weekRangeText } = getWeekDisplay(year, week);

    const { data, mutate, isLoading, error } = useSWR(`/api/todos?year=${year}&week=${week}&includeHidden=true`, fetcher);

    const isUnauthorized = error?.status === 401;

    const onCopy = async () => {
        const activeTodos = data?.filter((t: any) => !t.hidden) || [];
        if (activeTodos.length === 0) {
            toastBus.show('Ingen aktive gjøremål å kopiere', 'info');
            return;
        }

        try {
            const text = formatTodosForClipboard(data);
            await navigator.clipboard.writeText(text);
            toastBus.show('Kopiert til utklippstavlen', 'success');
        } catch (e) {
            console.error('Copy failed:', e);
            toastBus.show('Kunne ikke kopiere. Prøv igjen.', 'error');
        }
    };

    const onClear = async () => {
        if (!confirm('Er du sikker på at du vil tømme listen for denne uken?')) return;
        try {
            const res = await fetch('/api/todos/clear-week', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ year, week }),
            });
            if (res.ok) {
                mutate();
                toastBus.show('Listen er tømt', 'success');
            }
        } catch (e) {
            toastBus.show('Kunne ikke tømme listen', 'error');
        }
    };

    const onRestore = async (id: string) => {
        try {
            const res = await fetch(`/api/todos/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hidden: false }),
            });
            if (res.ok) {
                mutate();
                toastBus.show('Gjøremål gjenopprettet', 'success');
            }
        } catch (e) {
            toastBus.show('Kunne ikke gjenopprette', 'error');
        }
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

    const activeTodos = data?.filter((t: any) => !t.hidden) || [];
    const hiddenTodos = data?.filter((t: any) => t.hidden) || [];
    const hasTodos = (activeTodos.length > 0 || hiddenTodos.length > 0);

    return (
        <>
            <PageHeader title="Gjøremål">
                <div className="mt-1 text-sm font-medium text-muted-foreground">
                    {weekRangeText}
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
                    <div className="space-y-6">
                        {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                            const dayTodos = activeTodos.filter((t: any) => t.weekPlanDay.dayOfWeek === day);
                            if (dayTodos.length === 0) return null;

                            return (
                                <WeekDayGroup
                                    key={day}
                                    dayOfWeek={day}
                                    todos={dayTodos}
                                    onUpdate={() => mutate()}
                                />
                            );
                        })}

                        <HiddenTodosSection
                            todos={hiddenTodos}
                            onRestore={onRestore}
                        />

                        <TodoListActions onCopy={onCopy} onClear={onClear} hasActiveTodos={activeTodos.length > 0} />
                    </div>
                )}
            </div>
        </>
    );
}
