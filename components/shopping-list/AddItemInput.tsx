'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { UnitSelect } from '@/components/ui/UnitSelect';
import { Plus, Loader2 } from 'lucide-react';
import { DEFAULT_UNIT } from '@/lib/constants/units';

interface AddItemInputProps {
    onAdd: (item: { name: string; quantity: string; unit: string }) => Promise<void>;
}

export function AddItemInput({ onAdd }: AddItemInputProps) {
    const [name, setName] = useState('');
    const [qty, setQty] = useState('1');
    const [unit, setUnit] = useState<string>(DEFAULT_UNIT);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (name.length < 2) {
                setSuggestions([]);
                return;
            }
            const res = await fetch(`/api/shopping-list/suggestions?q=${encodeURIComponent(name)}`);
            if (res.ok) {
                const data = await res.json();
                setSuggestions(data);
                setShowSuggestions(data.length > 0);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [name]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        await onAdd({ name: name.trim(), quantity: qty || '1', unit: unit.trim() });
        setName('');
        setQty('1');
        setUnit(DEFAULT_UNIT);
        setShowSuggestions(false);
        setLoading(false);
    };

    return (
        <div className="relative space-y-2">
            <form onSubmit={handleSubmit} className="flex gap-1.5 p-1.5 bg-surface border rounded-radius-lg shadow-sm">
                <Input
                    className="flex-grow border-none bg-transparent focus-visible:ring-0 placeholder:text-muted"
                    placeholder="Hva skal du handle?"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => name.length >= 2 && setShowSuggestions(true)}
                />

                <div className="flex items-center gap-1 px-1 border-l">
                    <Input
                        type="number"
                        step="1"
                        min="1"
                        className="w-10 h-8 text-center bg-transparent border-none focus-visible:ring-0 tabular-nums text-sm"
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                        placeholder="1"
                    />
                    <UnitSelect
                        value={unit}
                        onChange={setUnit}
                        className="h-8 w-16 text-xs border-none bg-transparent"
                    />
                </div>

                <Button
                    type="submit"
                    size="icon"
                    disabled={loading || !name.trim()}
                    className="rounded-radius shrink-0"
                >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                </Button>
            </form>

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-surface border rounded-radius shadow-md max-h-48 overflow-auto">
                    {suggestions.map((s) => (
                        <button
                            key={s}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent/50 transition-colors"
                            onClick={() => {
                                setName(s);
                                setShowSuggestions(false);
                            }}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
