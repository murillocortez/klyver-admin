import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '../context/TenantContext';
import { supabase } from '../services/supabase';
import { Building2, Store, Clock, Truck, CheckCircle2, ChevronRight, ChevronLeft, Upload } from 'lucide-react';

const STEPS = [
    { id: 1, title: 'Dados da Farmácia', icon: Store },
    { id: 2, title: 'Fiscal e Contato', icon: Building2 },
    { id: 3, title: 'Horários', icon: Clock },
    { id: 4, title: 'Atendimento', icon: Truck },
];

export const OnboardingPage: React.FC = () => {
    const { tenant } = useTenant();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        // Step 1
        pharmacyName: tenant?.display_name || '',
        logoUrl: tenant?.logo_url || '',
        zipCode: '',
        address: '',
        neighborhood: '',
        city: '',
        state: '',

        // Step 2
        cnpj: '',
        corporateName: tenant?.display_name || '', // Default to fantasy name initially
        ie: '',
        phone: '',
        whatsapp: '',

        // Step 3
        hoursMonFri: '08:00 - 20:00',
        hoursSat: '08:00 - 18:00',
        hoursSun: 'Fechado',

        // Step 4
        deliveryEnabled: true,
        pickupEnabled: true,
        description: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleNext = () => {
        if (currentStep < STEPS.length) {
            setCurrentStep(curr => curr + 1);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(curr => curr - 1);
        }
    };

    const handleComplete = async () => {
        if (!tenant) return;
        setLoading(true);

        try {
            // 1. Create/Update Store Settings
            const settingsPayload = {
                tenant_id: tenant.id,
                pharmacy_name: formData.pharmacyName,
                logo_url: formData.logoUrl,
                address: `${formData.address}, ${formData.neighborhood}, ${formData.city} - ${formData.state}, ${formData.zipCode}`,
                cnpj: formData.cnpj,
                phone: formData.phone,
                email: '', // Get from tenant user if possible, or leave blank
                opening_hours: `Seg-Sex: ${formData.hoursMonFri}, Sáb: ${formData.hoursSat}, Dom: ${formData.hoursSun}`,

                // Default colors (Emerald/Teal theme)
                primary_color: '#10b981',
                secondary_color: '#064e3b',

                // Social
                social_whatsapp: formData.whatsapp,

                // Delivery
                delivery_fee_type: 'fixed',
                fixed_delivery_fee: 5.00,

                welcome_message: formData.description || `Bem-vindo à ${formData.pharmacyName}`,

                // Flags
                payment_credit_enabled: true,
                payment_pix_enabled: true,
                notification_new_order: true,

                updated_at: new Date().toISOString()
            };

            const { error: settingsError } = await supabase
                .from('store_settings')
                .upsert(settingsPayload, { onConflict: 'tenant_id' });

            if (settingsError) throw settingsError;

            // 2. Mark Tenant as Completed
            // @ts-ignore
            const { error: tenantError } = await (supabase as any)
                .from('tenants')
                .update({ onboarding_status: 'completed' } as any)
                .eq('id', tenant.id);

            if (tenantError) throw tenantError;

            // 3. Log Action (Optional but requested)
            // We'll skip complex logging for now or just console.log
            console.log(`Onboarding completed for tenant ${tenant.id}`);

            // 4. Redirect
            navigate('../dashboard');

        } catch (error: any) {
            console.error("Onboarding failed", error);
            alert(`Erro ao salvar dados: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER STEPS ---

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Dados da Farmácia</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Fantasia da Farmácia *</label>
                                <input required name="pharmacyName" value={formData.pharmacyName} onChange={handleChange} className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ex: Farmácia Ideal" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">CEP *</label>
                                <input required name="zipCode" value={formData.zipCode} onChange={handleChange} className="w-full border rounded-lg p-2.5 outline-none" placeholder="00000-000" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Endereço Completo (Rua e Número) *</label>
                                <input required name="address" value={formData.address} onChange={handleChange} className="w-full border rounded-lg p-2.5 outline-none" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Bairro *</label>
                                <input required name="neighborhood" value={formData.neighborhood} onChange={handleChange} className="w-full border rounded-lg p-2.5 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Cidade *</label>
                                <input required name="city" value={formData.city} onChange={handleChange} className="w-full border rounded-lg p-2.5 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">UF *</label>
                                <input required name="state" value={formData.state} onChange={handleChange} className="w-full border rounded-lg p-2.5 outline-none" maxLength={2} placeholder="SP" />
                            </div>

                            {/* Logo Upload Placeholder */}
                            <div className="md:col-span-2 mt-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Logo URL (Opcional)</label>
                                <div className="flex gap-2">
                                    <input name="logoUrl" value={formData.logoUrl} onChange={handleChange} className="flex-1 border rounded-lg p-2.5 outline-none text-sm text-slate-500" placeholder="https://..." />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Dados Fiscais e Contato</h2>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ *</label>
                                <input required name="cnpj" value={formData.cnpj} onChange={handleChange} className="w-full border rounded-lg p-2.5 outline-none" placeholder="00.000.000/0000-00" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Razão Social *</label>
                                <input required name="corporateName" value={formData.corporateName} onChange={handleChange} className="w-full border rounded-lg p-2.5 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Inscrição Estadual (Opcional)</label>
                                <input name="ie" value={formData.ie} onChange={handleChange} className="w-full border rounded-lg p-2.5 outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Telefone Fixo</label>
                                    <input name="phone" value={formData.phone} onChange={handleChange} className="w-full border rounded-lg p-2.5 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp *</label>
                                    <input required name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="w-full border rounded-lg p-2.5 outline-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Horário de Funcionamento</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Segunda a Sexta *</label>
                                <input name="hoursMonFri" value={formData.hoursMonFri} onChange={handleChange} className="w-full border rounded-lg p-2.5 outline-none" placeholder="Ex: 08:00 - 20:00" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Sábado *</label>
                                <input name="hoursSat" value={formData.hoursSat} onChange={handleChange} className="w-full border rounded-lg p-2.5 outline-none" placeholder="Ex: 08:00 - 18:00" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Domingo</label>
                                <input name="hoursSun" value={formData.hoursSun} onChange={handleChange} className="w-full border rounded-lg p-2.5 outline-none" placeholder="Ex: Fechado ou 08:00 - 12:00" />
                            </div>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Loja Virtual e Atendimento</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição Curta da Loja (Slogan)</label>
                                <input name="description" value={formData.description} onChange={handleChange} className="w-full border rounded-lg p-2.5 outline-none" placeholder="Ex: Sua saúde em primeiro lugar" />
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <span className="block text-sm font-bold text-slate-700 mb-3">Formas de Entrega Habilitadas</span>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 p-3 bg-white rounded-lg border cursor-pointer hover:border-emerald-500 transition-colors">
                                        <input type="checkbox" name="deliveryEnabled" checked={formData.deliveryEnabled} onChange={handleCheckboxChange} className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500" />
                                        <div>
                                            <span className="block font-medium text-slate-800">Delivery (Entrega)</span>
                                            <span className="text-xs text-slate-500">Motoboy entrega na casa do cliente</span>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-3 bg-white rounded-lg border cursor-pointer hover:border-emerald-500 transition-colors">
                                        <input type="checkbox" name="pickupEnabled" checked={formData.pickupEnabled} onChange={handleCheckboxChange} className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500" />
                                        <div>
                                            <span className="block font-medium text-slate-800">Retirada na Loja</span>
                                            <span className="text-xs text-slate-500">Cliente compra online e busca no balcão</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            {/* Background Decoration */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -left-20 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl"></div>
                <div className="absolute top-40 right-0 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"></div>
            </div>

            <div className="bg-white max-w-2xl w-full shadow-2xl rounded-2xl overflow-hidden z-10 relative flex flex-col md:flex-row min-h-[500px]">

                {/* Sidebar / Progress */}
                <div className="bg-slate-900 text-white w-full md:w-64 flex-shrink-0 p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-8">
                            <Store className="w-6 h-6 text-emerald-400" />
                            <span className="font-bold text-lg tracking-tight">FarmaMaster</span>
                        </div>

                        <nav className="space-y-6 relative">
                            {/* Connection Line */}
                            <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-slate-800 -z-0"></div>

                            {STEPS.map((step, idx) => {
                                const isActive = step.id === currentStep;
                                const isCompleted = step.id < currentStep;
                                const Icon = step.icon;

                                return (
                                    <div key={step.id} className="relative z-10 flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                        ${isActive ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30' :
                                                isCompleted ? 'bg-slate-800 border-emerald-500 text-emerald-500' : 'bg-slate-900 border-slate-700 text-slate-500'}`}>
                                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                                        </div>
                                        <span className={`text-sm font-medium transition-colors duration-300 ${isActive ? 'text-white' : isCompleted ? 'text-emerald-400' : 'text-slate-500'}`}>
                                            {step.title}
                                        </span>
                                    </div>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="mt-8 text-xs text-slate-500">
                        Passo {currentStep} de {STEPS.length}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 p-8">
                        {renderStepContent()}
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 1}
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors
                        ${currentStep === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <ChevronLeft className="w-4 h-4" /> Voltar
                        </button>

                        <button
                            onClick={handleNext}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-wait"
                        >
                            {loading ? 'Salvando...' : currentStep === STEPS.length ? 'Finalizar Configuração' : 'Continuar'}
                            {!loading && currentStep !== STEPS.length && <ChevronRight className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            <p className="mt-6 text-slate-400 text-sm">
                © 2024 FarmaMaster. Configuração inicial obrigatória.
            </p>
        </div>
    );
};
