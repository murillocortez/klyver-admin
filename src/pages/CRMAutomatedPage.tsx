import React, { useEffect, useState } from 'react';
import {
    RefreshCw, Gift, Crown, BarChart2, Play, Settings,
    MessageCircle, ToggleLeft, ToggleRight, Save, Clock
} from 'lucide-react';
import { crmService, CRMSettings } from '../services/crmService';

export const CRMAutomatedPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>({});
    const [campaigns, setCampaigns] = useState<CRMSettings[]>([]);
    const [running, setRunning] = useState(false);
    const [lastRun, setLastRun] = useState<string | null>(null);

    // Edit Mode
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<CRMSettings>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [s, c] = await Promise.all([
                crmService.getStats('30d'),
                crmService.getSettings()
            ]);
            setStats(s);
            setCampaigns(c);

            // Find most recent run
            const dates = c.map(i => i.last_run_at).filter(Boolean).sort().reverse();
            if (dates.length) setLastRun(dates[0]);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleRunNow = async () => {
        setRunning(true);
        try {
            const res = await crmService.runAll();
            console.log(res);
            alert('Rodou com sucesso! Verifique os logs.');
            loadData();
        } catch (error) {
            console.error(error);
            alert('Erro ao executar automação.');
        } finally {
            setRunning(false);
        }
    };

    const handleToggle = async (c: CRMSettings) => {
        try {
            await crmService.updateSettings(c.id, { active: !c.active });
            loadData(); // refresh
        } catch (e) {
            alert('Erro ao atualizar status');
        }
    };

    const startEdit = (c: CRMSettings) => {
        setEditingId(c.id);
        setEditForm({
            message_template: c.message_template,
            discount_percent: c.discount_percent
        });
    };

    const saveEdit = async () => {
        if (!editingId) return;
        try {
            await crmService.updateSettings(editingId, editForm);
            setEditingId(null);
            loadData();
        } catch (e) {
            alert('Erro ao salvar');
        }
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <BarChart2 className="text-primary" />
                        CRM Automático
                    </h1>
                    <p className="text-gray-500">Automação de fidelização e reativação de clientes</p>
                </div>
                <div className="flex items-center gap-4">
                    {lastRun && <p className="text-xs text-gray-500">Última execução: {new Date(lastRun).toLocaleString()}</p>}
                    <button
                        onClick={handleRunNow}
                        disabled={running}
                        className={`
                            px-4 py-2 rounded-lg font-medium text-white flex items-center gap-2 transition-all shadow-md
                            ${running ? 'bg-gray-400 cursor-wait' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}
                        `}
                    >
                        <Play size={18} className={running ? 'animate-spin' : ''} />
                        {running ? 'Executando...' : 'Executar Agora'}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card
                    icon={<RefreshCw className="text-orange-500" />}
                    title="Clientes Reativados"
                    value={stats.reactivated}
                    sub="Últimos 30 dias"
                    color="orange"
                />
                <Card
                    icon={<Gift className="text-pink-500" />}
                    title="Aniversariantes"
                    value={stats.birthday}
                    sub="Alcançados este mês"
                    color="pink"
                />
                <Card
                    icon={<Crown className="text-purple-500" />}
                    title="Novos VIPs"
                    value={stats.vip}
                    sub="Formados este mês"
                    color="purple"
                />
                <Card
                    icon={<MessageCircle className="text-green-500" />}
                    title="Cupons Usados"
                    value={stats.couponsUsed}
                    sub="Gerados por campanhas"
                    color="green"
                />
            </div>

            {/* Campaigns Configuration */}
            <div className="space-y-6">
                <h2 className="text-lg font-bold text-gray-900">Configuração de Campanhas</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {campaigns.map(c => (
                        <div key={c.id} className={`bg-white rounded-xl shadow-sm border p-6 flex flex-col justify-between ${!c.active ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                            <div className="mb-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className={`p-2 rounded-lg ${getIcon(c.slug).bg} text-white`}>
                                        {getIcon(c.slug).icon}
                                    </div>
                                    <button onClick={() => handleToggle(c)} className="text-primary hover:scale-110 transition-transform">
                                        {c.active ? <ToggleRight size={32} className="text-green-500" /> : <ToggleLeft size={32} className="text-gray-300" />}
                                    </button>
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg">{c.name}</h3>
                                {/* <p className="text-sm text-gray-500 mt-1">{getDescription(c.slug)}</p> */}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mensagem (Whatsapp)</label>
                                    {editingId === c.id ? (
                                        <textarea
                                            className="w-full mt-1 p-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-primary/20 outline-none"
                                            rows={3}
                                            value={editForm.message_template || ''}
                                            onChange={e => setEditForm({ ...editForm, message_template: e.target.value })}
                                        />
                                    ) : (
                                        <p className="mt-1 text-sm bg-gray-50 p-2 rounded-lg text-gray-700 italic border border-gray-100">
                                            "{c.message_template}"
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Desconto</label>
                                    {editingId === c.id ? (
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                className="w-16 p-1 border rounded text-right text-sm"
                                                value={editForm.discount_percent || 0}
                                                onChange={e => setEditForm({ ...editForm, discount_percent: parseFloat(e.target.value) })}
                                            />
                                            <span className="text-sm font-bold">%</span>
                                        </div>
                                    ) : (
                                        <span className="text-sm font-bold bg-green-100 text-green-700 px-2 py-1 rounded-md">{c.discount_percent}% OFF</span>
                                    )}
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex justify-end">
                                    {editingId === c.id ? (
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded">Cancelar</button>
                                            <button onClick={saveEdit} className="px-3 py-1.5 text-xs bg-primary text-white rounded flex items-center gap-1">
                                                <Save size={12} /> Salvar
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => startEdit(c)} className="text-xs font-medium text-gray-500 hover:text-primary flex items-center gap-1">
                                            <Settings size={14} /> Editar Configuração
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const Card = ({ icon, title, value, sub, color }: any) => (
    <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 border-${color}-500 flex items-center gap-4`}>
        <div className={`p-3 bg-${color}-50 rounded-full`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400">{sub}</p>
        </div>
    </div>
);

const getIcon = (slug: string) => {
    switch (slug) {
        case 'reactivation': return { icon: <RefreshCw size={24} />, bg: 'bg-orange-500' };
        case 'birthday': return { icon: <Gift size={24} />, bg: 'bg-pink-500' };
        case 'vip': return { icon: <Crown size={24} />, bg: 'bg-purple-500' };
        default: return { icon: <Settings size={24} />, bg: 'bg-gray-500' };
    }
};
