'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Copy, ExternalLink, Info, Loader2 } from 'lucide-react';
import { toastBus } from '@/lib/utils/toast';

interface TodoListActionsProps {
    onCopy: () => Promise<void>;
}

export function TodoListActions({ onCopy }: TodoListActionsProps) {
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
            const shortcutUrl = "shortcuts://run-shortcut?name=Middager%20til%20Påminnelser&input=clipboard";
            window.location.href = shortcutUrl;
        } catch (err) {
            toastBus.show("Kunne ikke sende til Påminnelser.", "error");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col gap-3 w-full pt-4 border-t">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider ml-1">Kopier til Påminnelser</h3>

            <div className="grid grid-cols-1 gap-2">
                <Button
                    variant="primary"
                    className="w-full gap-2 h-12"
                    onClick={handleCopy}
                    disabled={isCopying}
                >
                    {isCopying ? <Loader2 size={18} className="animate-spin" /> : <Copy size={18} />}
                    <span>Kopier liste</span>
                </Button>

                <Button
                    variant="outline"
                    className="w-full gap-2 h-12 border-primary/20 hover:bg-primary/5"
                    onClick={handleSendToReminders}
                    disabled={isSending}
                >
                    {isSending ? <Loader2 size={18} className="animate-spin" /> : <ExternalLink size={18} />}
                    <span>Åpne Påminnelser</span>
                </Button>
            </div>

            <div className="flex gap-2 p-3 bg-muted/50 rounded-radius border text-xs text-muted-foreground">
                <Info size={14} className="shrink-0 mt-0.5" />
                <p>
                    Kopierer alle gjøremål for denne uken til utklippstavlen. "Åpne Påminnelser" kjører også iOS-snarveien som importerer dem.
                </p>
            </div>
        </div>
    );
}
