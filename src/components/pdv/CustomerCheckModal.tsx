import React, { useEffect } from 'react';
import { X, UserPlus, ArrowRight, User } from 'lucide-react';

interface CustomerCheckModalProps {
    onClose: () => void;
    onIdentify: () => void;
    onContinueWithoutCustomer: () => void;
}

export const CustomerCheckModal: React.FC<CustomerCheckModalProps> = ({ onClose, onIdentify, onContinueWithoutCustomer }) => {

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl scale-100">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <User size={24} className="text-blue-600" />
                        Identificar Cliente?
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-8 text-center space-y-6">
                    <p className="text-gray-600 text-lg">
                        Você ainda não identificou o cliente para esta venda. Deseja identificar agora para aplicar descontos ou fidelidade?
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={onIdentify}
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                        >
                            <UserPlus size={24} />
                            Identificar Cliente
                        </button>

                        <button
                            onClick={onContinueWithoutCustomer}
                            className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                        >
                            Finalizar sem Cliente
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
