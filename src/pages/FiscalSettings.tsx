
import React, { useEffect, useState } from 'react';
import { Save, Check, RefreshCw, AlertCircle, Printer, Server } from 'lucide-react';
import { supabase } from '../services/supabase';
import { fiscalService } from '../services/fiscalService';
import { db } from '../services/dbService';
import { FiscalSettingsData, FiscalMode } from '../services/fiscal/types';
import { useRole } from '../hooks/useRole';

const InputGroup = ({ label, children, helpText, required }: any) => (
    <div className="space-y-1.5">
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
        {helpText && <p className="text-xs text-gray-400 flex items-center gap-1">{helpText}</p>}
    </div>
);

export const FiscalSettings: React.FC = () => {
    const [settings, setSettings] = useState<FiscalSettingsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { canEdit } = useRole();
    const editable = canEdit('settings');

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError(null);

                // Try to get settings
                let s = await fiscalService.getSettings();

                // If not found, try to resolve store_id and initialize
                if (!s) {
                    let storeId;

                    // Simple fetch - taking the first available store
                    // Since we migrated the DB to accept TEXT store_ids, we can support legacy IDs (1, 2) and UUIDs.
                    const { data: storeData } = await supabase.from('store_settings').select('id').single();

                    if (storeData) {
                        storeId = storeData.id;
                    } else {
                        // Create default store settings if none exist
                        console.log('No store found. Creating default...');

                        const { data: newStore, error: createError } = await supabase.from('store_settings').insert({
                            pharmacy_name: 'Farma Vida (Loja Principal)',
                            cnpj: '00.000.000/0001-00',
                            address: 'Endereço Principal',
                            phone: '(00) 0000-0000',
                            email: 'contato@farmavida.com.br',
                            opening_hours: '08:00 - 18:00',
                            fixed_delivery_fee: 0,
                            free_shipping_threshold: 0,
                            estimated_delivery_time: 0,
                            payment_pix_enabled: true,
                            payment_credit_enabled: true,
                            payment_debit_enabled: true,
                            payment_cash_enabled: true,
                            payment_credit_max_installments: 1,
                            notification_low_stock: false,
                            notification_new_order: false,
                            notification_email_channel: false,
                            notification_push_channel: false,
                            vip_enabled: false,
                            vip_discount_percentage: 0,
                            vip_inactivity_days: 0,
                            vip_min_order_count: 0,
                            vip_min_spent: 0,
                            primary_color: '#000000',
                            secondary_color: '#ffffff'
                        }).select('id').single();

                        if (createError) {
                            throw new Error('Erro ao criar loja: ' + createError.message);
                        }
                        storeId = newStore?.id;
                    }

                    if (storeId) {
                        try {
                            // Ensure storeId is string
                            s = await fiscalService.initSettings(String(storeId));
                        } catch (initError: any) {
                            throw new Error('Erro ao inicializar fiscal: ' + initError.message);
                        }
                    }
                }

                setSettings(s);
            } catch (error: any) {
                console.error('Error loading fiscal settings:', error);
                // Save error to state to display
                setSettings(null); // Keep null
                setError(error.message || 'Erro desconhecido');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            await fiscalService.saveSettings(settings);
            // Simulate network delay for better UX
            await new Promise(resolve => setTimeout(resolve, 800));
            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 3000);
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar.');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: keyof FiscalSettingsData, value: any) => {
        if (!settings) return;
        setSettings({
            ...settings,
            [field]: value
        });
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-gray-500 font-medium">Carregando configurações fiscais...</div>;

    if (!settings) return (
        <div className="p-8 text-center bg-white rounded-2xl border border-gray-200 shadow-sm">
            <AlertCircle size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">Configurações Fiscais Indisponíveis</h3>
            <p className="text-gray-500 mb-6">Não foi possível localizar ou criar as configurações fiscais para esta loja.</p>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100 font-mono text-left overflow-auto max-h-32">
                    <strong>Erro Técnico:</strong> {error}
                </div>
            )}

            <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
                Tentar Novamente
            </button>
        </div>
    );

    return (
        <div className="w-full">
            <div className="space-y-8">
                <div className="flex justify-end mb-4">
                    {showSaveSuccess && (
                        <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 text-sm font-bold animate-in fade-in slide-in-from-right-4 mr-4">
                            <Check size={16} /> Salvo com sucesso!
                        </div>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving || !editable}
                        className="flex items-center gap-2 bg-gray-900 text-white px-6 py-2.5 rounded-xl hover:bg-gray-800 transition-all font-bold shadow-lg shadow-gray-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                        <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
                    </button>
                </div>

                {!editable && (
                    <div className="bg-blue-50 border border-blue-100 text-blue-800 px-4 py-3 rounded-xl flex items-center gap-2">
                        <AlertCircle size={18} />
                        <span className="font-medium">Modo de visualização. Apenas administradores podem alterar estas configurações.</span>
                    </div>
                )}
                <fieldset disabled={!editable} className="contents">

                    {/* Mode Selection */}
                    <section className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                        <div className="mb-6 pb-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600"><Printer size={18} /></div>
                                Modo Fiscal
                            </h3>
                            <p className="text-sm text-gray-500 mt-1 ml-9">Defina como a loja emite documentos fiscais.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputGroup label="Tipo de Emissão" required>
                                <select
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                                    value={settings.mode}
                                    onChange={e => handleChange('mode', e.target.value as FiscalMode)}
                                >
                                    <option value="none">Nenhum (Fiscal Desativado)</option>
                                    <option value="nfe">NF-e (Nota Fiscal Eletrônica)</option>
                                    <option value="sat">SAT (Cupom Fiscal Eletrônico - SP)</option>
                                    <option value="ecf">ECF (Emissor de Cupom Fiscal)</option>
                                    <option value="simulated">Simulado (Apenas Testes)</option>
                                </select>
                            </InputGroup>

                            {settings.mode === 'nfe' && (
                                <InputGroup label="Provedor NF-e" required>
                                    <select
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                                        value={settings.nfe_provider || 'none'}
                                        onChange={e => handleChange('nfe_provider', e.target.value)}
                                    >
                                        <option value="none">Selecione...</option>
                                        <option value="enotas">eNotas</option>
                                        <option value="plugnotas">PlugNotas</option>
                                        <option value="nuvemfiscal">Nuvem Fiscal</option>
                                    </select>
                                </InputGroup>
                            )}
                        </div>

                        {settings.mode === 'simulated' && (
                            <div className="mt-6 flex items-start gap-3 p-4 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-100">
                                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                                <div className="text-sm">
                                    <strong>Modo Simulação Ativo</strong>
                                    <p className="mt-1 opacity-90">
                                        Todas as operacões gerarão documentos fictícios com status "Simulado". Nenhuma comunicação externa será feita. Útil para validação de fluxo.
                                    </p>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Hardware / Bridge Integration */}
                    {(settings.mode === 'sat' || settings.mode === 'ecf') && (
                        <section className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm animate-in slide-in-from-top-4">
                            <div className="mb-6 pb-4 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <div className="p-1.5 bg-purple-50 rounded-lg text-purple-600"><Server size={18} /></div>
                                    Integração Local (Bridge)
                                </h3>
                                <p className="text-sm text-gray-500 mt-1 ml-9">Configure o endereço do serviço que conversa com o equipamento físico.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {settings.mode === 'sat' && (
                                    <InputGroup label="URL do Bridge SAT" required helpText="Ex: http://localhost:5000/api/sat/emissao">
                                        <input
                                            type="text"
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            value={settings.sat_endpoint_url || ''}
                                            onChange={e => handleChange('sat_endpoint_url', e.target.value)}
                                            placeholder="http://localhost:5000/api/sat/emissao"
                                        />
                                    </InputGroup>
                                )}

                                {settings.mode === 'ecf' && (
                                    <InputGroup label="URL do Bridge ECF" required helpText="Ex: http://localhost:5000/api/ecf/emissao">
                                        <input
                                            type="text"
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                            value={settings.ecf_endpoint_url || ''}
                                            onChange={e => handleChange('ecf_endpoint_url', e.target.value)}
                                            placeholder="http://localhost:5000/api/ecf/emissao"
                                        />
                                    </InputGroup>
                                )}
                            </div>

                            <div className="mt-4 p-4 bg-gray-50 rounded-xl text-xs text-gray-500 border border-gray-200">
                                <p><strong>Nota:</strong> O "Bridge" é um pequeno software que deve estar rodando no computador onde o equipamento está conectado via USB. Ele expõe uma API HTTP local que este sistema consome.</p>
                            </div>
                        </section>
                    )}

                </fieldset>
            </div>
        </div>
    );
};
