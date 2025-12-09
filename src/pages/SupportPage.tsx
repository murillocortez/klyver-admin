import React, { useState } from 'react';
import { Headphones, LifeBuoy, MessageSquare, History, BookOpen } from 'lucide-react';
import { FAQSection } from '../components/support/FAQSection';
import { TicketForm } from '../components/support/TicketForm';
import { TicketList } from '../components/support/TicketList';

export const SupportPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'faq' | 'new-ticket' | 'history'>('faq');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 animate-in fade-in duration-300">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 py-8 flex justify-between items-center shadow-sm sticky top-0 z-30">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
                            <Headphones size={28} />
                        </div>
                        Central de Suporte
                    </h1>
                    <p className="text-gray-500 font-medium mt-2 ml-1">Tire dúvidas, aprenda a usar o sistema ou fale com nosso time.</p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 mt-8">

                {/* Navigation Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <button
                        onClick={() => setActiveTab('faq')}
                        className={`p-6 rounded-2xl border text-left transition-all duration-300 group relative overflow-hidden ${activeTab === 'faq' ? 'bg-white border-blue-500 shadow-lg ring-4 ring-blue-500/10 scale-[1.02]' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'}`}
                    >
                        <div className={`p-3 rounded-xl w-fit mb-4 transition-colors ${activeTab === 'faq' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 group-hover:text-blue-600 group-hover:bg-blue-50'}`}>
                            <BookOpen size={24} />
                        </div>
                        <h3 className={`text-lg font-bold mb-1 ${activeTab === 'faq' ? 'text-blue-700' : 'text-gray-900'}`}>Guia & FAQ</h3>
                        <p className="text-sm text-gray-500">Busque tutoriais e respostas para dúvidas comuns.</p>
                    </button>

                    <button
                        onClick={() => setActiveTab('new-ticket')}
                        className={`p-6 rounded-2xl border text-left transition-all duration-300 group relative overflow-hidden ${activeTab === 'new-ticket' ? 'bg-white border-blue-500 shadow-lg ring-4 ring-blue-500/10 scale-[1.02]' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'}`}
                    >
                        <div className={`p-3 rounded-xl w-fit mb-4 transition-colors ${activeTab === 'new-ticket' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 group-hover:text-blue-600 group-hover:bg-blue-50'}`}>
                            <MessageSquare size={24} />
                        </div>
                        <h3 className={`text-lg font-bold mb-1 ${activeTab === 'new-ticket' ? 'text-blue-700' : 'text-gray-900'}`}>Abrir Chamado</h3>
                        <p className="text-sm text-gray-500">Relate um problema ou solicite ajuda técnica.</p>
                    </button>

                    <button
                        onClick={() => setActiveTab('history')}
                        className={`p-6 rounded-2xl border text-left transition-all duration-300 group relative overflow-hidden ${activeTab === 'history' ? 'bg-white border-blue-500 shadow-lg ring-4 ring-blue-500/10 scale-[1.02]' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'}`}
                    >
                        <div className={`p-3 rounded-xl w-fit mb-4 transition-colors ${activeTab === 'history' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 group-hover:text-blue-600 group-hover:bg-blue-50'}`}>
                            <History size={24} />
                        </div>
                        <h3 className={`text-lg font-bold mb-1 ${activeTab === 'history' ? 'text-blue-700' : 'text-gray-900'}`}>Meus Chamados</h3>
                        <p className="text-sm text-gray-500">Acompanhe o status das suas solicitações.</p>
                    </button>
                </div>

                {/* Content Area */}
                <div className="animate-in slide-in-from-bottom-4 duration-500">
                    {activeTab === 'faq' && (
                        <div>
                            <div className="mb-6 flex items-center gap-2">
                                <LifeBuoy className="text-blue-600" size={20} />
                                <h2 className="text-xl font-bold text-gray-900">Base de Conhecimento</h2>
                            </div>
                            <FAQSection />
                        </div>
                    )}

                    {activeTab === 'new-ticket' && (
                        <div className="max-w-3xl mx-auto">
                            <TicketForm onSuccess={() => {
                                setActiveTab('history');
                                setRefreshTrigger(prev => prev + 1);
                            }} />
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div>
                            <div className="mb-6 flex items-center gap-2">
                                <History className="text-blue-600" size={20} />
                                <h2 className="text-xl font-bold text-gray-900">Histórico de Atendimentos</h2>
                            </div>
                            <TicketList refreshTrigger={refreshTrigger} />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
