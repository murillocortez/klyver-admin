import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingBag, Search, Filter, Plus, FileText, CheckCircle,
    Clock, XCircle, MoreVertical, Eye
} from 'lucide-react';
import { purchaseService } from '../../services/purchasing/purchaseService';
import { Purchase } from '../../services/purchasing/types';

export const PurchasesPage: React.FC = () => {
    const navigate = useNavigate();
    const [purchases, setPurchases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadPurchases();
    }, []);

    const loadPurchases = async () => {
        try {
            const data = await purchaseService.getAll();
            setPurchases(data);
        } catch (error) {
            console.error(error);
            alert('Erro ao carregar pedidos.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'lancado': 'bg-blue-100 text-blue-700',
            'recebido': 'bg-green-100 text-green-700',
            'pendente': 'bg-yellow-100 text-yellow-800',
            'cancelado': 'bg-red-100 text-red-700'
        };
        const labels: Record<string, string> = {
            'lancado': 'Lançado',
            'recebido': 'Recebido',
            'pendente': 'Pendente',
            'cancelado': 'Cancelado'
        };

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${styles[status] || 'bg-gray-100'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const filteredPurchases = purchases.filter(p =>
        p.supplier?.nome_fantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supplier?.razao_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.includes(searchTerm)
    );

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ShoppingBag className="text-primary" />
                        Pedidos de Compra
                    </h1>
                    <p className="text-gray-500">Gerencie seus pedidos e entradas de nota fiscal</p>
                </div>
                <button
                    onClick={() => navigate('/admin/quotations')}
                    className="bg-primary text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                    <Plus size={18} />
                    Novo Pedido (via Cotação)
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por fornecedor ou ID..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                {/* Add date filter later */}
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">Carregando pedidos...</div>
            ) : filteredPurchases.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                    <ShoppingBag className="mx-auto text-gray-300 mb-4" size={48} />
                    <h3 className="text-lg font-medium text-gray-900">Nenhum pedido encontrado</h3>
                    <p className="text-gray-500">Gere pedidos aprovando cotações.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                            <tr>
                                <th className="p-4">ID</th>
                                <th className="p-4">Fornecedor</th>
                                <th className="p-4">Data</th>
                                <th className="p-4 text-center">Itens</th>
                                <th className="p-4 text-right">Valor Total</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredPurchases.map(purchase => (
                                <tr key={purchase.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="p-4 font-mono text-xs text-gray-500">#{purchase.id.slice(0, 8)}</td>
                                    <td className="p-4">
                                        <p className="font-medium text-gray-900">{purchase.supplier?.nome_fantasia || purchase.supplier?.razao_social}</p>
                                        <p className="text-xs text-gray-500">CNPJ: {purchase.supplier?.cnpj || 'N/A'}</p>
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        {new Date(purchase.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-center">
                                        {purchase.items?.[0]?.count || 0}
                                    </td>
                                    <td className="p-4 text-right font-medium text-gray-900">
                                        R$ {purchase.total_amount?.toFixed(2)}
                                    </td>
                                    <td className="p-4 text-center">
                                        {getStatusBadge(purchase.status)}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => navigate(`/admin/purchases/${purchase.id}`)}
                                            className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Ver detalhes"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
