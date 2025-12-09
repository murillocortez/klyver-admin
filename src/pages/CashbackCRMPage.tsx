import React, { useEffect, useState } from 'react';
import { Banknote, TrendingUp, TrendingDown, Clock, Users, DollarSign } from 'lucide-react';
import { cashbackService } from '../services/cashbackService';

const InfoCard = ({ title, value, subtext, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between">
        <div>
            <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            {subtext && <p className={`text-xs mt-1 ${color}`}>{subtext}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-').replace('600', '100').replace('500', '100')}`}>
            <Icon className={color} size={24} />
        </div>
    </div>
);

export const CashbackCRMPage: React.FC = () => {
    const [stats, setStats] = useState({ generated: 0, used: 0, expired: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setLoading(true);
        const data = await cashbackService.getGlobalStats();
        setStats(data);
        setLoading(false);
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    if (loading) return <div className="p-8 text-center">Carregando dados...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Banknote className="text-blue-600" />
                        CRM Cashback Inteligente
                    </h1>
                    <p className="text-gray-500">Acompanhe a performance do seu programa de fidelidade.</p>
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 font-medium"
                >
                    Atualizar
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <InfoCard
                    title="Total Gerado"
                    value={formatCurrency(stats.generated)}
                    subtext="Créditos concedidos"
                    icon={TrendingUp}
                    color="text-green-600"
                />
                <InfoCard
                    title="Total Utilizado"
                    value={formatCurrency(stats.used)}
                    subtext="Descontos aplicados"
                    icon={DollarSign}
                    color="text-blue-600"
                />
                <InfoCard
                    title="Total Expirado"
                    value={formatCurrency(stats.expired)}
                    subtext="Créditos perdidos"
                    icon={Clock}
                    color="text-red-500"
                />
                <InfoCard
                    title="Taxa de Utilização"
                    value={`${stats.generated > 0 ? ((stats.used / stats.generated) * 100).toFixed(1) : 0}%`}
                    subtext="Conversão de cashback"
                    icon={TrendingDown}
                    color="text-purple-600"
                />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-500">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Users size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Relatórios Detalhados em Breve</h3>
                <p>Estamos trabalhando para trazer listagens de top clientes e histórico detalhado aqui.</p>
            </div>
        </div>
    );
};
