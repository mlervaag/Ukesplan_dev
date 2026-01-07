import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface DinnerCardProps {
    id: string;
    name: string;
    icon?: string | null;
    ingredientsCount: number;
}

export function DinnerCard({ id, name, icon, ingredientsCount }: DinnerCardProps) {
    return (
        <Link
            href={`/middager/${id}`}
            className="flex items-center gap-3 p-4 bg-background border rounded-radius hover:bg-accent transition-colors active:scale-[0.98]"
        >
            <span className="text-2xl flex-shrink-0">{icon || '🍽️'}</span>
            <div className="flex-1 min-w-0 space-y-0.5">
                <h3 className="font-semibold truncate">{name}</h3>
                <p className="text-xs text-muted-foreground">{ingredientsCount} ingredienser</p>
            </div>
            <ChevronRight size={20} className="text-muted-foreground flex-shrink-0" />
        </Link>
    );
}
