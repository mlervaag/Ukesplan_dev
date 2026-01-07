'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UnitSelect } from '@/components/ui/UnitSelect';
import { Plus, Trash2 } from 'lucide-react';
import { DEFAULT_UNIT } from '@/lib/constants/units';
import { DINNER_ICONS } from '@/lib/constants/icons';

export interface IngredientRow {
    name: string;
    quantity: string;
    unit: string;
}

interface DinnerFormProps {
    initialData?: {
        name: string;
        notes: string;
        icon?: string;
        ingredients: IngredientRow[];
    };
    onSubmit: (data: any) => Promise<void>;
    loading?: boolean;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

// State for tracking which ingredient input has an active suggestion popup
interface SuggestionState {
    activeIndex: number;       // Which ingredient row is active (-1 = none)
    highlightedIndex: number;  // Which suggestion is highlighted (-1 = none)
}

export function DinnerForm({ initialData, onSubmit, loading }: DinnerFormProps) {
    const { data: suggestions } = useSWR<string[]>('/api/ingredients/suggestions', fetcher);
    const [name, setName] = useState(initialData?.name ?? '');
    const [notes, setNotes] = useState(initialData?.notes ?? '');
    const [icon, setIcon] = useState(initialData?.icon ?? '');
    const [showIconPicker, setShowIconPicker] = useState(false);
    const [ingredients, setIngredients] = useState<IngredientRow[]>(
        initialData?.ingredients ?? [{ name: '', quantity: '1', unit: DEFAULT_UNIT }]
    );

    // Suggestion popup state
    const [suggestionState, setSuggestionState] = useState<SuggestionState>({
        activeIndex: -1,
        highlightedIndex: -1,
    });

    // Ref to track newly added row for scroll/focus
    const newRowRef = useRef<HTMLInputElement>(null);
    const [pendingFocus, setPendingFocus] = useState(false);
    const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Focus and scroll to new row after render
    useEffect(() => {
        if (pendingFocus && newRowRef.current) {
            newRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            newRowRef.current.focus();
            setPendingFocus(false);
        }
    }, [pendingFocus, ingredients]);

    const addIngredient = () => {
        setIngredients([...ingredients, { name: '', quantity: '1', unit: DEFAULT_UNIT }]);
        setPendingFocus(true);
    };

    const removeIngredient = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
        // Close popup if the removed row was active
        if (suggestionState.activeIndex === index) {
            setSuggestionState({ activeIndex: -1, highlightedIndex: -1 });
        }
    };

    const updateIngredient = (index: number, field: keyof IngredientRow, value: string) => {
        const newIngs = [...ingredients];
        newIngs[index] = { ...newIngs[index], [field]: value };
        setIngredients(newIngs);
    };

    // Filter suggestions based on current input
    const getFilteredSuggestions = useCallback((inputValue: string): string[] => {
        if (!suggestions || !inputValue.trim()) return [];
        const lower = inputValue.toLowerCase();
        return suggestions.filter((s: string) =>
            s.toLowerCase().includes(lower) && s.toLowerCase() !== lower
        ).slice(0, 8); // Limit to 8 suggestions
    }, [suggestions]);

    // Handle selecting a suggestion
    const selectSuggestion = (index: number, suggestion: string) => {
        updateIngredient(index, 'name', suggestion);
        setSuggestionState({ activeIndex: -1, highlightedIndex: -1 });
    };

    // Handle keyboard navigation in suggestions
    const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, filtered: string[]) => {
        if (filtered.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSuggestionState(prev => ({
                    ...prev,
                    highlightedIndex: Math.min(prev.highlightedIndex + 1, filtered.length - 1),
                }));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSuggestionState(prev => ({
                    ...prev,
                    highlightedIndex: Math.max(prev.highlightedIndex - 1, 0),
                }));
                break;
            case 'Enter':
                if (suggestionState.highlightedIndex >= 0) {
                    e.preventDefault();
                    selectSuggestion(rowIndex, filtered[suggestionState.highlightedIndex]);
                }
                break;
            case 'Escape':
                setSuggestionState({ activeIndex: -1, highlightedIndex: -1 });
                break;
        }
    };

    // Handle input focus
    const handleInputFocus = (index: number) => {
        setSuggestionState({ activeIndex: index, highlightedIndex: -1 });
    };

    // Handle input blur (with delay to allow click on suggestions)
    const handleInputBlur = () => {
        setTimeout(() => {
            setSuggestionState({ activeIndex: -1, highlightedIndex: -1 });
        }, 150);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            name,
            notes,
            icon: icon || undefined,
            ingredients: ingredients
                .filter(ing => ing.name.trim() !== '')
                .map(ing => ({
                    name: ing.name.trim(),
                    quantity: parseInt(ing.quantity, 10) || 1,
                    unit: ing.unit.trim(),
                })),
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                {/* Icon Picker */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Ikon</label>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setShowIconPicker(!showIconPicker)}
                            className="w-14 h-14 text-3xl flex items-center justify-center border rounded-radius bg-surface hover:bg-accent transition-colors"
                            aria-label="Velg ikon"
                        >
                            {icon || '🍽️'}
                        </button>
                        <span className="text-sm text-muted-foreground">
                            Trykk for å endre
                        </span>
                    </div>
                    {showIconPicker && (
                        <div className="grid grid-cols-8 gap-2 p-3 border rounded-radius bg-surface">
                            {DINNER_ICONS.map((dinnerIcon) => (
                                <button
                                    key={dinnerIcon}
                                    type="button"
                                    onClick={() => {
                                        setIcon(dinnerIcon);
                                        setShowIconPicker(false);
                                    }}
                                    className={`w-10 h-10 text-xl flex items-center justify-center rounded-radius hover:bg-accent transition-colors ${icon === dinnerIcon ? 'bg-primary/10 ring-2 ring-primary' : ''
                                        }`}
                                >
                                    {dinnerIcon}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Navn på middag</label>
                    <Input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="f.eks. Taco"
                        required
                        autoFocus
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Notater (valgfritt)</label>
                    <Input
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="f.eks. Oppskrift eller tips"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <label className="text-sm font-medium">Ingredienser</label>

                <div className="space-y-3">
                    {ingredients.map((ing, index) => {
                        const isLastRow = index === ingredients.length - 1;
                        return (
                            <div key={index} className="flex gap-2 items-start">
                                {/* Ingredient name with custom suggestions popup */}
                                <div className="flex-1 relative">
                                    <Input
                                        ref={isLastRow ? newRowRef : undefined}
                                        value={ing.name}
                                        onChange={e => updateIngredient(index, 'name', e.target.value)}
                                        onFocus={() => handleInputFocus(index)}
                                        onBlur={handleInputBlur}
                                        onKeyDown={(e) => {
                                            const filtered = getFilteredSuggestions(ing.name);
                                            handleKeyDown(e, index, filtered);
                                        }}
                                        placeholder="Vare"
                                        className="h-10 text-sm"
                                        autoComplete="off"
                                    />
                                    {/* Custom right-aligned suggestions popup */}
                                    {suggestionState.activeIndex === index && (() => {
                                        const filtered = getFilteredSuggestions(ing.name);
                                        if (filtered.length === 0) return null;
                                        return (
                                            <div
                                                className="absolute top-full right-0 mt-1 z-50 bg-surface border rounded-radius shadow-lg overflow-hidden"
                                                style={{
                                                    width: 'min(280px, 90vw)',
                                                    maxHeight: '200px',
                                                    overflowY: 'auto'
                                                }}
                                            >
                                                {filtered.map((suggestion, sIdx) => (
                                                    <div
                                                        key={suggestion}
                                                        ref={el => { suggestionRefs.current[sIdx] = el; }}
                                                        onClick={() => selectSuggestion(index, suggestion)}
                                                        className={`px-3 py-2 text-sm cursor-pointer transition-colors ${suggestionState.highlightedIndex === sIdx
                                                                ? 'bg-primary/10 text-primary'
                                                                : 'hover:bg-accent'
                                                            }`}
                                                    >
                                                        {suggestion}
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className="w-16">
                                    <Input
                                        type="number"
                                        step="1"
                                        min="1"
                                        value={ing.quantity}
                                        onChange={e => updateIngredient(index, 'quantity', e.target.value)}
                                        placeholder="1"
                                        className="h-10 text-sm text-center px-1"
                                    />
                                </div>
                                <div className="w-20">
                                    <UnitSelect
                                        value={ing.unit}
                                        onChange={(val) => updateIngredient(index, 'unit', val)}
                                        className="w-full h-10"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 text-destructive"
                                    onClick={() => removeIngredient(index)}
                                >
                                    <Trash2 size={18} />
                                </Button>
                            </div>
                        );
                    })}
                </div>

                {/* Add button at bottom */}
                <Button type="button" variant="outline" className="w-full" onClick={addIngredient}>
                    <Plus size={16} className="mr-1" /> Legg til ingrediens
                </Button>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Lagrer...' : (initialData ? 'Oppdater middag' : 'Lagre middag')}
            </Button>
        </form>
    );
}
