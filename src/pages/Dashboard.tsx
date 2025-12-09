import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Package,
  ShoppingBag,
  Users,
  Gift,
  MessageCircle,
  Calendar,
  ArrowRight,
  MoreHorizontal,
  Filter,
  Download,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  ChefHat,
  Store
} from 'lucide-react';
import { db } from '../services/dbService';
import { Order, Product, SalesDataPoint, Customer } from '../types';

// --- Components ---

const StatCard = ({ title, value, subtext, icon: Icon, color, trend, trendValue }: any) => {
  const isPositive = trendValue >= 0;

  const colorStyles = {
    green: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    pink: 'bg-pink-50 text-pink-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  const trendColor = isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50';
  const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3.5 rounded-xl ${colorStyles[color as keyof typeof colorStyles]} group-hover:scale-110 transition-transform duration-300`}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${trendColor}`}>
            <TrendIcon size={14} />
            {Math.abs(trendValue)}%
          </div>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">{value}</h3>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {subtext && (
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white p-4 rounded-xl shadow-xl border border-gray-800">
        <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
        <p className="text-lg font-bold">
          R$ {payload[0].value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    'Entregue': 'bg-emerald-50 text-emerald-700 border-emerald-100',
    'Pendente': 'bg-amber-50 text-amber-700 border-amber-100',
    'Cancelado': 'bg-rose-50 text-rose-700 border-rose-100',
    'Em Preparação': 'bg-blue-50 text-blue-700 border-blue-100',
    'A Caminho': 'bg-purple-50 text-purple-700 border-purple-100',
    'Confirmado': 'bg-indigo-50 text-indigo-700 border-indigo-100'
  };

  const icons = {
    'Entregue': CheckCircle2,
    'Pendente': Clock,
    'Cancelado': XCircle,
    'Em Preparação': ChefHat,
    'A Caminho': Truck,
    'Confirmado': CheckCircle2
  };

  const StatusIcon = icons[status as keyof typeof icons] || Clock;
  const style = styles[status as keyof typeof styles] || 'bg-gray-50 text-gray-700 border-gray-100';

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${style}`}>
      <StatusIcon size={12} strokeWidth={2.5} />
      {status}
    </span>
  );
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [birthdays, setBirthdays] = useState<Customer[]>([]);
  const [stats, setStats] = useState({
    todayOrders: 0,
    weekRevenue: 0,
    newCustomers: 0,
    pdvSales: 0
  });
  const [chartPeriod, setChartPeriod] = useState('7d');

  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setActiveActionId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      const sales = await db.getSalesData(7);
      const orders = await db.getOrders();
      const products = await db.getProducts();
      const todaysBirthdays = await db.getBirthdaysToday();

      setSalesData(sales);
      setRecentOrders(orders.slice(0, 5));
      setLowStockProducts(products.filter(p => p.stockTotal <= p.minStockThreshold));
      setBirthdays(todaysBirthdays);

      // Calculate Stats
      const todayStr = new Date().toISOString().split('T')[0];
      const todayOrders = orders.filter(o => o.createdAt.startsWith(todayStr)).length;
      const pdvSales = orders.filter(o => o.createdAt.startsWith(todayStr) && o.origin === 'presencial').length;
      const weekRevenue = sales.reduce((acc, curr) => acc + curr.revenue, 0);

      setStats({
        todayOrders,
        weekRevenue,
        newCustomers: 12, // Mocked for demo
        pdvSales
      });
    };
    loadData();
  }, []);

  const handleWhatsApp = (customer: Customer) => {
    const phone = customer.phone.replace(/\D/g, '');
    const message = `Olá ${customer.name}, parabéns pelo seu dia! 🎉 A Farma Vida deseja muitas felicidades e saúde. Venha nos visitar e confira as ofertas especiais que preparamos para você!`;
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Visão Geral</h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            Acompanhe o desempenho da sua farmácia em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm text-sm font-medium text-gray-600">
            <Calendar size={16} className="mr-2 text-gray-400" />
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <button className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20 flex items-center gap-2 active:scale-95">
            <Download size={16} />
            Exportar
          </button>
        </div>
      </div>

      {/* KPI Cards - Horizontal Scroll on Mobile */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4 md:overflow-visible md:pb-0 md:px-0">
        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 min-w-[800px] md:min-w-0">
          <div className="flex-1">
            <StatCard
              title="Receita Total"
              value={`R$ ${stats.weekRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              subtext="vs. últimos 7 dias"
              icon={DollarSign}
              color="green"
              trend={true}
              trendValue={12.5}
            />
          </div>
          <div className="flex-1">
            <StatCard
              title="Pedidos Hoje"
              value={stats.todayOrders}
              subtext="Pedidos processados"
              icon={ShoppingBag}
              color="blue"
              trend={true}
              trendValue={8.2}
            />
          </div>
          <div className="flex-1">
            <StatCard
              title="Novos Clientes"
              value={stats.newCustomers}
              subtext="Últimos 30 dias"
              icon={Users}
              color="purple"
              trend={true}
              trendValue={-2.4}
            />
          </div>
          <div className="flex-1">
            <StatCard
              title="Vendas PDV"
              value={stats.pdvSales}
              subtext="Vendas presenciais hoje"
              icon={Store}
              color="orange"
              trend={true}
              trendValue={5.0}
            />
          </div>
          <div className="flex-1">
            <StatCard
              title="Aniversariantes"
              value={birthdays.length}
              subtext="Para contatar hoje"
              icon={Gift}
              color="pink"
              trend={false}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Receita & Vendas</h3>
              <p className="text-sm text-gray-500 mt-1">Desempenho financeiro comparativo</p>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-xl">
              {['7d', '30d', '90d'].map((period) => (
                <button
                  key={period}
                  onClick={() => setChartPeriod(period)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${chartPeriod === period
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {period === '7d' ? '7 dias' : period === '30d' ? '30 dias' : '90 dias'}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                  tickFormatter={(value) => `R$${value / 1000}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3b82f6', strokeWidth: 2 }} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  activeDot={{ r: 8, strokeWidth: 4, stroke: '#fff', fill: '#3b82f6' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Alerts & Birthdays */}
        <div className="space-y-6">
          {/* Low Stock Alert List */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                  <AlertTriangle size={18} />
                </div>
                Estoque Crítico
              </h3>
              <span className="text-xs font-bold bg-rose-100 text-rose-600 px-2.5 py-1 rounded-full">
                {lowStockProducts.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
              {lowStockProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle2 size={32} className="text-emerald-500 opacity-50" />
                  </div>
                  <p className="font-medium text-gray-900">Tudo certo!</p>
                  <p className="text-xs mt-1">Nenhum produto com estoque baixo.</p>
                </div>
              ) : (
                lowStockProducts.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-rose-200 hover:shadow-md transition-all group">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-rose-600 font-bold mt-1 flex items-center gap-1">
                        <AlertTriangle size={10} />
                        Restam apenas {p.stockTotal}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/products?edit=${p.id}`)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold bg-gray-900 text-white px-3 py-1.5 rounded-lg shadow-lg hover:bg-gray-800"
                    >
                      Repor
                    </button>
                  </div>
                ))
              )}
            </div>
            <button onClick={() => navigate('/products')} className="w-full mt-4 py-3 text-sm text-gray-500 hover:text-primary font-bold border-t border-gray-100 flex items-center justify-center gap-2 transition-colors group">
              Ver inventário completo
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Birthdays List */}
          <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
              <Gift size={120} />
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Gift size={20} />
                  Aniversariantes
                </h3>
                <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
                  Hoje
                </span>
              </div>

              <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar-light">
                {birthdays.length === 0 ? (
                  <div className="py-6 text-center text-white/80 text-sm bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                    <p>Nenhum aniversariante hoje.</p>
                  </div>
                ) : (
                  birthdays.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-white/10 rounded-xl border border-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white text-pink-600 flex items-center justify-center font-bold shadow-sm">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{c.name}</p>
                          <p className="text-xs text-white/80">{c.phone}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleWhatsApp(c)}
                        className="p-2 bg-green-500 hover:bg-green-400 text-white rounded-lg shadow-sm transition-colors"
                        title="Enviar Parabéns"
                      >
                        <MessageCircle size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/30">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Pedidos Recentes</h3>
            <p className="text-sm text-gray-500 mt-1">Últimas transações realizadas</p>
          </div>
          <div className="flex gap-3">
            <div className="relative hidden sm:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar pedido..."
                className="pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none w-64"
              />
            </div>
            <button className="p-2 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50">
              <Filter size={20} />
            </button>
            <button onClick={() => navigate('/orders')} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm">
              Ver todos
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Pedido</th>
                <th className="px-8 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Cliente</th>
                <th className="px-8 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                <th className="px-8 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Total</th>
                <th className="px-8 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg text-gray-500">
                        <ShoppingBag size={18} />
                      </div>
                      <div>
                        <span className="block font-bold text-gray-900">#{order.id.slice(0, 8)}</span>
                        <span className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-xs font-bold text-blue-700">
                        {order.customerName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{order.customerName}</div>
                        <div className="text-xs text-gray-500">{order.customerPhone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-8 py-5 font-bold text-gray-900">
                    R$ {order.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-8 py-5 text-right relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveActionId(activeActionId === order.id ? null : order.id);
                      }}
                      className={`p-2 rounded-lg transition-all ${activeActionId === order.id ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                    >
                      <MoreHorizontal size={20} />
                    </button>
                    {activeActionId === order.id && (
                      <div className="absolute right-8 top-10 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/orders?orderId=${order.id}`);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-medium"
                        >
                          <ShoppingBag size={16} className="text-blue-600" /> Ver Detalhes
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div >
  );
};
