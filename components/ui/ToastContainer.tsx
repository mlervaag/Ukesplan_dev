'use client';

import { useState, useEffect } from 'react';
import { toastBus } from '@/lib/utils/toast';
import { clsx } from 'clsx';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
    const [toasts, setToasts] = useState<{ id: string; message: string; type: string }[]>([]);

    useEffect(() => {
        return toastBus.subscribe((message, type) => {
            const id = Math.random().toString(36).substr(2, 9);
            setToasts(prev => [...prev, { id, message, type }]);
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 5000);
        });
    }, []);

    return (
        <div className="fixed bottom-20 left-4 right-4 z-60 flex flex-col items-center gap-2 pointer-events-none">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={clsx(
                        "flex items-center gap-3 p-4 rounded-radius shadow-lg text-white pointer-events-auto animate-in slide-in-from-bottom-4 duration-300 w-full max-w-sm",
                        toast.type === 'error' ? 'bg-destructive' : 'bg-primary'
                    )}
                >
                    {toast.type === 'success' ? <CheckCircle size={20} /> : <Info size={20} />}
                    <span className="flex-1 text-sm font-medium">{toast.message}</span>
                    <button
                        onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                        className="p-2 -mr-2 hover:bg-white/10 rounded-full transition-colors"
                        aria-label="Lukk"
                    >
                        <X size={20} />
                    </button>
                </div>
            ))}
        </div>
    );
}
