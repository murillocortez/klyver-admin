import React, { useEffect, useState } from 'react';
import {
    DollarSign, Calendar, TrendingDown, CheckCircle,
    AlertCircle, Search, Plus, Filter, ArrowUpRight
} from 'lucide-react';
import { financialService } from '../../services/purchasing/financialService';
import { supplierService } from '../../services/purchasing/supplierService';

export const FinancialPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [payables, setPayables] = useState<any[]>([]);
    const [summary, setSummary] = useState({ totalPending: 0, totalOverdue: 0, totalPaid: 0 });
    const [showModal, setShowModal] = useState(false);

    // Quick Add Form State
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [newPayable, setNewPayable] = useState({
        supplier_id: '',
        amount: '',
        due_date: '',
        purchase_id: null
    });

    useEffect(() => {
        loadData();
        loadSuppliers();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await financialService.getAll();
            // Check for overdue items locally to update UI status correctly if needed
            // But for now trust the DB or service.
            setPayables(data);

            const stats = await financialService.getSummary();
            setSummary(stats);
        } catch (error) {
            console.error(error);
            alert('Erro ao carregar financeiro.');
        } finally {
            setLoading(false);
        }
    };

    const loadSuppliers = async () => {
        const data = await supplierService.getAll();
        setSuppliers(data.filter(s => s.ativo));
    };

    const handleCreate = async () => {
        if (!newPayable.supplier_id || !newPayable.amount || !newPayable.due_date) {
            alert('Preencha os campos obrigatórios');
            return;
        }

        try {
            await financialService.create({
                supplier_id: newPayable.supplier_id,
                amount: parseFloat(newPayable.amount),
                due_date: newPayable.due_date,
                status: 'pendente',
                purchase_id: null,
                paid_at: null
            } as any);

            setShowModal(false);
            setNewPayable({ supplier_id: '', amount: '', due_date: '', purchase_id: null });
            loadData();
        } catch (error) {
            console.error(error);
            alert('Erro ao criar lançamento.');
        }
    };

    const handleMarkAsPaid = async (id: string, amount: number) => {
        if (!confirm(`Confirmar pagamento de R$ ${amount.toFixed(2)}?`)) return;
        try {
            await financialService.markAsPaid(id);
            loadData();
        } catch (error) {
            console.error(error);
            alert('Erro ao baixar conta.');
        }
    };

    const getStatusInfo = (status: string, dueDate: string) => {
        const isOverdue = new Date(dueDate) < new Date() && status !== 'pago';

        if (status === 'pago') return {
            color: 'bg-green-100 text-green-700',
            label: 'Pago',
            icon: <CheckCircle size={14} />
        };

        if (isOverdue || status === 'atrasado') return {
            color: 'bg-red-100 text-red-700',
            label: 'Atrasado',
            icon: <AlertCircle size={14} />
        };

        return {
            color: 'bg-yellow-100 text-yellow-700',
            label: 'Pendente',
            icon: <ClockIcon />
        };
    };

    const ClockIcon = () => <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />;

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <DollarSign className="text-primary" />
                        Financeiro (Contas a Pagar)
                    </h1>
                    <p className="text-gray-500">Gerencie seus compromissos financeiros com fornecedores</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                    <Plus size={18} />
                    Novo Lançamento
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <AlertCircle size={64} className="text-red-500" />
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Vencido / Atrasado</p>
                    <p className="text-2xl font-bold text-red-600 mt-2">R$ {summary.totalOverdue.toFixed(2)}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Calendar size={64} className="text-yellow-500" />
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">A Vencer (Pendente)</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-2">R$ {summary.totalPending.toFixed(2)}</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CheckCircle size={64} className="text-green-500" />
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Pago (Total)</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">R$ {summary.totalPaid.toFixed(2)}</p>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                        <tr>
                            <th className="p-4">Vencimento</th>
                            <th className="p-4">Fornecedor</th>
                            <th className="p-4">Descrição / Pedido</th>
                            <th className="p-4 text-right">Valor</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {payables.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-12 text-center text-gray-400">
                                    Nenhum lançamento encontrado.
                                </td>
                            </tr>
                        ) : payables.map(item => {
                            const status = getStatusInfo(item.status, item.due_date);
                            return (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-gray-900 font-medium">
                                        {new Date(item.due_date).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-gray-700">
                                        {item.supplier?.nome_fantasia || item.supplier?.razao_social}
                                    </td>
                                    <td className="p-4 text-gray-500 text-xs">
                                        {item.purchase_id ? (
                                            <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded w-fit">
                                                Pedido #{item.purchase?.id?.slice(0, 6) || item.purchase_id.slice(0, 6)}
                                            </span>
                                        ) : 'Lançamento Manual'}
                                    </td>
                                    <td className="p-4 text-right font-bold text-gray-900">
                                        R$ {item.amount.toFixed(2)}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${status.color}`}>
                                            {status.icon} {status.label}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        {item.status !== 'pago' && (
                                            <button
                                                onClick={() => handleMarkAsPaid(item.id, item.amount)}
                                                className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-xs font-medium flex items-center gap-1 mx-auto"
                                                title="Dar Baixa"
                                            >
                                                Dar Baixa
                                            </button>
                                        )}
                                        {item.status === 'pago' && (
                                            <span className="text-xs text-gray-400">Baixado em {new Date(item.paid_at).toLocaleDateString()}</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">
                        <h2 className="text-lg font-bold mb-4">Novo Lançamento</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary/20"
                                    value={newPayable.supplier_id}
                                    onChange={e => setNewPayable({ ...newPayable, supplier_id: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.nome_fantasia || s.razao_social}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary/20"
                                    value={newPayable.amount}
                                    onChange={e => setNewPayable({ ...newPayable, amount: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data Vencimento</label>
                                <input
                                    type="date"
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary/20"
                                    value={newPayable.due_date}
                                    onChange={e => setNewPayable({ ...newPayable, due_date: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
                                <button onClick={handleCreate} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Salvar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
