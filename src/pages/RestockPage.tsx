
import React, { useEffect, useState } from 'react';
import {
    AlertTriangle,
    CheckCircle,
    Clock,
    Download,
    FileText,
    Filter,
    ShoppingCart,
    Search,
    Ban
} from 'lucide-react';
import { restockService, RestockItem } from '../services/restockService';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const RestockPage: React.FC = () => {
    const { user } = useAuth();
    const [items, setItems] = useState<RestockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'red' | 'yellow' | 'green'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [processing, setProcessing] = useState(false);

    // Load Data
    const loadData = async () => {
        setLoading(true);
        try {
            const data = await restockService.getRecommendations();
            setItems(data);
        } catch (err: any) {
            console.error(err);
            setError('Erro ao carregar recomendações de reposição. Verifique sua conexão.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Filtering
    const filteredItems = items.filter(item => {
        const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.sku && item.sku.includes(searchTerm));
        const matchesCategory = filter === 'all' ? true : item.priority === filter;
        return matchesSearch && matchesCategory;
    });

    // Permissions
    const canGenerateList = [Role.ADMIN, Role.CEO].includes(user?.role as Role);
    const canIgnore = [Role.ADMIN, Role.CEO].includes(user?.role as Role);
    const canExport = [Role.ADMIN, Role.CEO, Role.GERENTE].includes(user?.role as Role);

    // Actions
    const handleGenerateList = async () => {
        if (!canGenerateList) return;
        if (confirm('Deseja gerar a lista de compras e salvar no histórico?')) {
            setProcessing(true);
            try {
                await restockService.saveShoppingList(items); // Save ALL recommendations or filtered? Usually all.
                alert('Lista de compras gerada e salva com sucesso!');
            } catch (err) {
                alert('Erro ao salvar lista.');
            } finally {
                setProcessing(false);
            }
        }
    };

    const handleIgnore = async (id: string) => {
        if (!canIgnore) return;
        const reason = prompt('Motivo para ignorar este produto (opcional):');
        if (reason === null) return; // Cancelled

        setProcessing(true);
        try {
            await restockService.ignoreProduct(id, 7, reason || undefined);
            // Remove from local state
            setItems(prev => prev.filter(i => i.productId !== id));
            alert('Produto ignorado por 7 dias.');
        } catch (err) {
            alert('Erro ao ignorar produto.');
        } finally {
            setProcessing(false);
        }
    };

    const handleExportPDF = () => {
        if (!canExport) return;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Lista de Reposição Inteligente', 14, 22);
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleString()} por ${user?.name}`, 14, 30);

        const tableData = filteredItems.map(item => [
            item.productName,
            item.suggestedQuantity + ' ' + item.unit,
            item.currentStock,
            item.daysToEmpty.toFixed(1) + ' dias',
            item.reason
        ]);

        autoTable(doc, {
            head: [['Produto', 'Qtd Sugerida', 'Atual', 'Duração Est.', 'Motivo']],
            body: tableData,
            startY: 35,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [37, 99, 235] }
        });

        doc.save(`reposicao_inteligente_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Helper for Colors
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'red': return 'bg-red-100 text-red-800 border-red-200';
            case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'green': return 'bg-green-100 text-green-800 border-green-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ShoppingCart className="text-primary" />
                        Reposição Inteligente
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Análise preditiva de estoque baseada no consumo dos últimos 30 dias.
                    </p>
                </div>

                <div className="flex gap-2">
                    {canExport && (
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <Download size={18} />
                            Exportar PDF
                        </button>
                    )}
                    {canGenerateList && (
                        <button
                            onClick={handleGenerateList}
                            disabled={processing || items.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                        >
                            <FileText size={18} />
                            Gerar Lista de Compras
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-sm text-gray-500">Itens em Alerta</p>
                    <p className="text-2xl font-bold text-gray-900">{items.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm bg-red-50/30">
                    <p className="text-sm text-red-600 font-medium">Urgência Máxima</p>
                    <p className="text-2xl font-bold text-red-700">{items.filter(i => i.priority === 'red').length}</p>
                    <p className="text-xs text-red-500">Acaba em até 2 dias</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-yellow-100 shadow-sm bg-yellow-50/30">
                    <p className="text-sm text-yellow-600 font-medium">Recomendável</p>
                    <p className="text-2xl font-bold text-yellow-700">{items.filter(i => i.priority === 'yellow').length}</p>
                    <p className="text-xs text-yellow-500">Acaba em 3-7 dias</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm bg-green-50/30">
                    <p className="text-sm text-green-600 font-medium">Baixo Risco</p>
                    <p className="text-2xl font-bold text-green-700">{items.filter(i => i.priority === 'green').length}</p>
                    <p className="text-xs text-green-500">Acaba em +7 dias</p>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'all' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilter('red')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'red' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Urgentes
                    </button>
                    <button
                        onClick={() => setFilter('yellow')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filter === 'yellow' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Atenção
                    </button>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar produto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                    />
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-4">Prioridade</th>
                                <th className="px-6 py-4">Produto</th>
                                <th className="px-6 py-4 text-center">Vendas (30d)</th>
                                <th className="px-6 py-4 text-center">VMD</th>
                                <th className="px-6 py-4 text-center">Estoque Atual</th>
                                <th className="px-6 py-4 text-center">Previsão Ruptura</th>
                                <th className="px-6 py-4 text-center bg-blue-50/50 text-blue-700">Sugestão Compra</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                                        Nenhum produto encontrado com os filtros atuais.
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((item) => (
                                    <tr key={item.productId} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(item.priority)}`}>
                                                {item.priority === 'red' && <AlertTriangle size={12} />}
                                                {item.priority === 'yellow' && <Clock size={12} />}
                                                {item.priority === 'green' && <CheckCircle size={12} />}
                                                {item.priority === 'red' ? 'URGENTE' : item.priority === 'yellow' ? 'ATENÇÃO' : 'BAIXO RISCO'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900">{item.productName}</span>
                                                    {item.classification && (
                                                        <span className={`
                                                            w-5 h-5 flex items-center justify-center rounded text-[10px] font-bold
                                                            ${item.classification === 'A' ? 'bg-green-100 text-green-700' :
                                                                item.classification === 'B' ? 'bg-blue-100 text-blue-700' :
                                                                    'bg-orange-100 text-orange-700'}
                                                        `}>
                                                            {item.classification}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500">SKU: {item.sku || 'N/A'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-600 font-mono">
                                            {item.totalSold30d}
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-600 font-mono">
                                            {item.vmd.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-center font-mono font-medium text-gray-900">
                                            {item.currentStock}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`font-medium ${item.daysToEmpty <= 2 ? 'text-red-600' : 'text-gray-700'}`}>
                                                {item.daysToEmpty.toFixed(1)} dias
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center bg-blue-50/30">
                                            <div className="inline-block px-3 py-1 bg-white border border-blue-200 rounded-md font-bold text-blue-700 shadow-sm">
                                                {item.suggestedQuantity} <span className="text-xs font-normal text-gray-400">{item.unit}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {canIgnore && (
                                                <button
                                                    onClick={() => handleIgnore(item.productId)}
                                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                    title="Ignorar recomendação por 7 dias"
                                                >
                                                    <Ban size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
