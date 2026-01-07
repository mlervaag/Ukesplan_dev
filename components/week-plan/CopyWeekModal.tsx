'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { getISOWeekDetails } from '@/lib/utils/date';
import { subWeeks } from 'date-fns';

interface CopyWeekModalProps {
    currentYear: number;
    currentWeek: number;
    onCopy: (fromYear: number, fromWeek: number) => void;
    loading?: boolean;
}

export function CopyWeekModal({ currentYear, currentWeek, onCopy, loading }: CopyWeekModalProps) {
    // Offer previous 4 weeks as options
    const history = [];
    const referenceDate = new Date(); // Could use currentYear/currentWeek but simpler for now

    // Actually, let's use currentYear/currentWeek as anchor
    const anchor = new Date(currentYear, 0, 4);
    anchor.setDate(anchor.getDate() + (currentWeek - 1) * 7);

    for (let i = 1; i <= 4; i++) {
        const d = subWeeks(anchor, i);
        const { week, year } = getISOWeekDetails(d);
        history.push({ week, year });
    }

    return (
        <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
                Velg hvilken uke du vil kopiere middagene fra. Dette vil overskrive planene for gjeldende uke ({currentWeek}, {currentYear}).
            </p>

            <div className="space-y-2">
                {history.map((h) => (
                    <button
                        key={`${h.year}-${h.week}`}
                        onClick={() => onCopy(h.year, h.week)}
                        disabled={loading}
                        className="w-full flex items-center justify-between p-4 rounded-radius border bg-background hover:bg-accent active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        <span className="font-medium">Uke {h.week}, {h.year}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
