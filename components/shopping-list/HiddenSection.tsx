'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';

interface HiddenSectionProps {
    items: any[];
    onRestore: (id: string) => Promise<void>;
}

export function HiddenSection({ items, onRestore }: HiddenSectionProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (items.length === 0) return null;

    return (
        <div className="space-y-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors px-1"
            >
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span>Skjulte varer ({items.length})</span>
            </button>

            {isOpen && (
                <div className="space-y-1 pl-1">
                    {items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-accent/10 border border-transparent hover:border-accent/20 transition-all group">
                            <div className="flex items-center gap-2 text-muted-foreground line-through decoration-muted-foreground/50">
                                <span className="tabular-nums">{parseFloat(item.quantity)}{item.unit}</span>
                                <span>{item.displayName}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRestore(item.id)}
                                className="h-7 px-2 text-xs gap-1 transition-opacity"
                            >
                                <RotateCcw size={12} />
                                Gjenopprett
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
