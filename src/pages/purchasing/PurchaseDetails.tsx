import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, FileText, Calendar, Truck, CreditCard } from 'lucide-react';
import { purchaseService } from '../../services/purchasing/purchaseService';
import { Purchase } from '../../services/purchasing/types';

export const PurchaseDetails: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [purchase, setPurchase] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        if (!id) return;
        try {
            const data = await purchaseService.getById(id);
            setPurchase(data);
        } catch (error) {
            console.error(error);
            alert('Erro ao carregar pedido.');
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
            <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide ${styles[status] || 'bg-gray-100'}`}>
                {labels[status] || status}
            </span>
        );
    };

    if (loading) return <div className="p-12 text-center text-gray-500">Carregando pedido...</div>;
    if (!purchase) return <div className="p-12 text-center text-gray-500">Pedido não encontrado.</div>;

    return (
        <div className="p-6 max-w-[1200px] mx-auto space-y-8 pb-32">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/purchases')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900">Pedido #{purchase.id.slice(0, 8)}</h1>
                            {getStatusBadge(purchase.status)}
                        </div>
                        <p className="text-gray-500 mt-1">Criado em {new Date(purchase.created_at).toLocaleString()}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 font-medium">
                        <Printer size={18} />
                        Imprimir
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium shadow-sm">
                        <FileText size={18} />
                        Lançar Nota Fiscal
                    </button>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Supplier Info */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Truck size={16} /> Fornecedor
                    </h3>
                    <div>
                        <p className="font-bold text-lg text-gray-900">{purchase.supplier?.nome_fantasia || purchase.supplier?.razao_social}</p>
                        <p className="text-gray-600 text-sm mt-1">{purchase.supplier?.cnpj}</p>
                        <p className="text-gray-500 text-sm mt-2">{purchase.supplier?.email}</p>
                        <p className="text-gray-500 text-sm">{purchase.supplier?.telefone}</p>
                    </div>
                </div>

                {/* Terms Info */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <CreditCard size={16} /> Condições do Pedido
                    </h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600 text-sm">Pagamento:</span>
                            <span className="font-medium text-gray-900">{purchase.payment_terms || 'Não definido'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 text-sm">Nota Fiscal:</span>
                            <span className="font-medium text-gray-900">{purchase.invoice_number || 'Pendente'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600 text-sm">Previsão Entrega:</span>
                            <span className="font-medium text-gray-900">-</span>
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                    <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4">
                        Resumo Financeiro
                    </h3>
                    <div className="space-y-2 mb-4 pt-2">
                        <div className="flex justify-between text-blue-900/70 text-sm">
                            <span>Subtotal Itens</span>
                            <span>R$ {purchase.total_amount?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-blue-900/70 text-sm">
                            <span>Frete</span>
                            <span>R$ 0,00</span>
                        </div>
                    </div>
                    <div className="border-t border-blue-200 pt-3 flex justify-between items-end">
                        <span className="font-bold text-blue-900">Total do Pedido</span>
                        <span className="font-bold text-2xl text-blue-700">R$ {purchase.total_amount?.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900">Itens do Pedido</h3>
                    <span className="text-sm text-gray-500">{purchase.items?.length} itens listados</span>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="text-gray-500 font-medium border-b border-gray-200 bg-white">
                        <tr>
                            <th className="px-6 py-3">Produto</th>
                            <th className="px-6 py-3 text-center">Qtd.</th>
                            <th className="px-6 py-3 text-right">Valor Unit.</th>
                            <th className="px-6 py-3 text-right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {purchase.items?.map((item: any) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-gray-900">{item.product?.name}</p>
                                    <p className="text-xs text-gray-500">SKU: {item.product?.sku}</p>
                                </td>
                                <td className="px-6 py-4 text-center font-mono text-gray-700">
                                    {item.quantity}
                                </td>
                                <td className="px-6 py-4 text-right text-gray-700">
                                    R$ {item.unit_price?.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-gray-900">
                                    R$ {(item.quantity * item.unit_price)?.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
