import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface Toast {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
}

export const ToastContainer: React.FC = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    useEffect(() => {
        const handleToastEvent = (event: CustomEvent) => {
            const { type, message } = event.detail;
            const newToast: Toast = {
                id: Math.random().toString(36).substr(2, 9),
                type,
                message,
            };

            setToasts((prev) => [...prev, newToast]);

            // Auto remove after 5 seconds
            setTimeout(() => {
                removeToast(newToast.id);
            }, 5000);
        };

        window.addEventListener('whatsapp-notification' as any, handleToastEvent);

        return () => {
            window.removeEventListener('whatsapp-notification' as any, handleToastEvent);
        };
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle size={20} className="text-green-500" />;
            case 'error': return <AlertCircle size={20} className="text-red-500" />;
            default: return <Info size={20} className="text-blue-500" />;
        }
    };

    const getBorderColor = (type: string) => {
        switch (type) {
            case 'success': return 'border-l-4 border-l-green-500';
            case 'error': return 'border-l-4 border-l-red-500';
            default: return 'border-l-4 border-l-blue-500';
        }
    };

    return (
        <div className="fixed bottom-4 right-4 z-[70] flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`bg-white shadow-lg rounded-lg p-4 mb-2 flex items-start gap-3 w-80 pointer-events-auto transform transition-all duration-300 animate-in slide-in-from-right-10 ${getBorderColor(toast.type)}`}
                >
                    <div className="shrink-0 mt-0.5">{getIcon(toast.type)}</div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{toast.message}</p>
                    </div>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
};
