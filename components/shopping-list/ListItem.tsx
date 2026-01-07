'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UnitSelect } from '@/components/ui/UnitSelect';
import { X } from 'lucide-react';
import { formatQty } from '@/lib/utils/format';

interface ListItemProps {
    item: {
        id: string;
        displayName: string;
        quantity: string;
        unit: string;
    };
    onUpdate: (id: string, updates: { quantity?: string | number; unit?: string }) => Promise<void>;
    onHide: (id: string) => Promise<void>;
}

export function ListItem({ item, onUpdate, onHide }: ListItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [qty, setQty] = useState(formatQty(item.quantity));
    const [unit, setUnit] = useState(item.unit);
    const [isUpdating, setIsUpdating] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [isEditing]);

    const handleSave = async () => {
        if (qty === formatQty(item.quantity) && unit === item.unit) {
            setIsEditing(false);
            return;
        }
        setIsUpdating(true);
        await onUpdate(item.id, { quantity: qty, unit });
        setIsUpdating(false);
        setIsEditing(false);
    };

    return (
        <div className="group relative flex items-center gap-3 px-3 py-2.5 bg-surface border rounded-radius shadow-sm transition-colors hover:bg-accent/20">
            <button
                onClick={() => onHide(item.id)}
                className="flex-shrink-0 w-5 h-5 border-2 rounded-full border-border hover:border-primary hover:bg-primary/10 transition-colors"
                aria-label="Ferdig"
            />

            <div className="flex-grow flex items-center gap-2 min-w-0" onClick={() => !isEditing && setIsEditing(true)}>
                {isEditing ? (
                    <div className="flex items-center gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
                        <Input
                            ref={inputRef}
                            type="number"
                            step="1"
                            min="1"
                            className="w-14 h-8 text-center px-1 text-sm"
                            value={qty}
                            onChange={(e) => setQty(e.target.value)}
                            onBlur={handleSave}
                            autoFocus
                        />
                        <UnitSelect
                            value={unit}
                            onChange={(val) => {
                                setUnit(val);
                            }}
                            className="h-8 w-16 text-xs"
                        />
                        <span className="truncate font-medium text-sm">{item.displayName}</span>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 ml-auto"
                            onClick={handleSave}
                        >
                            ✓
                        </Button>
                    </div>
                ) : (
                    <>
                        <span className="font-semibold text-primary tabular-nums text-sm">
                            {formatQty(item.quantity)}
                            {item.unit && <span className="ml-0.5 font-normal text-muted-foreground">{item.unit}</span>}
                        </span>
                        <span className="truncate font-medium text-sm">{item.displayName}</span>
                    </>
                )
                }
            </div>

            {!isEditing && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-50 group-hover:opacity-100 transition-opacity"
                    onClick={() => onHide(item.id)}
                >
                    <X size={14} className="text-muted-foreground" />
                </Button>
            )}
        </div>
    );
}
