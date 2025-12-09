import React, { useState, useEffect } from 'react';
import {
    BarChart3, RefreshCw, Download, FileSpreadsheet,
    TrendingUp, TrendingDown, Minus, AlertCircle, Info, ChevronRight, X
} from 'lucide-react';
import { abcCurveService, AbcCurveData } from '../services/abcCurveService';
import { useRole } from '../hooks/useRole';
import { Role } from '../types';

export const AbcCurvePage: React.FC = () => {
    const [data, setData] = useState<AbcCurveData[]>([]);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);
    const [filter, setFilter] = useState<'ALL' | 'A' | 'B' | 'C'>('ALL');
    const [selectedProduct, setSelectedProduct] = useState<AbcCurveData | null>(null);

    const { role } = useRole();
    const canManage = role === Role.CEO || role === Role.ADMIN;
    const canExport = role === Role.CEO || role === Role.ADMIN || role === Role.GERENTE;

    useEffect(() => {
        loadData();
    }, [filter]);

    const loadData = async () => {
        setLoading(true);
        try {
            // If filter is ALL, fetch all, otherwise specific class
            const fetched = await abcCurveService.getAbcData(filter === 'ALL' ? undefined : filter);
            setData(fetched);
        } catch (error) {
            console.error(error);
            alert('Erro ao carregar dados da Curva ABC');
        } finally {
            setLoading(false);
        }
    };

    const handleCalculate = async () => {
        if (!confirm('Deseja recalcular a Curva ABC? Isso pode levar alguns segundos.')) return;

        setCalculating(true);
        try {
            await abcCurveService.calculateAbcCurve();
            await loadData();
            alert('Cálculo realizado com sucesso!');
        } catch (error) {
            console.error(error);
            alert('Erro ao calcular. Verifique se há vendas nos últimos 90 dias.');
        } finally {
            setCalculating(false);
        }
    };

    const handleExport = () => {
        // Simple CSV Export
        const headers = ['Produto', 'SKU', 'Classificação', 'Participação (%)', 'Vendas (R$)', 'Vendas (Qtd)', 'Giro', 'Estoque Médio'];
        const csvContent = [
            headers.join(','),
            ...data.map(item => [
                `"${item.product?.name}"`,
                item.product?.sku || '',
                item.classification,
                item.participation_percentage.toFixed(2).replace('.', ','),
                item.total_sold_amount.toFixed(2).replace('.', ','),
                item.total_sold_quantity,
                item.turnover_rate.toFixed(2).replace('.', ','),
                item.average_stock
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'curva_abc_estoque.csv');
        document.body.appendChild(link);
        link.click();
    };

    const getRecommendation = (classification: string, turnover: number) => {
        if (classification === 'A') return { text: 'Manter Estoque Alto', color: 'text-green-600', bg: 'bg-green-50' };
        if (classification === 'B') return { text: 'Monitorar Oscilações', color: 'text-blue-600', bg: 'bg-blue-50' };
        if (classification === 'C') {
            if (turnover > 0.5) return { text: 'Reduzir Compra', color: 'text-yellow-600', bg: 'bg-yellow-50' };
            return { text: 'Liquidar / Não Recomprar', color: 'text-red-600', bg: 'bg-red-50' };
        }
        return { text: '-', color: 'text-gray-500', bg: 'bg-gray-50' };
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <BarChart3 className="text-blue-600" />
                        Curva ABC de Estoque
                    </h1>
                    <p className="text-gray-500 mt-1">Análise estratégica de relevância de produtos baseada em faturamento e giro.</p>
                </div>
                <div className="flex gap-3">
                    {canManage && (
                        <button
                            onClick={handleCalculate}
                            disabled={calculating}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={18} className={calculating ? 'animate-spin' : ''} />
                            {calculating ? 'Calculando...' : 'Recalcular Agora'}
                        </button>
                    )}
                    {canExport && (
                        <button
                            onClick={handleExport}
                            disabled={data.length === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors shadow-sm disabled:opacity-50"
                        >
                            <FileSpreadsheet size={18} />
                            Exportar Excel
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-6 bg-white p-1 rounded-xl border border-gray-200 w-fit">
                {['ALL', 'A', 'B', 'C'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f as any)}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${filter === f
                                ? 'bg-gray-900 text-white shadow-md'
                                : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        {f === 'ALL' ? 'Todos' : `Classe ${f}`}
                    </button>
                ))}
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase">Classificação</th>
                                <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase">Produto</th>
                                <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase text-right">Participação</th>
                                <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase text-right">Vendas (UN)</th>
                                <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase text-right">Vendas (R$)</th>
                                <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase text-right">Giro de Estoque</th>
                                <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase text-center">Recomendação</th>
                                <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-gray-400">
                                        Carregando dados...
                                    </td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-gray-400">
                                        Nenhum dado encontrado. Clique em "Recalcular Agora" se for a primeira vez.
                                    </td>
                                </tr>
                            ) : (
                                data.map((item) => {
                                    const rec = getRecommendation(item.classification, item.turnover_rate);
                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className={`
                                                    inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm
                                                    ${item.classification === 'A' ? 'bg-green-100 text-green-700' :
                                                        item.classification === 'B' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-orange-100 text-orange-700'}
                                                `}>
                                                    {item.classification}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-bold text-gray-900">{item.product?.name}</p>
                                                    <p className="text-xs text-gray-400">SKU: {item.product?.sku}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-sm">
                                                {item.participation_percentage.toFixed(2)}%
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-sm text-gray-600">
                                                {item.total_sold_quantity}
                                            </td>
                                            <td className="px-6 py-4 text-right font-mono text-sm font-medium text-gray-900">
                                                R$ {item.total_sold_amount.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className={`font-bold text-sm ${item.turnover_rate > 1 ? 'text-green-600' : 'text-gray-500'}`}>
                                                        {item.turnover_rate.toFixed(2)}x
                                                    </span>
                                                    {item.turnover_rate > 2 && <TrendingUp size={14} className="text-green-500" />}
                                                    {item.turnover_rate < 0.5 && <TrendingDown size={14} className="text-red-400" />}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${rec.bg} ${rec.color}`}>
                                                    {rec.text}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => setSelectedProduct(item)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <ChevronRight size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Product Details Modal */}
            {selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <div className="flex items-center gap-3">
                                    <span className={`
                                        inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm
                                        ${selectedProduct.classification === 'A' ? 'bg-green-100 text-green-700' :
                                            selectedProduct.classification === 'B' ? 'bg-blue-100 text-blue-700' :
                                                'bg-orange-100 text-orange-700'}
                                    `}>
                                        {selectedProduct.classification}
                                    </span>
                                    <h3 className="text-xl font-bold text-gray-900">{selectedProduct.product?.name}</h3>
                                </div>
                                <p className="text-sm text-gray-500 mt-1 ml-11">Detalhes de desempenho (90 dias)</p>
                            </div>
                            <button onClick={() => setSelectedProduct(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Faturamento Total</p>
                                    <p className="text-2xl font-bold text-gray-900">R$ {selectedProduct.total_sold_amount.toFixed(2)}</p>
                                    <div className="mt-2 text-xs font-medium text-gray-500 flex items-center gap-1">
                                        <Info size={12} /> Representa {selectedProduct.participation_percentage.toFixed(2)}% do faturamento da loja.
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">Giro de Estoque</p>
                                    <p className="text-2xl font-bold text-gray-900">{selectedProduct.turnover_rate.toFixed(2)}x</p>
                                    <div className="mt-2 text-xs font-medium text-gray-500 flex items-center gap-1">
                                        <Info size={12} /> {selectedProduct.total_sold_quantity} unidades vendidas / {selectedProduct.average_stock} estoque médio.
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <AlertCircle size={18} className="text-blue-600" />
                                    Análise & Sugestão
                                </h4>
                                <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 text-sm text-blue-800 leading-relaxed">
                                    {selectedProduct.classification === 'A' && (
                                        <p>
                                            Este é um produto de <strong>Alta Curva (A)</strong>. Ele é responsável por uma grande fatia do seu faturamento.
                                            <br /><br />
                                            <strong>Ação Recomendada:</strong>
                                            <ul className="list-disc ml-5 mt-2 space-y-1">
                                                <li>Garanta estoque de segurança elevado.</li>
                                                <li>Não deixe faltar em hipótese alguma.</li>
                                                <li>Negocie melhores condições com fornecedores devido ao volume.</li>
                                                <li>Dê destaque na loja virtual e vitrine.</li>
                                            </ul>
                                        </p>
                                    )}
                                    {selectedProduct.classification === 'B' && (
                                        <p>
                                            Este é um produto de <strong>Média Curva (B)</strong>. Ele tem importância moderada.
                                            <br /><br />
                                            <strong>Ação Recomendada:</strong>
                                            <ul className="list-disc ml-5 mt-2 space-y-1">
                                                <li>Monitore o giro quinzenalmente.</li>
                                                <li>Mantenha estoque regular, mas evite excessos.</li>
                                            </ul>
                                        </p>
                                    )}
                                    {selectedProduct.classification === 'C' && (
                                        <p>
                                            Este é um produto de <strong>Baixa Curva (C)</strong>. Contribui pouco para o faturamento total.
                                            <br /><br />
                                            <strong>Ação Recomendada:</strong>
                                            <ul className="list-disc ml-5 mt-2 space-y-1">
                                                <li>Avalie se vale a pena manter no mix.</li>
                                                <li>Compre apenas sob demanda ou em quantidades mínimas.</li>
                                                <li>Se o giro for muito baixo ({'<'} 0.5), considere uma promoção para liquidar.</li>
                                            </ul>
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="text-xs text-gray-400 text-center pt-4 border-t border-gray-100">
                                Calculado em: {new Date(selectedProduct.last_calculated).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
