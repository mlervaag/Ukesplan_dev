'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { toastBus } from '@/lib/utils/toast';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Database, Download, Upload, Trash2, AlertTriangle, Loader2, Sun, Moon, Monitor, LogOut } from 'lucide-react';

export default function InnstillingerPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [resetStep, setResetStep] = useState(1);
    const { theme, setTheme } = useTheme();

    const onExport = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/data/export');
            if (!res.ok) throw new Error();
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `middager-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            toastBus.show('Eksport fullført', 'success');
        } catch (e) {
            toastBus.show('Eksport feilet', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const onImportClick = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPendingFile(file);
        setIsImportModalOpen(true);
        e.target.value = ''; // Reset input to allow same file selection
    };

    const confirmImport = async () => {
        if (!pendingFile) return;
        setIsImportModalOpen(false);
        setIsLoading(true);
        try {
            const text = await pendingFile.text();
            const data = JSON.parse(text);
            const res = await fetch('/api/data/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                toastBus.show('Import fullført!', 'success');
                setTimeout(() => window.location.reload(), 1000);
            } else {
                const error = await res.json();
                toastBus.show(error.error || 'Import feilet', 'error');
            }
        } catch (e) {
            toastBus.show('Ugyldig filformat', 'error');
        } finally {
            setIsLoading(false);
            setPendingFile(null);
        }
    };

    const onDeleteAllDinners = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/dinners', { method: 'DELETE' });
            if (res.ok) {
                toastBus.show('Alle middager er slettet', 'success');
                setIsDeleteModalOpen(false);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const onLogout = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth', { method: 'DELETE' });
            if (res.ok) {
                toastBus.show('Du er nå logget ut', 'success');
                window.location.href = '/login';
            }
        } finally {
            setIsLoading(false);
        }
    };

    const onResetApp = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/data/reset', { method: 'POST' });
            if (res.ok) {
                toastBus.show('Appen er nullstilt', 'success');
                window.location.href = '/';
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <PageHeader title="Innstillinger" />

            <div className="p-4 space-y-8 pb-24 max-w-2xl mx-auto">
                {/* Account Section */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <LogOut size={20} className="text-primary" />
                        Konto
                    </h2>
                    <Button
                        variant="outline"
                        className="w-full justify-start gap-4 h-14"
                        onClick={onLogout}
                        disabled={isLoading}
                    >
                        <LogOut size={24} />
                        <div className="text-left">
                            <div className="font-bold">Logg ut</div>
                            <div className="text-xs text-muted-foreground">Avslutt din økt på denne enheten</div>
                        </div>
                    </Button>
                </section>

                <hr />

                {/* Theme Section */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Sun size={20} className="text-primary" />
                        Tema
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Velg tema">
                        <button
                            type="button"
                            role="radio"
                            aria-checked={theme === 'light'}
                            onClick={() => setTheme('light')}
                            className={`flex flex-col items-center gap-2 p-4 rounded-radius border transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${theme === 'light' ? 'bg-primary/10 border-primary' : 'bg-surface border-border hover:bg-accent/50'
                                }`}
                        >
                            <Sun size={24} className={theme === 'light' ? 'text-primary' : 'text-muted-foreground'} />
                            <span className={`text-sm font-medium ${theme === 'light' ? 'text-primary' : ''}`}>Lys</span>
                        </button>
                        <button
                            type="button"
                            role="radio"
                            aria-checked={theme === 'dark'}
                            onClick={() => setTheme('dark')}
                            className={`flex flex-col items-center gap-2 p-4 rounded-radius border transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${theme === 'dark' ? 'bg-primary/10 border-primary' : 'bg-surface border-border hover:bg-accent/50'
                                }`}
                        >
                            <Moon size={24} className={theme === 'dark' ? 'text-primary' : 'text-muted-foreground'} />
                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-primary' : ''}`}>Mørk</span>
                        </button>
                        <button
                            type="button"
                            role="radio"
                            aria-checked={theme === 'system'}
                            onClick={() => setTheme('system')}
                            className={`flex flex-col items-center gap-2 p-4 rounded-radius border transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${theme === 'system' ? 'bg-primary/10 border-primary' : 'bg-surface border-border hover:bg-accent/50'
                                }`}
                        >
                            <Monitor size={24} className={theme === 'system' ? 'text-primary' : 'text-muted-foreground'} />
                            <span className={`text-sm font-medium ${theme === 'system' ? 'text-primary' : ''}`}>System</span>
                        </button>
                    </div>
                </section>

                <hr />

                {/* Export/Import Section */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Download size={20} className="text-primary" />
                        Eksport og Import
                    </h2>
                    <div className="grid grid-cols-1 gap-3">
                        <Button
                            variant="outline"
                            className="justify-start gap-4 h-14"
                            onClick={onExport}
                            disabled={isLoading}
                        >
                            <Download size={24} />
                            <div className="text-left">
                                <div className="font-bold">Eksportér JSON</div>
                                <div className="text-xs text-muted-foreground">Last ned alle dine data som en fil</div>
                            </div>
                        </Button>

                        <div className="relative">
                            <input
                                type="file"
                                accept=".json"
                                onChange={onImportClick}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                disabled={isLoading}
                            />
                            <Button
                                variant="outline"
                                className="justify-start gap-4 h-14 w-full"
                                disabled={isLoading}
                            >
                                <Upload size={24} />
                                <div className="text-left">
                                    <div className="font-bold">Importér JSON</div>
                                    <div className="text-xs text-muted-foreground">Gjenopprett data fra en eksport-fil</div>
                                </div>
                            </Button>
                        </div>
                    </div>
                </section>

                <hr />

                {/* Data Management Section */}
                <section className="space-y-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Database size={20} className="text-primary" />
                        Datahåndtering
                    </h2>
                    <div className="grid grid-cols-1 gap-3">
                        <Button
                            variant="outline"
                            className="justify-start gap-4 h-14 text-destructive border-destructive/20 hover:bg-destructive/5"
                            onClick={() => setIsDeleteModalOpen(true)}
                            disabled={isLoading}
                        >
                            <Trash2 size={24} />
                            <div className="text-left">
                                <div className="font-bold">Slett alle middager</div>
                                <div className="text-xs opacity-70">Sletter alle middagsideer, men beholder ukeplanen</div>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="justify-start gap-4 h-14 text-destructive border-destructive/20 hover:bg-destructive/10"
                            onClick={() => { setResetStep(1); setIsResetModalOpen(true); }}
                            disabled={isLoading}
                        >
                            <AlertTriangle size={24} />
                            <div className="text-left">
                                <div className="font-bold">Nullstill appen</div>
                                <div className="text-xs opacity-70">Sletter ALT (middager, planer, handleliste)</div>
                            </div>
                        </Button>
                    </div>
                </section>

                <div className="text-center pt-8">
                    <p className="text-xs text-muted-foreground">Versjon 4.1.0 (Hardened)</p>
                </div>
            </div>

            {/* Import Confirmation Modal */}
            <Modal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                title="Bekreft import"
            >
                <div className="space-y-4">
                    <p className="text-muted-foreground">
                        Dette vil <span className="font-bold text-foreground">slette alt nåværende data</span> og erstatte det med innholdet i filen
                        {pendingFile && <span className="italic text-foreground"> "{pendingFile.name}"</span>}.
                    </p>
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-radius text-destructive text-sm font-medium">
                        Denne operasjonen kan ikke angres.
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setIsImportModalOpen(false)}>
                            Avbryt
                        </Button>
                        <Button variant="primary" className="flex-1" onClick={confirmImport}>
                            Gjennomfør import
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Slett alle middager?"
            >
                <div className="space-y-4">
                    <p className="text-muted-foreground">
                        Dette vil slette alle lagrede middager og deres ingredienser permanent.
                        Ukeplaner vil bli beholdt, men de vil ikke lenger være koblet til middagene.
                    </p>
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setIsDeleteModalOpen(false)}>
                            Avbryt
                        </Button>
                        <Button variant="primary" className="flex-1 bg-destructive hover:bg-destructive/90 text-white" onClick={onDeleteAllDinners}>
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Slett alt'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Reset App Modal (Double Confirmation) */}
            <Modal
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
                title="Nullstill appen?"
            >
                <div className="space-y-4">
                    {resetStep === 1 ? (
                        <>
                            <p className="text-muted-foreground">
                                Er du sikker på at du vil slette alt? Dette kan ikke angres uten en backup-fil.
                            </p>
                            <Button variant="outline" className="w-full" onClick={() => setResetStep(2)}>
                                Ja, fortsett
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-radius text-destructive text-sm font-bold flex gap-2">
                                <AlertTriangle size={20} />
                                Siste advarsel: Alt slettes permanent!
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => setIsResetModalOpen(false)}>
                                    Avbryt
                                </Button>
                                <Button variant="primary" className="flex-1 bg-destructive hover:bg-destructive/90 text-white" onClick={onResetApp}>
                                    {isLoading ? <Loader2 className="animate-spin" /> : 'Slett ALT'}
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </>
    );
}
