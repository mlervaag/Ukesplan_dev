'use client';

import { Clock, User } from 'lucide-react';
import { clsx } from 'clsx';

interface TemplateRowProps {
    template: any;
    onClick: () => void;
}

const responsibleLabel = {
    he: 'H',
    she: 'U',
    both: 'B'
};

const responsibleColor = {
    he: 'bg-blue-100 text-blue-700',
    she: 'bg-pink-100 text-pink-700',
    both: 'bg-purple-100 text-purple-700'
};

export function TemplateRow({ template, onClick }: TemplateRowProps) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between p-4 bg-surface border rounded-2xl shadow-sm hover:bg-accent/30 transition-colors text-left"
        >
            <div className="flex items-center gap-3 overflow-hidden">
                {template.time && (
                    <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground shrink-0 bg-secondary/50 px-2 py-1 rounded-md">
                        <Clock size={12} />
                        {template.time}
                    </div>
                )}
                <span className="font-semibold truncate">{template.title}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-2">
                <div className={clsx(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm",
                    responsibleColor[template.responsible as keyof typeof responsibleColor]
                )}>
                    {responsibleLabel[template.responsible as keyof typeof responsibleLabel]}
                </div>
                {template.intervalWeeks > 1 && (
                    <div className="px-2 py-0.5 bg-secondary text-[10px] font-medium rounded-full uppercase tracking-wider opacity-70">
                        {template.intervalWeeks}v
                    </div>
                )}
            </div>
        </button>
    );
}
