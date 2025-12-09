import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Star, X } from 'lucide-react';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    featureName: string;
    requiredPlan: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, featureName, requiredPlan }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                    <X size={20} />
                </button>

                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Lock size={32} className="text-orange-500" />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Recurso Premium</h2>
                    <p className="text-gray-500 mb-6">
                        O recurso <span className="font-bold text-gray-800">{featureName}</span> está disponível apenas no plano <span className="font-bold text-blue-600">{requiredPlan}</span> ou superior.
                    </p>

                    <div className="bg-blue-50 rounded-xl p-4 mb-8 text-left">
                        <h3 className="font-bold text-blue-900 text-sm mb-2 flex items-center gap-2">
                            <Star size={16} className="fill-blue-600 text-blue-600" />
                            Benefícios do Upgrade:
                        </h3>
                        <ul className="text-sm text-blue-800 space-y-2 pl-6 list-disc">
                            <li>Acesso ilimitado a {featureName}</li>
                            <li>Suporte prioritário</li>
                            <li>Relatórios avançados</li>
                        </ul>
                    </div>

                    <button
                        onClick={() => {
                            onClose();
                            navigate('/plans');
                        }}
                        className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:shadow-xl hover:scale-[1.02] transition-all"
                    >
                        Ver Planos & Fazer Upgrade
                    </button>

                    <button onClick={onClose} className="mt-4 text-sm font-medium text-gray-400 hover:text-gray-600">
                        Talvez depois
                    </button>
                </div>
            </div>
        </div>
    );
};
