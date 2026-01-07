'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Copy, ExternalLink, Info, Loader2 } from 'lucide-react';
import { toastBus } from '@/lib/utils/toast';

interface TodoListActionsProps {
    onCopy: () => Promise<void>;
    onClear: () => Promise<void>;
    hasActiveTodos: boolean;
}

export function TodoListActions({ onCopy, onClear, hasActiveTodos }: TodoListActionsProps) {
    const [isCopying, setIsCopying] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const handleCopy = async () => {
        setIsCopying(true);
        await onCopy();
        setIsCopying(false);
    };

    const handleSendToReminders = async () => {
        setIsSending(true);
        try {
            await onCopy();
            const shortcutUrl = "shortcuts://run-shortcut?name=Gj%C3%B8rem%C3%A5l%20til%20P%C3%A5minnelser&input=clipboard";
            window.location.href = shortcutUrl;
        } catch (err) {
            toastBus.show("Kunne ikke sende til Påminnelser.", "error");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 w-full pt-6 border-t mt-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Handlinger</h3>
                {hasActiveTodos && (
                    <button
                        onClick={onClear}
                        className="text-xs font-semibold text-destructive hover:underline transition-all"
                    >
                        Tøm liste
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                    variant="primary"
                    className="w-full gap-2 h-12 shadow-sm"
                    onClick={handleCopy}
                    disabled={isCopying || !hasActiveTodos}
                >
                    {isCopying ? <Loader2 size={18} className="animate-spin" /> : <Copy size={18} />}
                    <span>Kopier liste</span>
                </Button>

                <Button
                    variant="outline"
                    className="w-full gap-2 h-12 border-primary/20 hover:bg-primary/5 shadow-sm"
                    onClick={handleSendToReminders}
                    disabled={isSending || !hasActiveTodos}
                >
                    {isSending ? <Loader2 size={18} className="animate-spin" /> : <ExternalLink size={18} />}
                    <span>Åpne Påminnelser</span>
                </Button>
            </div>

            <div className="flex gap-2 p-3 bg-muted/50 rounded-radius border text-xs text-muted-foreground shadow-inner">
                <Info size={14} className="shrink-0 mt-0.5" />
                <p>
                    Kopierer aktive gjøremål for denne uken til utklippstavlen i ISO-format. Lag en snarvei i Snarveier som heter "Gjøremål til Påminnelser" for å importere dem direkte.
                </p>
            </div>
        </div>
    );
}
