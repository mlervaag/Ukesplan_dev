'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShoppingCart, Loader2 } from 'lucide-react';
import useSWR from 'swr';
import { AddItemInput } from '@/components/shopping-list/AddItemInput';
import { ListItem } from '@/components/shopping-list/ListItem';
import { HiddenSection } from '@/components/shopping-list/HiddenSection';
import { ListActions } from '@/components/shopping-list/ListActions';
import { Button } from '@/components/ui/Button';
import { toastBus } from '@/lib/utils/toast';
import { formatShoppingListForClipboard } from '@/lib/domain/shoppingList';

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

export default function HandlelistePage() {
    const { data, mutate, isLoading, error } = useSWR('/api/shopping-list', fetcher);

    const isUnauthorized = error?.status === 401;

    const onAdd = async (item: { name: string; quantity: string; unit: string }) => {
        try {
            const res = await fetch('/api/shopping-list/items', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item),
            });
            if (res.ok) {
                const result = await res.json();
                mutate();
                if (result.added > 0) {
                    toastBus.show(`Lagt til ${item.name}`, 'success');
                } else if (result.skipped > 0) {
                    toastBus.show(`${item.name} er allerede i listen (eller skjult)`, 'info');
                }
            }
        } catch (e) {
            toastBus.show('Kunne ikke legge til vare', 'error');
        }
    };

    const onUpdate = async (id: string, updates: { quantity?: string | number; unit?: string }) => {
        try {
            const res = await fetch(`/api/shopping-list/items/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (res.ok) mutate();
        } catch (e) {
            toastBus.show('Kunne ikke oppdatere vare', 'error');
        }
    };

    const onToggleHidden = async (id: string, hidden: boolean) => {
        try {
            const res = await fetch(`/api/shopping-list/items/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hidden }),
            });
            if (res.ok) {
                mutate();
                if (hidden) {
                    toastBus.show('Vare skjult', 'success');
                } else {
                    toastBus.show('Vare gjenopprettet', 'success');
                }
            }
        } catch (e) {
            toastBus.show('Noe gikk galt', 'error');
        }
    };

    const onClear = async () => {
        try {
            const res = await fetch('/api/shopping-list', {
                method: 'DELETE',
            });
            if (res.ok) {
                mutate();
                toastBus.show('Listen er tømt', 'success');
            }
        } catch (e) {
            toastBus.show('Kunne ikke tømme listen', 'error');
        }
    };

    const onClearAndSend = async (year: number, week: number) => {
        try {
            const res = await fetch('/api/shopping-list/clear-send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ year, week }),
            });
            if (res.ok) {
                const result = await res.json();
                mutate();
                toastBus.show(`Lagt til ${result.added} varer fra uke ${week}`, 'success');
            }
        } catch (e) {
            toastBus.show('Kunne ikke hente ukeplan', 'error');
        }
    };

    const onCopy = async () => {
        if (!data || data.active.length === 0) {
            toastBus.show('Ingen varer å kopiere', 'info');
            return;
        }

        try {
            const text = formatShoppingListForClipboard(data.active);
            await navigator.clipboard.writeText(text);
            toastBus.show('Kopiert til utklippstavlen', 'success');
        } catch (e) {
            console.error('Copy failed:', e);
            toastBus.show('Kunne ikke kopiere. Prøv igjen.', 'error');
        }
    };

    if (error) {
        return (
            <>
                <PageHeader title="Handleliste" />
                <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                    <p className="text-destructive font-medium">
                        {isUnauthorized ? 'Du er ikke logget inn' : 'Kunne ikke laste handlelisten'}
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

    const hasItems = data && (data.active.length > 0 || data.hidden.length > 0);

    return (
        <>
            <PageHeader title="Handleliste" />

            <div className="p-4 space-y-6 pb-24 max-w-2xl mx-auto">
                <AddItemInput onAdd={onAdd} />

                {isLoading && !data ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : !hasItems ? (
                    <EmptyState
                        icon={ShoppingCart}
                        title="Handlelisten er tom"
                        description="Legg til varer manuelt eller send middagene fra ukeplanen hit."
                    />
                ) : (
                    <div className="space-y-6">
                        {data.active.length > 0 && (
                            <div className="space-y-2">
                                {data.active.map((item: any) => (
                                    <ListItem
                                        key={item.id}
                                        item={item}
                                        onUpdate={onUpdate}
                                        onHide={() => onToggleHidden(item.id, true)}
                                    />
                                ))}
                            </div>
                        )}

                        <HiddenSection
                            items={data.hidden}
                            onRestore={(id) => onToggleHidden(id, false)}
                        />

                        <ListActions
                            onClear={onClear}
                            onClearAndSend={onClearAndSend}
                            onCopy={onCopy}
                        />
                    </div>
                )}
            </div>
        </>
    );
}
