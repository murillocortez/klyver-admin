import React, { useEffect, useState } from 'react';
import { Save, RefreshCw, Check, Banknote } from 'lucide-react';
import { cashbackService } from '../services/cashbackService';
import { CashbackSettings } from '../types';

export const CashbackSettingsTab: React.FC = () => {
    const [settings, setSettings] = useState<CashbackSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        const data = await cashbackService.getSettings();
        if (data) {
            setSettings(data);
        } else {
            // Default fallback visible purely on frontend before first save
            setSettings({ percentualPadrao: 5, diasValidade: 30 });
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        const success = await cashbackService.updateSettings(settings);
        setSaving(false);
        if (success) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } else {
            alert('Erro ao salvar configurações.');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Carregando configurações de cashback...</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
                    <Banknote size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Cashback Inteligente</h2>
                    <p className="text-sm text-gray-500">
                        Configure as regras de fidelidade para incentivar a recompra.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Card de Configuração */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
                    <h3 className="font-bold text-gray-800 border-b border-gray-100 pb-3">Regras de Acúmulo</h3>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Percentual Padrão de Cashback (%)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                max="20"
                                step="0.1"
                                value={settings?.percentualPadrao}
                                onChange={(e) => setSettings({ ...settings!, percentualPadrao: Number(e.target.value) })}
                                className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500/20 outline-none text-lg font-bold text-gray-900"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Quanto o cliente recebe de volta a cada compra. (Máx recomendado: 20%)
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Validade do Saldo (dias)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min="1"
                                value={settings?.diasValidade}
                                onChange={(e) => setSettings({ ...settings!, diasValidade: Number(e.target.value) })}
                                className="w-full pl-4 pr-16 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500/20 outline-none text-lg font-bold text-gray-900"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">dias</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Tempo para o cliente usar o saldo antes de expirar. Se fizer nova compra, o prazo RENOVA.
                        </p>
                    </div>
                </div>

                {/* Card de Simulação / Explicação */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200 text-sm text-gray-600 space-y-4">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Como funciona na prática?
                    </h3>

                    <div className="space-y-3">
                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                            <p className="font-bold text-gray-900 mb-1">1. Compra</p>
                            <p>Cliente gasta <strong>R$ 100,00</strong>.</p>
                            <p className="text-green-600 font-bold mt-1">+ R$ {((settings?.percentualPadrao || 0)).toFixed(2)} de crédito</p>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                            <p className="font-bold text-gray-900 mb-1">2. Expiração</p>
                            <p>O saldo fica válido por <strong>{settings?.diasValidade} dias</strong>.</p>
                            <p className="text-xs mt-1 text-red-500">Se não comprar novamente, perde tudo.</p>
                        </div>

                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                            <p className="font-bold text-gray-900 mb-1">3. Renovação</p>
                            <p>Se comprar antes de vencer, o prazo de TODO o saldo é renovado por mais {settings?.diasValidade} dias.</p>
                        </div>
                    </div>
                </div>

            </div>

            <div className="flex justify-end pt-6 border-t border-gray-100">
                <div className="flex items-center gap-4">
                    {showSuccess && (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 text-sm font-bold animate-in fade-in slide-in-from-right-4">
                            <Check size={16} /> Salvo com sucesso!
                        </div>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl hover:bg-gray-800 transition-all font-bold shadow-lg shadow-gray-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                        <span>{saving ? 'Salvando...' : 'Salvar Regras'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
