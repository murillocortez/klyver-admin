import React, { useEffect, useState } from 'react';
import {
  Download,
  Filter,
  Search,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  Eye,
  Settings,
  X,
  Save,
  TrendingUp,
  TrendingDown,
  Crown,
  MoreHorizontal,
  ChevronRight,
  Sparkles,
  Gift,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../services/dbService';
import { Customer, VipSettings } from '../types';

const VipSettingsModal = ({ onClose }: { onClose: () => void }) => {
  const [settings, setSettings] = useState<VipSettings>({
    enabled: true,
    discountPercentage: 5,
    inactivityDays: 30,
    minOrderCountMonthly: 5,
    minSpentMonthly: 500
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await db.getSettings();
    if (s.vip) {
      setSettings(s.vip);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    const currentSettings = await db.getSettings();
    await db.updateSettings({
      ...currentSettings,
      vip: settings
    });
    alert('Configurações VIP salvas com sucesso!');
    onClose();
  };

  if (loading) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full animate-in zoom-in-95 duration-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-white">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
              <Crown size={20} />
            </div>
            Configurar Regras VIP
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between p-5 bg-purple-50 rounded-2xl border border-purple-100">
            <div>
              <p className="font-bold text-gray-900 text-lg">Programa VIP Ativo</p>
              <p className="text-sm text-gray-600 mt-1">Habilita descontos e tags automáticas para seus melhores clientes.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              />
              <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600 transition-colors"></div>
            </label>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Desconto Automático (%)</label>
              <div className="grid grid-cols-4 gap-3">
                {[5, 10, 15, 20].map((percent) => (
                  <button
                    key={percent}
                    onClick={() => setSettings({ ...settings, discountPercentage: percent })}
                    className={`py-3 rounded-xl border font-bold transition-all ${settings.discountPercentage === percent
                        ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                      }`}
                  >
                    {percent}%
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <Info size={12} />
                Aplicado automaticamente no checkout para clientes com a tag VIP.
              </p>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-gray-400" />
                Critérios para se tornar VIP (Mensal)
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Gasto Mínimo</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                    <input
                      type="number"
                      value={settings.minSpentMonthly}
                      onChange={(e) => setSettings({ ...settings, minSpentMonthly: Number(e.target.value) })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none font-bold text-gray-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pedidos Mínimos</label>
                  <input
                    type="number"
                    value={settings.minOrderCountMonthly}
                    onChange={(e) => setSettings({ ...settings, minOrderCountMonthly: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none font-bold text-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-bold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-bold shadow-lg shadow-purple-200 transition-all active:scale-95 flex items-center gap-2"
          >
            <Save size={18} />
            Salvar Regras
          </button>
        </div>
      </div>
    </div>
  );
};

export const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'blocked'>('all');
  const [filterType, setFilterType] = useState<'all' | 'vip' | 'recurring' | 'new'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [minSpent, setMinSpent] = useState<string>('');
  const [maxSpent, setMaxSpent] = useState<string>('');
  const [showVipSettings, setShowVipSettings] = useState(false);
  const [sortBy, setSortBy] = useState<'spent_desc' | 'spent_asc' | 'orders_desc' | 'recent'>('spent_desc');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    const data = await db.getCustomers();
    setCustomers(data);
    setLoading(false);
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Nome", "Telefone", "Email", "Total Gasto", "Pedidos", "Último Pedido", "Status", "Tags"];
    const rows = filteredCustomers.map(c => [
      c.id,
      c.name,
      c.phone,
      c.email || '',
      c.totalSpent.toFixed(2),
      c.orderCount,
      c.lastOrderDate,
      c.status,
      c.tags.join(';')
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "clientes_pharma.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isNewCustomer = (dateString: string) => {
    const date = new Date(dateString);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return date >= thirtyDaysAgo;
  };

  const filteredCustomers = customers
    .filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = filterStatus === 'all' || c.status === filterStatus;

      let matchesType = true;
      if (filterType === 'vip') matchesType = c.tags.includes('VIP');
      if (filterType === 'recurring') matchesType = c.isRecurring;
      if (filterType === 'new') matchesType = isNewCustomer(c.joinedAt);

      let matchesSpent = true;
      if (minSpent && c.totalSpent < parseFloat(minSpent)) matchesSpent = false;
      if (maxSpent && c.totalSpent > parseFloat(maxSpent)) matchesSpent = false;

      return matchesSearch && matchesStatus && matchesType && matchesSpent;
    })
    .sort((a, b) => {
      if (sortBy === 'spent_desc') return b.totalSpent - a.totalSpent;
      if (sortBy === 'spent_asc') return a.totalSpent - b.totalSpent;
      if (sortBy === 'orders_desc') return b.orderCount - a.orderCount;
      if (sortBy === 'recent') return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
      return 0;
    });

  // KPI Calculations
  const kpiTotal = customers.length;
  const kpiNew = customers.filter(c => isNewCustomer(c.joinedAt)).length;
  const kpiVip = customers.filter(c => c.tags.includes('VIP')).length;
  const kpiRecurring = customers.filter(c => c.isRecurring).length;

  // Calculate Average Ticket
  const totalRevenue = customers.reduce((acc, c) => acc + c.totalSpent, 0);
  const totalOrders = customers.reduce((acc, c) => acc + c.orderCount, 0);
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Clientes</h1>
          <p className="text-gray-500 mt-1">Gerencie seu relacionamento com clientes e histórico de compras.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowVipSettings(true)}
            className="flex items-center gap-2 bg-white text-purple-700 border border-purple-200 px-5 py-2.5 rounded-xl hover:bg-purple-50 transition-all font-bold shadow-sm"
          >
            <Crown size={18} />
            <span>Regras VIP</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-all font-bold shadow-sm"
          >
            <Download size={18} />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* AI Insights Block */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Sparkles size={120} className="text-indigo-600" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">
              <Sparkles size={20} />
            </div>
            <h3 className="font-bold text-indigo-900">Insights Inteligentes</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/50">
              <p className="text-sm text-indigo-800 mb-1">Cliente mais valioso</p>
              <p className="font-bold text-gray-900">
                {customers.sort((a, b) => b.totalSpent - a.totalSpent)[0]?.name || 'N/A'}
              </p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/50">
              <p className="text-sm text-indigo-800 mb-1">Recorrência</p>
              <p className="font-bold text-gray-900">
                {Math.round((kpiRecurring / (kpiTotal || 1)) * 100)}% das vendas
              </p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/50">
              <p className="text-sm text-indigo-800 mb-1">Ticket Médio Global</p>
              <p className="font-bold text-gray-900">R$ {avgTicket.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-blue-200 transition-colors">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Clientes</p>
            <p className="text-3xl font-bold text-gray-900">{kpiTotal}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform"><Users size={24} /></div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-green-200 transition-colors">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Novos (30d)</p>
            <p className="text-3xl font-bold text-green-600">+{kpiNew}</p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:scale-110 transition-transform"><UserPlus size={24} /></div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-purple-200 transition-colors">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Clientes VIP</p>
            <p className="text-3xl font-bold text-purple-600">{kpiVip}</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform"><Crown size={24} /></div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-orange-200 transition-colors">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Recorrentes</p>
            <p className="text-3xl font-bold text-orange-600">{kpiRecurring}</p>
          </div>
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:scale-110 transition-transform"><UserCheck size={24} /></div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col xl:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome, telefone, email ou CPF..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="h-8 w-px bg-gray-200 mx-2 hidden xl:block" />

          <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0 scrollbar-hide">
            {['all', 'vip', 'recurring', 'new'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${filterType === type
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
              >
                {type === 'all' ? 'Todos' : type === 'vip' ? 'VIP' : type === 'recurring' ? 'Recorrentes' : 'Novos'}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-gray-200 mx-2 hidden xl:block" />

          <select
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white cursor-pointer hover:border-gray-300 transition-colors"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="spent_desc">Maior Gasto</option>
            <option value="spent_asc">Menor Gasto</option>
            <option value="orders_desc">Mais Pedidos</option>
            <option value="recent">Mais Recentes</option>
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 border rounded-xl transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-gray-200 text-gray-400 hover:bg-gray-50'}`}
          >
            <Filter size={20} />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1">Gasto Mínimo (R$)</label>
            <input
              type="number"
              value={minSpent}
              onChange={(e) => setMinSpent(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1">Gasto Máximo (R$)</label>
            <input
              type="number"
              value={maxSpent}
              onChange={(e) => setMaxSpent(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
              placeholder="Ex: 1000.00"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Cliente</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Contato</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-center">Pedidos</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Total Gasto</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Última Compra</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Carregando base de clientes...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Search size={24} className="text-gray-300" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">Nenhum cliente encontrado</h3>
                      <p className="text-gray-500 mt-1">Tente ajustar os filtros ou buscar por outro termo.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm
                          ${customer.tags.includes('VIP') ? 'bg-gradient-to-br from-yellow-100 to-orange-100 text-yellow-700 ring-2 ring-white shadow-yellow-100' : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600'}`}>
                          {customer.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{customer.name}</p>
                          <div className="flex gap-1 mt-1">
                            {customer.tags.includes('VIP') && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 border border-yellow-200 flex items-center gap-1">
                                <Crown size={10} /> VIP
                              </span>
                            )}
                            {isNewCustomer(customer.joinedAt) && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-700 border border-green-200">
                                NOVO
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{customer.phone}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[150px]">{customer.email || '—'}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-700 font-bold text-xs">
                        {customer.orderCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">R$ {customer.totalSpent.toFixed(2)}</p>
                      <p className="text-xs text-gray-400">Ticket: R$ {(customer.totalSpent / (customer.orderCount || 1)).toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium text-sm">
                      {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${customer.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${customer.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                        {customer.status === 'active' ? 'Ativo' : 'Bloqueado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/customers/${customer.id}`}
                        className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Ver Detalhes <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Placeholder */}
        <div className="bg-white border-t border-gray-100 p-4 flex items-center justify-between text-sm text-gray-500">
          <span>Mostrando {filteredCustomers.length} clientes</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50" disabled>Anterior</button>
            <button className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50" disabled>Próxima</button>
          </div>
        </div>
      </div>

      {showVipSettings && <VipSettingsModal onClose={() => setShowVipSettings(false)} />}
    </div>
  );
};