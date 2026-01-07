'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, ShoppingCart, CheckSquare, MoreHorizontal } from 'lucide-react';
import { clsx } from 'clsx';
import { MoreMenu } from './MoreMenu';

const navItems = [
    { label: 'Ukeplan', href: '/ukeplan', icon: Calendar },
    { label: 'Handleliste', href: '/handleliste', icon: ShoppingCart },
    { label: 'Gjøremål', href: '/gjoremal', icon: CheckSquare },
];

export function BottomNav() {
    const pathname = usePathname();
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-surface/95 backdrop-blur-md pb-safe">
                <div className="flex h-14 items-center justify-around px-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={clsx(
                                    'flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-radius transition-colors',
                                    isActive
                                        ? 'text-primary'
                                        : 'text-muted-foreground hover:text-foreground active:bg-accent/50'
                                )}
                            >
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                <span className="text-[10px] font-medium leading-none">{item.label}</span>
                            </Link>
                        );
                    })}

                    <button
                        onClick={() => setIsMoreOpen(true)}
                        className={clsx(
                            'flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-radius transition-colors',
                            isMoreOpen
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-foreground active:bg-accent/50'
                        )}
                    >
                        <MoreHorizontal size={22} strokeWidth={isMoreOpen ? 2.5 : 2} />
                        <span className="text-[10px] font-medium leading-none">Mer</span>
                    </button>
                </div>
            </nav>

            <MoreMenu isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} />
        </>
    );
}
