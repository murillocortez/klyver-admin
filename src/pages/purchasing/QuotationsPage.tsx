import React, { useEffect, useState } from 'react';
import { Calculator, Plus, Calendar, CheckCircle, XCircle, Search, ArrowRight, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { quotationService } from '../../services/purchasing/quotationService';
import { Quotation } from '../../services/purchasing/types';

export const QuotationsPage: React.FC = () => {
    const navigate = useNavigate();
    const [quotations, setQuotations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await quotationService.getAll();
            setQuotations(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        try {
            // Create a draft quotation immediately and redirect to edit
            const newQuote = await quotationService.create();
            navigate(`/admin/quotations/${newQuote.id}`);
        } catch (error) {
            alert('Erro ao criar cotação');
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Deseja excluir esta cotação?')) return;
        try {
            await quotationService.delete(id);
            loadData();
        } catch (error) {
            alert('Erro ao excluir.');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'aberta': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold uppercase">Aberta</span>;
            case 'fechada': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold uppercase">Fechada</span>;
            case 'cancelada': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold uppercase">Cancelada</span>;
            default: return null;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Calculator className="text-primary" />
                        Cotações de Compra
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Compare preços e encontre as melhores condições.</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    Nova Cotação
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4">ID / Data</th>
                            <th className="px-6 py-4 text-center">Itens Cotados</th>
                            <th className="px-6 py-4 text-center">Status</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">Carregando...</td></tr>
                        ) : quotations.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">Nenhuma cotação registrada.</td></tr>
                        ) : (
                            quotations.map((q: any) => (
                                <tr
                                    key={q.id}
                                    onClick={() => navigate(`/admin/quotations/${q.id}`)}
                                    className="hover:bg-gray-50 cursor-pointer transition-colors group"
                                >
                                    <td className="px-6 py-4">
                                        <p className="font-mono text-gray-900 font-medium">#{q.id.slice(0, 8)}</p>
                                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                            <Calendar size={12} />
                                            {new Date(q.created_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full font-bold text-gray-700">
                                            {q.items?.[0]?.count || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {getStatusBadge(q.status)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-primary font-medium text-xs hidden group-hover:inline-block mr-2">
                                                Abrir Detalhes
                                            </span>
                                            <ArrowRight size={18} className="text-gray-400 group-hover:text-primary" />
                                            <button
                                                onClick={(e) => handleDelete(q.id, e)}
                                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded ml-2"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
