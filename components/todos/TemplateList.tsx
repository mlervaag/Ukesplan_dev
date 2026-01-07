'use client';

import { getDayName } from '@/lib/utils/date';
import { TemplateRow } from './TemplateRow';

interface TemplateListProps {
    templates: any[];
    onEdit: (template: any) => void;
}

export function TemplateList({ templates, onEdit }: TemplateListProps) {
    // Group templates by day index (1-7)
    const grouped = templates.reduce((acc: any, template: any) => {
        const day = template.dayOfWeek;
        if (!acc[day]) acc[day] = [];
        acc[day].push(template);
        return acc;
    }, {});

    const days = [1, 2, 3, 4, 5, 6, 7];

    return (
        <div className="space-y-8">
            {days.map((day) => {
                const dayTemplates = grouped[day] || [];
                if (dayTemplates.length === 0) return null;

                return (
                    <div key={day} className="space-y-3">
                        <h3 className="font-bold text-lg px-2 text-primary">
                            {getDayName(day)}
                        </h3>
                        <div className="space-y-2">
                            {dayTemplates.map((template: any) => (
                                <TemplateRow
                                    key={template.id}
                                    template={template}
                                    onClick={() => onEdit(template)}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
