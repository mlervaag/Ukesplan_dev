'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, ShoppingCart, Utensils, Settings } from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
    { label: 'Ukeplan', href: '/ukeplan', icon: Calendar },
    { label: 'Handleliste', href: '/handleliste', icon: ShoppingCart },
    { label: 'Middager', href: '/middager', icon: Utensils },
    { label: 'Innstillinger', href: '/innstillinger', icon: Settings },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
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
            </div>
        </nav>
    );
}
