import React, { useEffect, useState } from 'react';
import { Save, Check, RefreshCw, AlertCircle, MessageSquare, Send, Lock } from 'lucide-react';
import { useRole } from '../hooks/useRole';
import { whatsappService } from '../services/whatsappService';
import { NotificationSettingsData } from '../services/whatsapp/types';
import { useSubscription } from '../context/SubscriptionContext';

const InputGroup = ({ label, children, helpText }: any) => (
    <div className="space-y-1.5">
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
            {label}
        </label>
        {children}
        {helpText && <p className="text-xs text-gray-400">{helpText}</p>}
    </div>
);

const ToggleCard = ({ title, description, checked, onChange, disabled }: any) => (
    <div className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${checked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
        <label className="relative inline-flex items-center cursor-pointer mt-1">
            <input
                type="checkbox"
                className="sr-only peer"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
            />
            <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${checked ? 'peer-checked:bg-green-600' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
        </label>
        <div>
            <span className={`text-sm font-bold ${checked ? 'text-green-800' : 'text-gray-900'}`}>{title}</span>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
    </div>
);

export const NotificationSettings: React.FC = () => {
    const [settings, setSettings] = useState<NotificationSettingsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const { canEdit } = useRole();
    const editable = canEdit('settings');
    const { isFeatureEnabled } = useSubscription();
    const isWhatsappEnabled = isFeatureEnabled('api_whatsapp');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await whatsappService.getSettings();
            setSettings(data);
        } catch (error) {
            console.error('Error loading notification settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;
        setSaving(true);
        try {
            await whatsappService.saveSettings(settings);
            await new Promise(resolve => setTimeout(resolve, 800));
            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 3000);
        } catch (error: any) {
            console.error(error);
            alert('Erro ao salvar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleTestSend = async () => {
        if (!settings?.whatsapp_enabled) {
            alert('Ative as notificações do WhatsApp primeiro.');
            return;
        }

        const phone = window.prompt('Digite um número de celular para teste (com DDD):', '5511999999999');
        if (!phone) return;

        setTesting(true);
        try {
            // First save current settings to ensure we test what is on screen
            // But wait, if we save, we might persist incomplete config. Ideally test with current form data?
            // Service reads from DB. So we MUST save first or update service to accept config overrides.
            // For now, let's auto-save before test if user agrees.

            // Actually, let's just warn user they need to save first if dirty? 
            // Simplifying: Just call service. But service reads from DB.
            // So we will silently save first.
            await whatsappService.saveSettings(settings);

            const success = await whatsappService.sendWhatsappMessage(phone, '🔔 Teste de Integração FarmaVida: Tudo funcionando perfeitamente!');

            if (success) {
                alert('✅ Mensagem enviada com sucesso! Verifique o celular.');
            } else {
                alert('⚠️ O envio falhou. Verifique os logs.');
            }
        } catch (error: any) {
            alert('Erro no teste: ' + error.message);
        } finally {
            setTesting(false);
        }
    };

    const handleChange = (field: keyof NotificationSettingsData, value: any) => {
        if (!settings) return;
        setSettings({ ...settings, [field]: value });
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Carregando...</div>;
    if (!settings) return <div className="p-8 text-center text-red-500">Erro ao carregar configurações.</div>;

    if (!isWhatsappEnabled) {
        return (
            <div className="w-full p-8 text-center bg-gray-50 rounded-2xl border border-gray-200 flex flex-col items-center justify-center h-96">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Lock size={32} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Integração WhatsApp Bloqueada</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                    A automação de mensagens via WhatsApp é um recurso exclusivo dos planos <strong>Pro</strong> e <strong>Premium</strong>.
                </p>
                <div className="bg-gray-200 text-gray-400 px-6 py-2 rounded-lg font-bold cursor-not-allowed inline-block">
                    Fazer Upgrade do Plano
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="space-y-8">
                {/* Header Actions */}
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

                {/* Global Toggle */}
                <section className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-50 rounded-lg text-green-600">
                                <MessageSquare size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Notificações Automáticas</h3>
                                <p className="text-sm text-gray-500">Envie atualizações de pedidos via WhatsApp para seus clientes.</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.whatsapp_enabled}
                                onChange={(e) => handleChange('whatsapp_enabled', e.target.checked)}
                                disabled={!editable}
                            />
                            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                    </div>

                    <fieldset disabled={!editable || !settings.whatsapp_enabled} className="space-y-6">
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputGroup label="Provedor de Envio" helpText="Escolha 'Simulado' para testes sem custos.">
                                <select
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                    value={settings.whatsapp_provider}
                                    onChange={(e) => handleChange('whatsapp_provider', e.target.value)}
                                >
                                    <option value="simulated">Simulado (Apenas Logs)</option>
                                    <option value="evolution_api">Evolution API (Recomendado)</option>
                                    <option value="ultramsg">UltraMsg</option>
                                    <option value="whatsapp_business">WhatsApp Business API</option>
                                </select>
                            </InputGroup>

                            {settings.whatsapp_provider !== 'simulated' && (
                                <>
                                    {/* Fields for Evolution API */}
                                    {settings.whatsapp_provider === 'evolution_api' && (
                                        <>
                                            <InputGroup label="Base URL da API">
                                                <input
                                                    type="text"
                                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                                    value={settings.whatsapp_url || ''}
                                                    onChange={(e) => handleChange('whatsapp_url', e.target.value)}
                                                    placeholder="Ex: https://api.meudominio.com"
                                                />
                                            </InputGroup>
                                            <InputGroup label="Nome da Instância">
                                                <input
                                                    type="text"
                                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                                    value={settings.whatsapp_instance || ''}
                                                    onChange={(e) => handleChange('whatsapp_instance', e.target.value)}
                                                    placeholder="Ex: MinhaInstancia"
                                                />
                                            </InputGroup>
                                        </>
                                    )}

                                    {/* Field: API Token / Key */}
                                    <InputGroup label="API Token / Key">
                                        <input
                                            type="password"
                                            className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                            value={settings.whatsapp_api_key || ''}
                                            onChange={(e) => handleChange('whatsapp_api_key', e.target.value)}
                                            placeholder="••••••••••••••••"
                                        />
                                    </InputGroup>

                                    {/* Field: Number (Not needed for Evolution usually, but useful for others) */}
                                    {settings.whatsapp_provider !== 'evolution_api' && (
                                        <InputGroup label="Número do Remetente" helpText="Ex: 5511999999999">
                                            <input
                                                type="text"
                                                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                                                value={settings.whatsapp_business_number || ''}
                                                onChange={(e) => handleChange('whatsapp_business_number', e.target.value)}
                                                placeholder="55..."
                                            />
                                        </InputGroup>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Test Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={handleTestSend}
                                disabled={testing || !settings.whatsapp_enabled}
                                className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors font-bold text-sm border border-blue-100 disabled:opacity-50"
                            >
                                {testing ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
                                {testing ? 'Enviando...' : 'Testar Envio Interativo'}
                            </button>
                        </div>

                        {settings.whatsapp_provider === 'simulated' && (
                            <div className="flex items-start gap-3 p-4 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-100">
                                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                                <div className="text-sm">
                                    <strong>Modo Simulação Ativo</strong>
                                    <p className="mt-1 opacity-90">
                                        As mensagens serão apenas registradas no banco de dados e mostradas no console/debug. Nenhuma mensagem real será enviada ao cliente.
                                    </p>
                                </div>
                            </div>
                        )}
                    </fieldset>
                </section>

                <section className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">Eventos de Disparo</h3>
                    <fieldset disabled={!editable || !settings.whatsapp_enabled} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ToggleCard
                            title="Pedido Criado"
                            description="Enviar confirmação assim que o cliente finalizar a compra."
                            checked={settings.send_on_created}
                            onChange={(v: boolean) => handleChange('send_on_created', v)}
                        />
                        <ToggleCard
                            title="Pedido Aprovado"
                            description="Avisar quando o pagamento for confirmado."
                            checked={settings.send_on_approved}
                            onChange={(v: boolean) => handleChange('send_on_approved', v)}
                        />
                        <ToggleCard
                            title="Saiu para Entrega"
                            description="Avisar quando o motoboy sair com o pedido."
                            checked={settings.send_on_delivery_start}
                            onChange={(v: boolean) => handleChange('send_on_delivery_start', v)}
                        />
                        <ToggleCard
                            title="Disponível para Retirada"
                            description="Avisar que o cliente já pode buscar na loja."
                            checked={settings.send_on_ready_for_pickup}
                            onChange={(v: boolean) => handleChange('send_on_ready_for_pickup', v)}
                        />
                        <ToggleCard
                            title="Pedido Entregue"
                            description="Mensagem de finalização e agradecimento."
                            checked={settings.send_on_delivered}
                            onChange={(v: boolean) => handleChange('send_on_delivered', v)}
                        />
                    </fieldset>
                </section>
            </div>
        </div>
    );
};
