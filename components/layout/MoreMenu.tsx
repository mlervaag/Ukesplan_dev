'use client';

import Link from 'next/link';
import { Utensils, Repeat, Settings, X } from 'lucide-react';

interface MoreMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const moreItems = [
    { label: 'Middager', href: '/middager', icon: Utensils },
    { label: 'Faste gjøremål', href: '/gjoremal/faste', icon: Repeat },
    { label: 'Innstillinger', href: '/innstillinger', icon: Settings },
];

export function MoreMenu({ isOpen, onClose }: MoreMenuProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Menu Container */}
            <div className="relative w-full max-w-lg bg-surface border-t sm:border rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Mer</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-accent rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="grid gap-4">
                    {moreItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/50 hover:bg-accent transition-colors"
                            >
                                <div className="p-2.5 bg-surface rounded-xl shadow-sm">
                                    <Icon size={20} className="text-primary" />
                                </div>
                                <span className="font-semibold">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
