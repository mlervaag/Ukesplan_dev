'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getWeekDisplay, getDateFromYearWeek, getISOWeekDetails } from '@/lib/utils/date';
import { addWeeks, subWeeks } from 'date-fns';

interface WeekSelectorProps {
    year: number;
    week: number;
    onChange: (year: number, week: number) => void;
}

export function WeekSelector({ year, week, onChange }: WeekSelectorProps) {
    const { label, range } = getWeekDisplay(year, week);

    const navigate = (direction: number) => {
        const currentDate = getDateFromYearWeek(year, week);
        const targetDate = direction > 0 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1);
        const { week: nextWeek, year: nextYear } = getISOWeekDetails(targetDate);
        onChange(nextYear, nextWeek);
    };

    return (
        <div className="flex items-center justify-between p-4 bg-background border-b sticky top-0 z-40">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ChevronLeft size={24} />
            </Button>
            <div className="text-center">
                <h2 className="font-bold">{label}</h2>
                <p className="text-xs text-muted-foreground uppercase">{range}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
                <ChevronRight size={24} />
            </Button>
        </div>
    );
}
