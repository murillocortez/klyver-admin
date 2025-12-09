import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart
} from 'recharts';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Calendar,
  ChevronDown,
  DollarSign,
  Download,
  FileText,
  Package,
  ShoppingBag,
  Users,
  Lightbulb,
  CreditCard,
  Wallet,
  Banknote,
  TrendingUp,
  TrendingDown,
  Activity,
  Filter,
  Printer
} from 'lucide-react';
import { db } from '../services/dbService';
import { AnalyticsSummary } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  slate: '#64748b',
  chart: ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#6366f1']
};

const StatCard = ({ title, value, trend, trendValue, icon: Icon, color, subtext }: any) => {
  const isPositive = trendValue >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const trendColor = isPositive ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50';

  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colorStyles[color as keyof typeof colorStyles]} group-hover:scale-110 transition-transform duration-300`}>
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
        <h3 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">{value}</h3>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {subtext && (
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            {subtext}
          </p>
        )}
      </div>
      <div className="mt-4 h-1 w-full bg-gray-50 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${Math.min(Math.abs(trendValue) * 5, 100)}%` }} />
      </div>
    </div>
  );
};

const InsightCard = ({ type, message }: { type: 'success' | 'warning' | 'info', message: string }) => {
  const styles = {
    success: 'bg-emerald-50 border-emerald-100 text-emerald-800',
    warning: 'bg-amber-50 border-amber-100 text-amber-800',
    info: 'bg-blue-50 border-blue-100 text-blue-800'
  };

  const icons = {
    success: TrendingUp,
    warning: AlertTriangle,
    info: Lightbulb
  };

  const Icon = icons[type];

  return (
    <div className={`p-4 rounded-xl border flex items-start gap-3 ${styles[type]}`}>
      <div className="p-1.5 bg-white/60 rounded-lg backdrop-blur-sm">
        <Icon size={16} strokeWidth={2.5} />
      </div>
      <p className="text-sm font-medium leading-relaxed">{message}</p>
    </div>
  );
};

export const Reports: React.FC = () => {
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [chartMetric, setChartMetric] = useState<'revenue' | 'margin' | 'cost'>('revenue');

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    const result = await db.getAnalyticsData(period);
    setData(result);
    setLoading(false);
  };

  const exportToExcel = () => {
    if (!data) return;
    const wb = XLSX.utils.book_new();

    const salesData = data.salesByDate.map(item => ({
      Data: item.date,
      Receita: item.revenue,
      Pedidos: item.orders,
      Custo_Estimado: item.cost || 0
    }));
    const wsSales = XLSX.utils.json_to_sheet(salesData);
    XLSX.utils.book_append_sheet(wb, wsSales, "Vendas");

    XLSX.writeFile(wb, `Relatorio_PharmaDash_${new Date().toISOString().split('T')[0]}.xlsx`);
    setShowExportMenu(false);
  };

  const exportToPDF = () => {
    if (!data) return;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text(`Relatório Analítico (${period} dias)`, 14, 22);

    autoTable(doc, {
      startY: 40,
      head: [['Métrica', 'Valor']],
      body: [
        ['Receita Total', `R$ ${data.totalRevenue.toFixed(2)}`],
        ['Total Pedidos', data.totalOrders.toString()],
        ['Ticket Médio', `R$ ${data.averageTicket.toFixed(2)}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`Relatorio_PharmaDash_${new Date().toISOString().split('T')[0]}.pdf`);
    setShowExportMenu(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium">Gerando inteligência de dados...</p>
      </div>
    </div>
  );

  if (!data) return <div className="p-8 text-center text-gray-500">Sem dados disponíveis.</div>;

  // Generate Insights
  const topCategory = [...data.salesByCategory].sort((a, b) => b.value - a.value)[0];
  const topPayment = [...data.salesByPayment].sort((a, b) => b.value - a.value)[0];
  const growth = ((data.totalRevenue - (data.totalRevenue * 0.9)) / (data.totalRevenue * 0.9)) * 100; // Mock growth

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12 animate-in fade-in duration-500">

      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="text-blue-600" />
            Relatórios & BI
          </h1>
          <p className="text-gray-500 text-sm mt-1">Análise detalhada de performance e inteligência de negócios.</p>
        </div>

        <div className="flex flex-wrap gap-3 items-center w-full xl:w-auto">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {[7, 30, 90, 365].map(d => (
              <button
                key={d}
                onClick={() => setPeriod(d)}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${period === d
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {d === 365 ? '1 Ano' : `${d} dias`}
              </button>
            ))}
          </div>

          <div className="h-8 w-px bg-gray-200 hidden xl:block" />

          <div className="relative flex-1 xl:flex-none">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="w-full xl:w-auto flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20 active:scale-95"
            >
              <Download size={18} />
              <span>Exportar</span>
              <ChevronDown size={14} />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-2 space-y-1">
                  <button onClick={exportToExcel} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    Excel (.xlsx)
                  </button>
                  <button onClick={exportToPDF} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    PDF Report
                  </button>
                  <button onClick={() => window.print()} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    Imprimir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Receita Total"
          value={`R$ ${data.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend={true}
          trendValue={12.5}
          icon={DollarSign}
          color="blue"
          subtext="Margem bruta de 32%"
        />
        <StatCard
          title="Total de Pedidos"
          value={data.totalOrders}
          trend={true}
          trendValue={8.2}
          icon={ShoppingBag}
          color="purple"
          subtext={`${(data.totalOrders / period).toFixed(1)} pedidos/dia`}
        />
        <StatCard
          title="Ticket Médio"
          value={`R$ ${data.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          trend={true}
          trendValue={-2.4}
          icon={CreditCard}
          color="green"
          subtext="Por pedido confirmado"
        />
        <StatCard
          title="Produtos em Risco"
          value={data.expiringProducts.length}
          trend={false}
          trendValue={0}
          icon={AlertTriangle}
          color="rose"
          subtext="Vencendo em 90 dias"
        />
      </div>

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Evolução Financeira</h3>
              <p className="text-sm text-gray-500 mt-1">Acompanhe receita, custos e margem ao longo do tempo.</p>
            </div>
            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
              {[
                { id: 'revenue', label: 'Receita' },
                { id: 'margin', label: 'Margem' },
                { id: 'cost', label: 'Custo' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setChartMetric(m.id as any)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${chartMetric === m.id
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-100'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.salesByDate} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} tickFormatter={(val) => `R$${(val || 0) / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(val: number) => [`R$ ${(val || 0).toFixed(2)}`, chartMetric === 'revenue' ? 'Receita' : chartMetric === 'margin' ? 'Margem' : 'Custo']}
                />
                {chartMetric === 'revenue' && (
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                )}
                {chartMetric === 'margin' && (
                  <Area
                    type="monotone"
                    dataKey="margin"
                    stroke="#10b981"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorMargin)"
                  />
                )}
                {chartMetric === 'cost' && (
                  <Area
                    type="monotone"
                    dataKey="cost"
                    stroke="#64748b"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#colorCost)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insights & Payment Methods */}
        <div className="space-y-6">
          {/* AI Insights */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-3xl shadow-lg text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
              <Lightbulb size={120} />
            </div>
            <div className="relative z-10">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                <Lightbulb size={20} className="text-yellow-300" />
                Insights Inteligentes
              </h3>
              <div className="space-y-3">
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                  <p className="text-sm font-medium leading-relaxed">
                    A categoria <span className="font-bold text-yellow-300">{topCategory?.name}</span> representa {((topCategory?.value / data.totalRevenue) * 100).toFixed(0)}% da sua receita total.
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                  <p className="text-sm font-medium leading-relaxed">
                    <span className="font-bold text-green-300">{topPayment?.name}</span> é o método de pagamento preferido ({((topPayment?.value / data.totalRevenue) * 100).toFixed(0)}%).
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                  <p className="text-sm font-medium leading-relaxed">
                    Seu ticket médio cresceu <span className="font-bold text-emerald-300">12%</span> em relação ao mês anterior.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods Chart */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[350px]">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Formas de Pagamento</h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.salesByPayment}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.salesByPayment.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => `R$ ${val.toFixed(2)}`} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Categories & Top Products */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Vendas por Categoria</h3>
            <button className="text-sm font-bold text-blue-600 hover:text-blue-700">Ver detalhes</button>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.salesByCategory} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fontSize: 12, fontWeight: 500 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(val: number) => `R$ ${val.toFixed(2)}`} />
                <Bar dataKey="value" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={24}>
                  {data.salesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.chart[index % COLORS.chart.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Top Produtos</h3>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                <Filter size={18} />
              </button>
            </div>
          </div>
          <div className="overflow-auto max-h-[300px] pr-2 custom-scrollbar">
            <table className="w-full text-sm text-left">
              <thead className="text-gray-400 font-bold uppercase text-xs border-b border-gray-100 sticky top-0 bg-white">
                <tr>
                  <th className="pb-3 pl-2">Produto</th>
                  <th className="pb-3 text-right">Qtd</th>
                  <th className="pb-3 text-right pr-2">Receita</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                    <td className="py-3 pl-2 font-medium text-gray-800 flex items-center gap-3">
                      <span className="w-6 h-6 rounded bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      {p.name}
                    </td>
                    <td className="py-3 text-right text-gray-600 font-medium">{p.quantity}</td>
                    <td className="py-3 text-right text-gray-900 font-bold pr-2">R$ {p.revenue.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};