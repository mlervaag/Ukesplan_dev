import { Loader2 } from 'lucide-react';

interface SpinnerProps {
    size?: number;
    className?: string;
}

/**
 * Loading spinner for action buttons.
 */
export function Spinner({ size = 18, className = '' }: SpinnerProps) {
    return <Loader2 size={size} className={`animate-spin ${className}`} />;
}
