import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    /** If true, renders as full-screen modal on mobile for keyboard safety */
    fullScreen?: boolean;
}

export function Modal({ isOpen, onClose, title, children, fullScreen = false }: ModalProps) {
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    // Full-screen mode for keyboard-safe forms
    if (fullScreen) {
        return createPortal(
            <div className="fixed inset-0 z-50 flex flex-col bg-background" style={{ height: '100dvh' }}>
                {/* Sticky Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-surface border-b shadow-sm">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X size={20} />
                    </Button>
                </div>
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-5 pb-safe">
                    {children}
                </div>
            </div>,
            document.body
        );
    }

    // Default sheet-style modal (desktop-friendly)
    return createPortal(
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />
            <div className="relative w-full max-w-lg overflow-hidden bg-surface border-t sm:border shadow-md transition-all sm:rounded-radius-lg rounded-t-[1.25rem] mb-0 sm:mb-8">
                <div className="flex items-center justify-between px-5 py-4 border-b">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X size={20} />
                    </Button>
                </div>
                <div className="px-5 py-4 max-h-[80vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
