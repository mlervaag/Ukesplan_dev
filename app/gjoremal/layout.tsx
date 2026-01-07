import { ReactNode } from 'react';

export default function GjoremalLayout({ children }: { children: ReactNode }) {
    return (
        <main className="min-h-screen bg-background">
            {children}
        </main>
    );
}
