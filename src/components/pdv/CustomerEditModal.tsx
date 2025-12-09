import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { db } from '../../services/dbService';
import { Customer, HealthInsurancePlan } from '../../types';

interface CustomerEditModalProps {
    customer: Customer;
    onClose: () => void;
    onSave: (updatedCustomer: Customer) => void;
}

export const CustomerEditModal: React.FC<CustomerEditModalProps> = ({ customer, onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState<HealthInsurancePlan[]>([]);

    const [formData, setFormData] = useState({
        name: customer.name || '',
        phone: customer.phone || '',
        cpf: customer.cpf || '',
        birthDate: customer.birthDate ? new Date(customer.birthDate).toISOString().split('T')[0] : '',
        email: customer.email || '',
        insurancePlanId: customer.healthInsurancePlan?.id || '',
        insuranceCardNumber: customer.insuranceCardNumber || ''
    });

    const [insuranceEnabled, setInsuranceEnabled] = useState(false);

    useEffect(() => {
        loadSettings();
        loadPlans();
    }, []);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const updatedData = {
                ...customer,
                ...formData,
                // If insurance plan changed, we need to handle it (though db.updateCustomer might expect just the ID or object)
                // dbService.updateCustomer usually takes the full object. 
                // We might need to fetch the plan object if we want to update the local state immediately with the full plan details.
            };

            // We need to pass the plan object if we want it to be reflected immediately in the UI without a refetch
            // But db.updateCustomer likely expects the ID to be saved in the DB.
            // Let's check dbService.updateCustomer implementation if needed, but usually we just send the object.

            // Actually, for the local state update to be correct (showing the plan name), we should find the plan object.
            const selectedPlan = plans.find(p => p.id === formData.insurancePlanId);
            if (selectedPlan) {
                updatedData.healthInsurancePlan = selectedPlan;
            } else if (formData.insurancePlanId === '') {
                updatedData.healthInsurancePlan = undefined;
            }

            await db.updateCustomer(updatedData);
            onSave(updatedData);
            onClose();
        } catch (error) {
            alert('Erro ao atualizar cliente');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-900">Editar Cliente</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    value={formData.cpf}
                                    onChange={e => {
                                        let v = e.target.value.replace(/\D/g, '');
                                        if (v.length > 11) v = v.slice(0, 11);
                                        v = v.replace(/(\d{3})(\d)/, '$1.$2');
                                        v = v.replace(/(\d{3})(\d)/, '$1.$2');
                                        v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                                        setFormData({ ...formData, cpf: v });
                                    }}
                                    placeholder="000.000.000-00"
                                />
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
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
                                <div className="col-span-2 grid grid-cols-2 gap-4 bg-purple-50 p-4 rounded-xl border border-purple-100">
                                    <div>
                                        <label className="block text-xs font-bold text-purple-800 mb-1 uppercase">Convênio / Plano</label>
                                        <select
                                            className="w-full px-4 py-2.5 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 outline-none text-sm"
                                            value={formData.insurancePlanId}
                                            onChange={e => setFormData({ ...formData, insurancePlanId: e.target.value })}
                                        >
                                            <option value="">Nenhum</option>
                                            {plans.map(plan => (
                                                <option key={plan.id} value={plan.id}>
                                                    {plan.name} ({plan.discount_percent}% desc)
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-purple-800 mb-1 uppercase">Nº Carteirinha</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2.5 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 outline-none text-sm"
                                            value={formData.insuranceCardNumber}
                                            onChange={e => setFormData({ ...formData, insuranceCardNumber: e.target.value })}
                                            placeholder="0000000000"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2"
                            >
                                <Save size={18} />
                                {loading ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
