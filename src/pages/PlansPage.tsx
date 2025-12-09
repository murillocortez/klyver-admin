import React, { useEffect, useState } from 'react';
import { Check, X, Zap, Shield, Star, Rocket, Building2 } from 'lucide-react';
import { db } from '../services/dbService';
import { StorePlan, StoreSubscription } from '../types';
import { usePlan } from '../hooks/usePlan';
import { supportService } from '../services/supportService';

import { useSubscription } from '../context/SubscriptionContext';

export const PlansPage: React.FC = () => {
    const { license } = useSubscription();
    // ... existing hooks ...
    const { subscription, refreshPlan } = usePlan();
    const [plans, setPlans] = useState<StorePlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');

    useEffect(() => {
        loadPlans();
    }, []);

    // ... loadPlans ...
    const loadPlans = async () => {
        try {
            const data = await db.getPlans();
            setPlans(data);
        } catch (error) {
            console.error('Error loading plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpgrade = async (plan: StorePlan) => {
        if (!confirm(`Deseja solicitar a migração para o plano ${plan.name}? A equipe Master entrará em contato.`)) return;

        try {
            await supportService.createTicket({
                requester_name: 'Usuário Admin', // Ideally fetch current user name
                subject: `Solicitação de Troca de Plano: ${plan.name}`,
                message: `Tenho interesse em migrar do meu plano atual para o plano ${plan.name}. Por favor, entrem em contato para prosseguir com o upgrade.`,
                urgency: 'medium',
                status: 'open' // Explicitly setting status (although createTicket might default, safer to match interface)
            } as any); // Casting as any due to partial mismatch in Omit vs Interface usage in createTicket signature

            alert('Solicitação enviada com sucesso! Em breve entraremos em contato.');
        } catch (error) {
            console.error('Erro ao enviar solicitação:', error);
            alert('Erro ao enviar solicitação. Tente novamente mais tarde.');
        }
    };

    const getIcon = (code: string) => {
        switch (code) {
            case 'free': return <Shield size={24} />;
            case 'essential': return <Zap size={24} />;
            case 'pro': return <Star size={24} />;
            case 'advanced': return <Rocket size={24} />;
            case 'enterprise': return <Building2 size={24} />;
            default: return <Shield size={24} />;
        }
    };

    if (loading) return <div className="p-8 text-center">Carregando planos...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Status do Plano Atual (Dashboard) */}
            {license && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-12 flex flex-col md:flex-row items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">Seu Plano Atual</h2>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl font-bold text-blue-600">{license.plan}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium uppercase ${license.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {license.status === 'active' ? 'Ativo' : 'Pendente'}
                            </span>
                        </div>
                        <p className="text-gray-500 mt-2">
                            Renova em <span className="font-medium text-gray-900">{license.daysRemaining} dias</span>
                            <span className="text-xs text-gray-400 ml-2">({new Date(Date.now() + license.daysRemaining * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')})</span>
                        </p>
                    </div>

                    <div className="mt-4 md:mt-0 flex gap-3">
                        <div className="text-right mr-4 hidden md:block">
                            <p className="text-xs text-gray-400">Próxima Fatura</p>
                            <p className="font-semibold text-gray-900">R$ --,--</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Escolha o plano ideal para sua farmácia</h1>
                <p className="text-xl text-gray-500">Escale suas vendas com recursos exclusivos.</p>

                <div className="flex items-center justify-center gap-4 mt-8">
                    <span className={`text-sm font-bold ${period === 'monthly' ? 'text-gray-900' : 'text-gray-400'}`}>Mensal</span>
                    <button
                        onClick={() => setPeriod(period === 'monthly' ? 'yearly' : 'monthly')}
                        className="w-14 h-8 bg-gray-200 rounded-full relative transition-colors duration-300 focus:outline-none"
                    >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-sm transition-all duration-300 ${period === 'yearly' ? 'left-7' : 'left-1'}`} />
                    </button>
                    <span className={`text-sm font-bold ${period === 'yearly' ? 'text-gray-900' : 'text-gray-400'}`}>Anual (2 meses grátis)</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {plans.map(plan => {
                    const isCurrent = subscription?.plan_id === plan.id;
                    const price = period === 'monthly' ? plan.price_month : plan.price_year / 12;

                    return (
                        <div key={plan.id} className={`relative bg-white rounded-2xl p-6 border transition-all duration-300 flex flex-col
              ${isCurrent ? 'border-blue-500 shadow-xl ring-2 ring-blue-500/20 scale-105 z-10' : 'border-gray-200 hover:border-blue-300 hover:shadow-lg'}
            `}>
                            {isCurrent && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                                    PLANO ATUAL
                                </div>
                            )}

                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 
                ${plan.code === 'enterprise' ? 'bg-black text-white' : 'bg-blue-50 text-blue-600'}
              `}>
                                {getIcon(plan.code)}
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-2">{plan.name}</h3>
                            <div className="mb-6">
                                <span className="text-3xl font-bold text-gray-900">R$ {price.toFixed(0)}</span>
                                <span className="text-gray-500 text-sm">/mês</span>
                                {period === 'yearly' && plan.price_month > 0 && (
                                    <p className="text-xs text-green-600 font-bold mt-1">Economize R$ {(plan.price_month * 12 - plan.price_year).toFixed(0)}/ano</p>
                                )}
                            </div>

                            <div className="flex-1 space-y-3 mb-8">
                                {/* Limits */}
                                <div className="text-sm text-gray-600 flex items-center gap-2">
                                    <Check size={16} className="text-green-500" />
                                    {plan.limits.orders === -1 ? 'Pedidos Ilimitados' : `Até ${plan.limits.orders} pedidos/mês`}
                                </div>
                                <div className="text-sm text-gray-600 flex items-center gap-2">
                                    <Check size={16} className="text-green-500" />
                                    {plan.limits.products === -1 ? 'Produtos Ilimitados' : `Até ${plan.limits.products} produtos`}
                                </div>
                                <div className="text-sm text-gray-600 flex items-center gap-2">
                                    <Check size={16} className="text-green-500" />
                                    {plan.limits.users === -1 ? 'Usuários Ilimitados' : `Até ${plan.limits.users} usuários`}
                                </div>

                                {/* Features */}
                                {plan.features.includes('crm') && (
                                    <div className="text-sm text-gray-600 flex items-center gap-2">
                                        <Check size={16} className="text-green-500" /> CRM Completo
                                    </div>
                                )}
                                {plan.features.includes('ai_description') && (
                                    <div className="text-sm text-gray-600 flex items-center gap-2">
                                        <Check size={16} className="text-green-500" /> IA Generativa
                                    </div>
                                )}
                                {plan.features.includes('multi_store') && (
                                    <div className="text-sm text-gray-600 flex items-center gap-2">
                                        <Check size={16} className="text-green-500" /> Multi-loja
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => handleUpgrade(plan)}
                                disabled={isCurrent}
                                className={`w-full py-3 rounded-xl font-bold transition-all
                  ${isCurrent
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95'}
                `}
                            >
                                {isCurrent ? 'Seu Plano' : 'Solicitar Troca'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
