import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Check, Globe, CreditCard, Loader2 } from 'lucide-react';
import { db } from '../../services/dbService';
import { Customer, HealthInsurancePlan } from '../../types';
import { brasilApiService } from '../../services/external/brasilApiService';
import { govBrService } from '../../services/external/govBrService';
import { healthPlanService } from '../../services/healthPlanService';

interface CustomerIdentifyModalProps {
    onClose: () => void;
    onSelect: (customer: Customer) => void;
}

export const CustomerIdentifyModal: React.FC<CustomerIdentifyModalProps> = ({ onClose, onSelect }) => {
    const [mode, setMode] = useState<'search' | 'create'>('search');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState<HealthInsurancePlan[]>([]);

    const [insuranceEnabled, setInsuranceEnabled] = useState(false);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [planCheckLoading, setPlanCheckLoading] = useState(false);
    const [planStatus, setPlanStatus] = useState<{ active: boolean; name: string; discount: number } | null>(null);

    // New Customer Form
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        cpf: '', // Can be CPF or CNPJ
        birthDate: '',
        email: '',
        address: '',
        referrer: '',
        insurancePlanId: '',
        insuranceCardNumber: ''
    });

    useEffect(() => {
        loadSettings();
        loadPlans();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const loadSettings = async () => {
        const settings = await db.getSettings();
        setInsuranceEnabled(settings.enableHealthInsurance);
    };

    const loadPlans = async () => {
        try {
            const data = await db.getHealthInsurancePlans();
            setPlans(data);
        } catch (error) {
            console.error('Error loading plans', error);
        }
    };

    const handleSearch = async () => {
        if (searchTerm.length < 3) return;
        setLoading(true);
        try {
            // Simple search implementation - in real app, use db.searchCustomers
            // For now, we'll fetch all and filter client-side or assume db.getCustomers supports search
            // We'll use a direct supabase call here for efficiency if dbService doesn't have search
            // But let's try to use dbService if possible. db.getCustomers() gets all.
            // Let's assume we need to implement search in dbService or just filter here for MVP
            const allCustomers = await db.getCustomers();
            const filtered = allCustomers.filter(c =>
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.cpf?.includes(searchTerm) ||
                c.phone.includes(searchTerm)
            );
            setSearchResults(filtered.slice(0, 5));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCpfBlur = async () => {
        const cleanVal = formData.cpf.replace(/\D/g, '');
        if (cleanVal.length === 14) {
            // CNPJ Lookup
            setLookupLoading(true);
            const data = await brasilApiService.getCnpj(cleanVal);
            setLookupLoading(false);

            if (data) {
                setFormData(prev => ({
                    ...prev,
                    name: data.razao_social, // Or nome_fantasia
                    phone: data.ddd_telefone_1 ? `(${data.ddd_telefone_1.substring(0, 2)}) ${data.ddd_telefone_1.substring(2)}` : prev.phone,
                    address: `${data.logradouro}, ${data.numero} - ${data.bairro}, ${data.municipio} - ${data.uf}`,
                    referrer: data.cnae_fiscal_descricao // Main activity as referrer/notes
                }));
            }
        }
    };

    const handleGovBrImport = async () => {
        setLookupLoading(true);
        try {
            const data = await govBrService.importDataStub();
            setFormData(prev => ({
                ...prev,
                name: data.name,
                birthDate: data.birthdate,
                email: data.email,
                phone: data.phone,
                cpf: data.cpf
            }));
        } catch (e) {
            console.error(e);
            alert('Erro ao importar do Gov.br');
        } finally {
            setLookupLoading(false);
        }
    };

    const handleCheckPlan = async () => {
        if (!formData.cpf) return alert('Preencha o CPF primeiro');
        setPlanCheckLoading(true);
        // Check all providers stub
        const providers: ('vidalink' | 'funcional' | 'epharma')[] = ['vidalink', 'funcional', 'epharma'];

        let found = null;
        for (const p of providers) {
            const res = await healthPlanService.checkPlan(formData.cpf, p);
            if (res.has_plan) {
                found = res;
                break;
            }
        }

        setPlanCheckLoading(false);
        if (found) {
            setPlanStatus({ active: true, name: found.plan_name, discount: found.discount_percent });
            // Try to auto-select plan in dropdown if name matches roughly, or just show badge
            // Ideally we would map the provider plan to our internal plan ID
        } else {
            setPlanStatus({ active: false, name: '', discount: 0 });
            alert('Nenhum plano encontrado para este CPF.');
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const newCustomer = await db.createCustomerQuick(formData);
            onSelect(newCustomer);
            onClose();
        } catch (error) {
            alert('Erro ao cadastrar cliente');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-900">Identificar Cliente</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Tabs */}
                    <div className="flex gap-4 mb-6">
                        <button
                            onClick={() => setMode('search')}
                            className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2
                ${mode === 'search' ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-500/20' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                        >
                            <Search size={18} />
                            Buscar Cliente
                        </button>
                        <button
                            onClick={() => setMode('create')}
                            className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2
                ${mode === 'create' ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-500/20' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                        >
                            <UserPlus size={18} />
                            Novo Cadastro
                        </button>
                    </div>

                    {mode === 'search' ? (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Nome, CPF ou Telefone"
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl outline-none transition-all text-lg"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                    autoFocus
                                />
                                <button
                                    onClick={handleSearch}
                                    className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                                >
                                    Buscar
                                </button>
                            </div>

                            <div className="space-y-2 mt-4 max-h-64 overflow-y-auto">
                                {searchResults.map(customer => (
                                    <button
                                        key={customer.id}
                                        onClick={() => { onSelect(customer); onClose(); }}
                                        className="w-full p-4 bg-white border border-gray-100 hover:border-blue-300 hover:bg-blue-50 rounded-xl flex items-center justify-between group transition-all text-left"
                                    >
                                        <div>
                                            <p className="font-bold text-gray-900">{customer.name}</p>
                                            <p className="text-sm text-gray-500 flex gap-3">
                                                <span>{customer.cpf || 'Sem CPF'}</span>
                                                <span>•</span>
                                                <span>{customer.phone}</span>
                                            </p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center group-hover:border-blue-500 group-hover:text-blue-600">
                                            <Check size={16} />
                                        </div>
                                    </button>
                                ))}
                                {searchResults.length === 0 && searchTerm.length > 2 && !loading && (
                                    <div className="text-center py-8 text-gray-400">
                                        Nenhum cliente encontrado.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">CPF / CNPJ</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                                            value={formData.cpf}
                                            onChange={e => {
                                                let v = e.target.value.replace(/\D/g, '');
                                                if (v.length > 14) v = v.slice(0, 14);

                                                if (v.length > 11) {
                                                    // CNPJ Mask
                                                    v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
                                                } else {
                                                    // CPF Mask
                                                    v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
                                                }
                                                setFormData({ ...formData, cpf: v });
                                            }}
                                            onBlur={handleCpfBlur}
                                            placeholder="000.000.000-00 ou CNPJ"
                                        />
                                        {lookupLoading && (
                                            <div className="absolute right-3 top-2.5">
                                                <Loader2 className="animate-spin text-blue-600" size={18} />
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleGovBrImport}
                                        className="mt-1 text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                                    >
                                        <Globe size={12} /> Importar dados via Gov.br
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                                    <input
                                        required
                                        type="tel"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                                        value={formData.phone}
                                        onChange={e => {
                                            let v = e.target.value.replace(/\D/g, '');
                                            if (v.length > 11) v = v.slice(0, 11);
                                            if (v.length > 10) {
                                                v = v.replace(/^(\d\d)(\d)(\d{4})(\d{4}).*/, '($1) $2 $3-$4');
                                            } else if (v.length > 6) {
                                                v = v.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, '($1) $2-$3');
                                            } else if (v.length > 2) {
                                                v = v.replace(/^(\d\d)(\d{0,5}).*/, '($1) $2');
                                            } else {
                                                v = v.replace(/^(\d*)/, '($1');
                                            }
                                            setFormData({ ...formData, phone: v });
                                        }}
                                        placeholder="(00) 0 0000-0000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                                        value={formData.birthDate}
                                        onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                                    />
                                </div>

                                {insuranceEnabled && (
                                    <div className="col-span-2 bg-purple-50 p-4 rounded-xl border border-purple-100 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-purple-900 flex items-center gap-2">
                                                <CreditCard size={18} /> Convênio / Plano de Saúde
                                            </h4>
                                            <button
                                                type="button"
                                                onClick={handleCheckPlan}
                                                disabled={planCheckLoading}
                                                className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-purple-700 transition-colors flex items-center gap-1"
                                            >
                                                {planCheckLoading ? <Loader2 className="animate-spin" size={12} /> : <Search size={12} />}
                                                Consultar Plano
                                            </button>
                                        </div>

                                        {planStatus?.active && (
                                            <div className="bg-green-100 text-green-800 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                                                <Check size={16} />
                                                Plano encontrado: {planStatus.name} ({planStatus.discount}% OFF)
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-purple-800 mb-1 uppercase">Plano</label>
                                                <select
                                                    className="w-full px-4 py-2.5 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 outline-none text-sm"
                                                    value={formData.insurancePlanId}
                                                    onChange={e => setFormData({ ...formData, insurancePlanId: e.target.value })}
                                                >
                                                    <option value="">Selecione...</option>
                                                    {plans.map(plan => (
                                                        <option key={plan.id} value={plan.id}>
                                                            {plan.name} ({plan.discount_percent}% desc)
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-purple-800 mb-1 uppercase">Nº Carteirinha (Opcional)</label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-2.5 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 outline-none text-sm"
                                                    value={formData.insuranceCardNumber}
                                                    onChange={e => setFormData({ ...formData, insuranceCardNumber: e.target.value })}
                                                    placeholder="0000000000"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Rua, Número, Bairro..."
                                    />
                                </div>

                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quem indicou? (Opcional)</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                                        value={formData.referrer}
                                        onChange={e => setFormData({ ...formData, referrer: e.target.value })}
                                        placeholder="Nome do médico ou amigo"
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setMode('search')}
                                    className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                                >
                                    Voltar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                                >
                                    {loading ? 'Cadastrando...' : 'Cadastrar Cliente'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
