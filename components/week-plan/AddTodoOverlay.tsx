'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface AddTodoOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { title: string; time?: string; responsible: 'he' | 'she' | 'both' }) => Promise<void>;
    loading?: boolean;
}

export function AddTodoOverlay({ isOpen, onClose, onSave, loading }: AddTodoOverlayProps) {
    const [title, setTitle] = useState('');
    const [time, setTime] = useState('');
    const [responsible, setResponsible] = useState<'he' | 'she' | 'both'>('both');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        await onSave({
            title: title.trim(),
            time: time.trim() || undefined,
            responsible
        });

        // Reset and close
        setTitle('');
        setTime('');
        setResponsible('both');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Nytt gjøremål"
            fullScreen={true}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Hva skal gjøres?</label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="f.eks. Vaske badet"
                            required
                            autoFocus
                            maxLength={120}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tid (valgfritt)</label>
                        <Input
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            placeholder="f.eks. 09:00"
                            type="text"
                            inputMode="numeric"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-center block mb-3">Hvem har ansvaret?</label>
                        <div className="flex bg-muted p-1 rounded-radius-lg">
                            <button
                                type="button"
                                onClick={() => setResponsible('he')}
                                className={cn(
                                    "flex-1 py-2 text-sm font-medium rounded-radius transition-all",
                                    responsible === 'he' ? "bg-surface shadow-sm text-primary" : "text-muted-foreground"
                                )}
                            >
                                Magnus
                            </button>
                            <button
                                type="button"
                                onClick={() => setResponsible('she')}
                                className={cn(
                                    "flex-1 py-2 text-sm font-medium rounded-radius transition-all",
                                    responsible === 'she' ? "bg-surface shadow-sm text-primary" : "text-muted-foreground"
                                )}
                            >
                                Nansy
                            </button>
                            <button
                                type="button"
                                onClick={() => setResponsible('both')}
                                className={cn(
                                    "flex-1 py-2 text-sm font-medium rounded-radius transition-all",
                                    responsible === 'both' ? "bg-surface shadow-sm text-primary" : "text-muted-foreground"
                                )}
                            >
                                Begge
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={onClose}
                    >
                        Avbryt
                    </Button>
                    <Button
                        type="submit"
                        className="flex-1"
                        disabled={loading || !title.trim()}
                    >
                        {loading ? 'Lagrer...' : 'Lagre'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
