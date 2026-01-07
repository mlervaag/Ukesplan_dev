'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Trash2, Calendar, Loader2, Copy, ExternalLink, Info } from 'lucide-react';
import { getISOWeekDetails } from '@/lib/utils/date';
import { toastBus } from '@/lib/utils/toast';

interface ListActionsProps {
    onClear: () => Promise<void>;
    onClearAndSend: (year: number, week: number) => Promise<void>;
    onCopy: () => Promise<void>;
}

export function ListActions({ onClear, onClearAndSend, onCopy }: ListActionsProps) {
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);
    const [isClearSendModalOpen, setIsClearSendModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCopying, setIsCopying] = useState(false);
    const [isSendingToReminders, setIsSendingToReminders] = useState(false);

    const { week, year } = getISOWeekDetails(new Date());

    const handleClear = async () => {
        setIsLoading(true);
        await onClear();
        setIsLoading(false);
        setIsClearModalOpen(false);
    };

    const handleClearAndSend = async () => {
        setIsLoading(true);
        await onClearAndSend(year, week);
        setIsLoading(false);
        setIsClearSendModalOpen(false);
    };

    const handleCopy = async () => {
        setIsCopying(true);
        await onCopy();
        setIsCopying(false);
    };

    const handleSendToReminders = async () => {
        setIsSendingToReminders(true);
        try {
            // 1. Copy to clipboard
            await onCopy();

            // 2. Open Shortcuts deep link
            const shortcutUrl = "shortcuts://run-shortcut?name=Middager%20til%20Påminnelser&input=clipboard";

            // Per technical requirement: Use window.location.href for the deep link
            window.location.href = shortcutUrl;

        } catch (err) {
            toastBus.show("Kunne ikke sende til Påminnelser.", "error");
        } finally {
            setIsSendingToReminders(false);
        }
    };


    return (
        <div className="flex flex-col gap-3 w-full pt-4 border-t">
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    className="flex-1 gap-2 text-destructive border-destructive/20 hover:bg-destructive/10"
                    onClick={() => setIsClearModalOpen(true)}
                >
                    <Trash2 size={18} />
                    <span>Tøm listen</span>
                </Button>

                <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => setIsClearSendModalOpen(true)}
                >
                    <Calendar size={18} />
                    <span>Tøm og send uke</span>
                </Button>
            </div>

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
                    disabled={isSendingToReminders}
                >
                    {isSendingToReminders ? <Loader2 size={18} className="animate-spin" /> : <ExternalLink size={18} />}
                    <span>Send til Påminnelser</span>
                </Button>
            </div>

            <div className="flex gap-2 p-3 bg-muted/50 rounded-radius border text-xs text-muted-foreground">
                <Info size={14} className="shrink-0 mt-0.5" />
                <p>
                    Lag en snarvei i Snarveier som heter «Middager til Påminnelser» som tar utklippstavlen, splitter på linjeskift, og legger til én påminnelse per linje. Denne knappen kjører snarveien.
                </p>
            </div>

            {/* Clear Confirmation Modal */}
            <Modal
                isOpen={isClearModalOpen}
                onClose={() => setIsClearModalOpen(false)}
                title="Tøm handlelisten?"
            >
                <div className="space-y-4">
                    <p className="text-muted-foreground">
                        Dette sletter alle varer i listen, også de du har krysset ut. Starter en ny liste.
                    </p>
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setIsClearModalOpen(false)}>
                            Avbryt
                        </Button>
                        <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={handleClear}
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Tøm listen'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Clear and Send Confirmation Modal */}
            <Modal
                isOpen={isClearSendModalOpen}
                onClose={() => setIsClearSendModalOpen(false)}
                title="Tøm og hent uke?"
            >
                <div className="space-y-4">
                    <p className="text-muted-foreground">
                        Tøm og legg til varer fra uke {week}? Dette sletter alt i listen først og starter en ny liste.
                    </p>
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setIsClearSendModalOpen(false)}>
                            Avbryt
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleClearAndSend}
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Tøm og send'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

