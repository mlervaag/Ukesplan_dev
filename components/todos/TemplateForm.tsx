'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Loader2, Trash2 } from 'lucide-react';
import { toastBus } from '@/lib/utils/toast';
import { clsx } from 'clsx';

interface TemplateFormProps {
    isOpen: boolean;
    onClose: () => void;
    template?: any;
    onSaved: () => void;
}

export function TemplateForm({ isOpen, onClose, template, onSaved }: TemplateFormProps) {
    const [title, setTitle] = useState('');
    const [dayOfWeek, setDayOfWeek] = useState(1);
    const [time, setTime] = useState('');
    const [responsible, setResponsible] = useState<'he' | 'she' | 'both'>('both');
    const [intervalWeeks, setIntervalWeeks] = useState(1);
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (template) {
            setTitle(template.title);
            setDayOfWeek(template.dayOfWeek);
            setTime(template.time || '');
            setResponsible(template.responsible);
            setIntervalWeeks(template.intervalWeeks);
            setEndDate(template.endDate ? new Date(template.endDate).toISOString().split('T')[0] : '');
        } else {
            setTitle('');
            setDayOfWeek(new Date().getDay() || 7);
            setTime('');
            setResponsible('both');
            setIntervalWeeks(1);
            setEndDate('');
        }
    }, [template, isOpen]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const data = {
            title,
            dayOfWeek,
            time: time || null,
            responsible,
            intervalWeeks,
            endDate: endDate || null
        };

        try {
            const url = template ? `/api/todo-templates/${template.id}` : '/api/todo-templates';
            const method = template ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                toastBus.show(template ? 'Oppgave oppdatert' : 'Oppgave opprettet', 'success');
                onSaved();
                onClose();
            } else {
                const err = await res.json();
                toastBus.show(err.error || 'Noe gikk galt', 'error');
            }
        } catch (e) {
            toastBus.show('Kunne ikke lagre oppgaven', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!template) return;
        if (!confirm('Er du sikker på at du vil slette denne faste oppgaven?')) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/todo-templates/${template.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toastBus.show('Oppgave slettet', 'success');
                onSaved();
                onClose();
            }
        } catch (e) {
            toastBus.show('Kunne ikke slette oppgaven', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={template ? 'Rediger fast oppgave' : 'Ny fast oppgave'} fullScreen={true}>
            <form onSubmit={handleSave} className="space-y-6 pb-20">
                <div className="space-y-2">
                    <label className="text-sm font-semibold ml-1">Tittel</label>
                    <input
                        autoFocus
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="f.eks. Vaske badet"
                        className="w-full p-4 bg-secondary/50 rounded-2xl border-none focus:ring-2 focus:ring-primary text-lg"
                        required
                        maxLength={120}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold ml-1">Ukedag</label>
                        <select
                            value={dayOfWeek}
                            onChange={(e) => setDayOfWeek(parseInt(e.target.value))}
                            className="w-full p-4 bg-secondary/50 rounded-2xl border-none focus:ring-2 focus:ring-primary appearance-none"
                        >
                            <option value={1}>Mandag</option>
                            <option value={2}>Tirsdag</option>
                            <option value={3}>Onsdag</option>
                            <option value={4}>Torsdag</option>
                            <option value={5}>Fredag</option>
                            <option value={6}>Lørdag</option>
                            <option value={7}>Søndag</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold ml-1">Tidspunkt (valgfritt)</label>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full p-4 bg-secondary/50 rounded-2xl border-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-semibold ml-1">Hvem har ansvar?</label>
                    <div className="grid grid-cols-3 gap-2 p-1 bg-secondary/50 rounded-2xl">
                        {(['he', 'she', 'both'] as const).map((r) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => setResponsible(r)}
                                className={clsx(
                                    "py-3 rounded-xl font-semibold transition-all text-sm",
                                    responsible === r
                                        ? "bg-surface shadow-sm text-primary"
                                        : "text-muted-foreground"
                                )}
                            >
                                {r === 'he' ? 'Magnus' : r === 'she' ? 'Nansy' : 'Begge'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold ml-1">Gjentakelse</label>
                        <select
                            value={intervalWeeks}
                            onChange={(e) => setIntervalWeeks(parseInt(e.target.value))}
                            className="w-full p-4 bg-secondary/50 rounded-2xl border-none focus:ring-2 focus:ring-primary appearance-none"
                        >
                            <option value={1}>Hver uke</option>
                            <option value={2}>Annenhver uke</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold ml-1">Sluttdato (valgfritt)</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full p-4 bg-secondary/50 rounded-2xl border-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface/80 backdrop-blur-md border-t flex gap-3">
                    {template && (
                        <Button
                            type="button"
                            variant="outline"
                            className="w-14 items-center justify-center border-destructive/20 text-destructive"
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            <Trash2 size={20} />
                        </Button>
                    )}
                    <Button type="submit" className="flex-1 py-6 rounded-2xl text-lg font-bold" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" /> : 'Lagre oppgave'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
