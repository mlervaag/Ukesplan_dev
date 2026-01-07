'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import useSWR from 'swr';

interface DinnerPickerProps {
    isOpen: boolean;
    onSelect: (dinnerId: string) => void;
    onClose: () => void;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function DinnerPicker({ isOpen, onSelect, onClose }: DinnerPickerProps) {
    const { data: dinners, isLoading } = useSWR('/api/dinners', fetcher);
    const [search, setSearch] = useState('');
    const [mounted, setMounted] = useState(false);

    // Mount check for SSR
    if (typeof window !== 'undefined' && !mounted) {
        setMounted(true);
    }

    if (!isOpen || !mounted) return null;

    const filteredDinners = dinners?.filter((d: any) =>
        d.name.toLowerCase().includes(search.toLowerCase())
    );

    return createPortal(
        <div className="fixed inset-0 z-50 flex flex-col bg-background" style={{ height: '100dvh' }}>
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-surface border-b shadow-sm">
                <div className="flex items-center justify-between px-4 py-3">
                    <h2 className="text-lg font-semibold">Velg middag</h2>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X size={20} />
                    </Button>
                </div>
                <div className="px-4 pb-3 relative">
                    <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input
                        placeholder="Søk i middager..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-7 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pb-safe">
                <div className="p-4 space-y-2">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Laster middager...</div>
                    ) : filteredDinners?.length > 0 ? (
                        filteredDinners.map((dinner: any) => (
                            <button
                                key={dinner.id}
                                onClick={() => {
                                    onSelect(dinner.id);
                                    onClose();
                                }}
                                className="w-full text-left p-4 rounded-radius border bg-surface hover:bg-accent active:scale-[0.98] transition-all flex items-center gap-3"
                            >
                                <span className="text-2xl">{dinner.icon || '🍽️'}</span>
                                <div>
                                    <div className="font-medium">{dinner.name}</div>
                                    {dinner.ingredients && (
                                        <div className="text-xs text-muted-foreground mt-0.5">
                                            {dinner.ingredients.length} ingredienser
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">
                            {dinners?.length === 0 ? 'Ingen middager opprettet ennå.' : 'Ingen middager funnet.'}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
