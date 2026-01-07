import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
    return (
        <div className="flex h-[50vh] flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="rounded-full bg-secondary p-5 text-primary">
                <Icon size={36} strokeWidth={1.5} />
            </div>
            <div className="space-y-1">
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="text-muted-foreground text-sm max-w-[240px] mx-auto">{description}</p>
            </div>
            {actionLabel && (
                <Button size="sm" onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
