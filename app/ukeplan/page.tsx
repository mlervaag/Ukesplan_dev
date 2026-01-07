'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { WeekSelector } from '@/components/week-plan/WeekSelector';
import { DayCell } from '@/components/week-plan/DayCell';
import { DinnerPicker } from '@/components/week-plan/DinnerPicker';
import { CopyWeekModal } from '@/components/week-plan/CopyWeekModal';
import { getISOWeekDetails } from '@/lib/utils/date';
import { toastBus } from '@/lib/utils/toast';
import { AddTodoOverlay } from '@/components/week-plan/AddTodoOverlay';
import { Copy, Send, Loader2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function UkeplanPage() {
    const [date, setDate] = useState(new Date());
    const { week, year } = getISOWeekDetails(date);

    const { data: plan, mutate, isLoading, error } = useSWR(`/api/week-plans?year=${year}&week=${week}`, fetcher);

    const isUnauthorized = error?.status === 401;

    const [activeDayId, setActiveDayId] = useState<string | null>(null);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [sendWeekLoading, setSendWeekLoading] = useState(false);
    const [pendingDayId, setPendingDayId] = useState<string | null>(null);
    const [pendingClearDayId, setPendingClearDayId] = useState<string | null>(null);
    const [pendingSendDayId, setPendingSendDayId] = useState<string | null>(null);
    const [isTodoOverlayOpen, setIsTodoOverlayOpen] = useState(false);
    const [todoLoading, setTodoLoading] = useState(false);

    const handleWeekChange = (newYear: number, newWeek: number) => {
        // Construct a date for the new week/year
        const d = new Date(newYear, 0, 4);
        d.setDate(d.getDate() + (newWeek - 1) * 7);
        setDate(d);
    };

    const onAssign = async (dinnerId: string) => {
        if (!activeDayId || pendingDayId) return;

        // Set pending immediately for the specific day
        setPendingDayId(activeDayId);
        setIsPickerOpen(false);

        try {
            const res = await fetch('/api/week-plans/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dayId: activeDayId, dinnerId }),
            });
            if (res.ok) {
                const result = await res.json();
                // Wait for mutate to complete before clearing pending
                await mutate();
                toastBus.show(`Lagt til ${result.added} varer, hoppet over ${result.skipped}`, 'success');
            } else {
                // Handle error response
                toastBus.show('Kunne ikke legge til middag', 'error');
            }
        } catch (error) {
            // Handle network/unexpected errors
            toastBus.show('Noe gikk galt, prøv igjen', 'error');
        } finally {
            setPendingDayId(null);
        }
    };

    const onClearDay = async (dayId: string) => {
        if (pendingClearDayId) return;
        setPendingClearDayId(dayId);
        try {
            const res = await fetch('/api/week-plans/clear-day', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dayId }),
            });
            if (res.ok) await mutate();
        } finally {
            setPendingClearDayId(null);
        }
    };

    const onSendDay = async (dayId: string) => {
        if (pendingSendDayId) return;
        setPendingSendDayId(dayId);
        try {
            const res = await fetch('/api/shopping-list/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dayId }),
            });
            if (res.ok) {
                const result = await res.json();
                toastBus.show(`Lagt til ${result.added} varer, hoppet over ${result.skipped}`, 'success');
            }
        } finally {
            setPendingSendDayId(null);
        }
    };

    const onSendWeek = async () => {
        setSendWeekLoading(true);
        try {
            const res = await fetch('/api/shopping-list/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ year, week }),
            });
            if (res.ok) {
                const result = await res.json();
                toastBus.show(`Lagt til ${result.added} varer, hoppet over ${result.skipped}`, 'success');
            }
        } finally {
            setSendWeekLoading(false);
        }
    };

    const onCopyWeek = async (fromYear: number, fromWeek: number) => {
        setActionLoading(true);
        try {
            const res = await fetch('/api/week-plans/copy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fromYear, fromWeek, toYear: year, toWeek: week }),
            });
            if (res.ok) {
                mutate();
                setIsCopyModalOpen(false);
                toastBus.show('Plan kopiert!', 'success');
            }
        } finally {
            setActionLoading(false);
        }
    };

    const onAddTodo = async (data: { title: string; time?: string; responsible: 'he' | 'she' | 'both' }) => {
        if (!activeDayId || todoLoading) return;
        setTodoLoading(true);
        try {
            const res = await fetch('/api/todos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    weekPlanDayId: activeDayId,
                    ...data
                }),
            });
            if (res.ok) {
                await mutate();
                setIsTodoOverlayOpen(false);
            } else {
                toastBus.show('Kunne ikke lagre gjøremål', 'error');
            }
        } catch (error) {
            toastBus.show('Noe gikk galt', 'error');
        } finally {
            setTodoLoading(false);
        }
    };

    const onToggleTodo = async (todoId: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/todos/${todoId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: !currentStatus }),
            });
            if (res.ok) {
                await mutate();
            } else {
                toastBus.show('Kunne ikke oppdatere', 'error');
            }
        } catch (error) {
            toastBus.show('Nettverksfeil', 'error');
        }
    };

    return (
        <>
            <PageHeader title="Ukeplan">
                <div className="flex gap-2">
                    <Button variant="ghost" className="flex gap-2 h-9 px-3" onClick={() => setIsCopyModalOpen(true)}>
                        <Copy size={18} />
                        <span className="text-sm font-medium">Kopier uke</span>
                    </Button>
                    <Button variant="ghost" className="flex gap-2 h-9 px-3" onClick={onSendWeek} disabled={sendWeekLoading}>
                        {sendWeekLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        <span className="text-sm font-medium">Send uke</span>
                    </Button>
                </div>
            </PageHeader>

            <WeekSelector year={year} week={week} onChange={handleWeekChange} />

            <div className="p-4 space-y-3 pb-24">
                {error ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                        <p className="text-destructive font-medium">
                            {isUnauthorized ? 'Du er ikke logget inn' : 'Kunne ikke laste ukeplanen'}
                        </p>
                        {isUnauthorized ? (
                            <Button onClick={() => window.location.href = '/login'} variant="outline">Logg inn</Button>
                        ) : (
                            <button onClick={() => mutate()} className="text-primary underline font-medium">Prøv igjen</button>
                        )}
                    </div>
                ) : isLoading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    plan?.days?.slice().sort((a: any, b: any) => a.dayOfWeek - b.dayOfWeek).map((day: any) => (
                        <DayCell
                            key={day.id}
                            dayId={day.id}
                            dayOfWeek={day.dayOfWeek}
                            dinnerId={day.dinnerId}
                            dinnerName={day.dinnerNameSnapshot}
                            dinnerIcon={day.dinnerIconSnapshot}
                            todos={day.todos}
                            isPending={pendingDayId === day.id || pendingClearDayId === day.id || pendingSendDayId === day.id}
                            onAssign={() => { setActiveDayId(day.id); setIsPickerOpen(true); }}
                            onClear={() => onClearDay(day.id)}
                            onSend={() => onSendDay(day.id)}
                            onToggleTodo={onToggleTodo}
                            onAddTodo={() => { setActiveDayId(day.id); setIsTodoOverlayOpen(true); }}
                        />
                    ))
                )}
            </div>

            <DinnerPicker
                isOpen={isPickerOpen}
                onSelect={onAssign}
                onClose={() => setIsPickerOpen(false)}
            />

            <Modal
                isOpen={isCopyModalOpen}
                onClose={() => setIsCopyModalOpen(false)}
                title="Kopier uke"
            >
                <CopyWeekModal
                    currentYear={year}
                    currentWeek={week}
                    onCopy={onCopyWeek}
                    loading={actionLoading}
                />
            </Modal>

            <AddTodoOverlay
                isOpen={isTodoOverlayOpen}
                onClose={() => setIsTodoOverlayOpen(false)}
                onSave={onAddTodo}
                loading={todoLoading}
            />
        </>
    );
}
