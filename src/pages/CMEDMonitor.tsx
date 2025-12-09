import React, { useState, useEffect } from 'react';
import { Upload, AlertTriangle, CheckCircle, RefreshCw, FileText, Search } from 'lucide-react';
import { supabase } from '../services/supabase';
import { importCMEDData } from '../services/cmedService';

export function CMEDMonitor() {
    const [stats, setStats] = useState({
        totalItems: 0,
        lastUpdate: null as string | null,
        productsAbovePMC: 0,
        cacheSize: 0
    });
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ success: boolean; count: number; error?: string } | null>(null);
    const [auditList, setAuditList] = useState<any[]>([]);
    const [latestQueries, setLatestQueries] = useState<any[]>([]);

    useEffect(() => {
        fetchStats();
        fetchAuditList();
        fetchLatestQueries();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            // Get total count from local DB
            const { count: localCount } = await supabase.from('cmed_prices' as any).select('*', { count: 'exact', head: true });

            // Get last update from local DB
            const { data: lastItem } = await supabase.from('cmed_prices' as any).select('last_update').order('last_update', { ascending: false }).limit(1).single();

            // Get cache size
            const { count: cacheCount } = await supabase.from('cmed_cache' as any).select('*', { count: 'exact', head: true });

            setStats(prev => ({
                ...prev,
                totalItems: localCount || 0,
                lastUpdate: lastItem ? (lastItem as any).last_update : null,
                cacheSize: cacheCount || 0
            }));
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAuditList = async () => {
        const { data } = await supabase.from('cmed_prices' as any).select('*').limit(10);
        setAuditList(data || []);
    };

    const fetchLatestQueries = async () => {
        const { data } = await supabase.from('cmed_cache' as any).select('*').order('created_at', { ascending: false }).limit(10);
        setLatestQueries(data || []);
    };

    const handleClearCache = async () => {
        if (!confirm('Tem certeza que deseja limpar todo o cache da CMED?')) return;
        try {
            const { error } = await supabase.from('cmed_cache' as any).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
            if (error) throw error;
            alert('Cache limpo com sucesso!');
            fetchStats();
            fetchLatestQueries();
        } catch (error) {
            console.error('Error clearing cache:', error);
            alert('Erro ao limpar cache.');
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImporting(true);
        setImportResult(null);

        try {
            const result = await importCMEDData(file);
            setImportResult(result);
            if (result.success) {
                fetchStats();
                fetchAuditList();
            }
        } catch (error) {
            console.error('Upload error:', error);
            setImportResult({ success: false, count: 0, error: 'Erro ao processar arquivo.' });
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Monitoramento CMED</h1>
                    <p className="text-gray-500">Gestão da base oficial de preços de medicamentos (Anvisa)</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleClearCache} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold transition-colors flex items-center gap-2">
                        <AlertTriangle size={18} />
                        Limpar Cache
                    </button>
                    <button onClick={() => { fetchStats(); fetchLatestQueries(); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <FileText size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Base Offline</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.totalItems.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <Search size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Cache (Consultas)</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.cacheSize.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Status API</p>
                            <h3 className="text-lg font-bold text-green-600">Online</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-gray-50 text-gray-600 rounded-xl">
                            <RefreshCw size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Última Atualização</p>
                            <h3 className="text-sm font-bold text-gray-900">
                                {stats.lastUpdate ? new Date(stats.lastUpdate).toLocaleDateString() : 'Nunca'}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Latest Queries (Cache) */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900">Últimas Consultas (Cache)</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left font-bold text-gray-500">Termo</th>
                                    <th className="px-6 py-3 text-left font-bold text-gray-500">Data</th>
                                    <th className="px-6 py-3 text-right font-bold text-gray-500">Resultados</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {latestQueries.length === 0 ? (
                                    <tr><td colSpan={3} className="px-6 py-4 text-center text-gray-500">Nenhuma consulta recente.</td></tr>
                                ) : (
                                    latestQueries.map((q) => (
                                        <tr key={q.id}>
                                            <td className="px-6 py-3 font-medium text-gray-900">{q.query}</td>
                                            <td className="px-6 py-3 text-gray-500">{new Date(q.created_at).toLocaleString()}</td>
                                            <td className="px-6 py-3 text-right font-bold text-blue-600">
                                                {Array.isArray(q.response_json) ? q.response_json.length : 1}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Import Section */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-fit">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Atualizar Base Offline</h2>
                    <p className="text-gray-500 mb-6 text-sm">
                        Faça o upload do arquivo CSV oficial da CMED para atualizar a base de dados local (fallback).
                        <a href="https://www.gov.br/anvisa/pt-br/assuntos/medicamentos/cmed/precos" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline ml-1">
                            Baixar lista oficial
                        </a>
                    </p>

                    <div className="flex flex-col gap-4">
                        <label className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-dashed border-gray-300 rounded-xl font-bold text-gray-600 hover:border-blue-500 hover:text-blue-600 cursor-pointer transition-all bg-gray-50 hover:bg-blue-50">
                            <Upload size={24} />
                            {importing ? 'Processando...' : 'Carregar Arquivo (CSV/Excel)'}
                            <input type="file" accept=".csv, .xls, .xlsx" className="hidden" onChange={handleFileUpload} disabled={importing} />
                        </label>

                        {importResult && (
                            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${importResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {importResult.success ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                                <span className="font-medium text-sm">
                                    {importResult.success
                                        ? `Sucesso! ${importResult.count} registros importados.`
                                        : `Erro: ${importResult.error}`}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
