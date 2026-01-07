'use client';

// Minimal implementation of a simple event bus for toast notifications
export const toastBus = {
    listeners: [] as ((message: string, type: string) => void)[],
    subscribe(fn: (message: string, type: string) => void) {
        this.listeners.push(fn);
        return () => {
            this.listeners = this.listeners.filter(l => l !== fn);
        };
    },
    show(message: string, type: string = 'success') {
        this.listeners.forEach(l => l(message, type));
    }
};
