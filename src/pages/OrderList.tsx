import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Eye,
  Filter,
  Archive,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  X,
  MapPin,
  Phone,
  User,
  Search,
  Printer,
  Send,
  MoreHorizontal,
  ChefHat,
  LayoutList,
  KanbanSquare,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Wallet,
  DollarSign,
  FileText,
  MessageSquare
} from 'lucide-react';
import { db } from '../services/dbService';
import { Order, OrderStatus } from '../types';
import { FiscalSection } from '../components/FiscalSection';
import { printOrder, getSelectedPrinter, getAutoPrint } from '../services/printerService';
import { Link } from 'react-router-dom';
import { WhatsappModal } from '../components/WhatsappModal';

export const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);

  const [searchParams] = useSearchParams();

  const [printerName, setPrinterName] = useState('');
  const prevOrdersRef = React.useRef<Order[]>([]);

  useEffect(() => {
    const config = getSelectedPrinter();
    setPrinterName(config.name);

    const fetchOrders = async () => {
      const data = await db.getOrders();

      // Auto-print logic
      if (getAutoPrint()) {
        const prevOrders = prevOrdersRef.current;
        const newOrders = data.filter(o =>
          !prevOrders.find(p => p.id === o.id) &&
          (o.status === OrderStatus.PENDING || o.status === OrderStatus.CONFIRMED)
        );

        newOrders.forEach(order => {
          console.log('Auto-printing order:', order.id);
          printOrder(order.id);
        });
      }

      setOrders(data);
      prevOrdersRef.current = data;

      const orderIdFromUrl = searchParams.get('orderId');
      if (orderIdFromUrl) {
        const orderToSelect = data.find(o => o.id === orderIdFromUrl);
        if (orderToSelect) {
          setSelectedOrder(orderToSelect);
        }
      }
    };

    fetchOrders();
    const interval = setInterval(fetchOrders, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [searchParams]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (newStatus === OrderStatus.CANCELLED) {
      const reason = prompt('Por favor, informe o motivo do cancelamento:');
      if (!reason) return;
      await db.updateOrderStatus(orderId, newStatus as OrderStatus, reason);
    } else {
      await db.updateOrderStatus(orderId, newStatus as OrderStatus);
    }
    const updated = await db.getOrders();
    setOrders(updated);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(updated.find(o => o.id === orderId) || null);
    }
  };

  const activeStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.SHIPPING];
  const archivedStatuses = [OrderStatus.DELIVERED, OrderStatus.CANCELLED];

  const filteredOrders = orders.filter(o => {
    // PDV orders are created as DELIVERED, so they should appear in history/archived
    const isArchived = archivedStatuses.includes(o.status);
    if (activeTab === 'active' && isArchived) return false;
    if (activeTab === 'archived' && !isArchived) return false;

    // Search Logic
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      o.customerName.toLowerCase().includes(searchLower) ||
      o.customerPhone.includes(searchLower) ||
      o.id.toLowerCase().includes(searchLower) ||
      (o.displayId && o.displayId.toString().includes(searchLower));

    if (!matchesSearch) return false;

    if (filterStatus === 'all') return true;
    return o.status === filterStatus;
  });

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return 'bg-amber-50 text-amber-700 border-amber-200';
      case OrderStatus.CONFIRMED: return 'bg-blue-50 text-blue-700 border-blue-200';
      case OrderStatus.PREPARING: return 'bg-purple-50 text-purple-700 border-purple-200';
      case OrderStatus.SHIPPING: return 'bg-orange-50 text-orange-700 border-orange-200';
      case OrderStatus.DELIVERED: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case OrderStatus.CANCELLED: return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return <Clock size={14} />;
      case OrderStatus.CONFIRMED: return <CheckCircle2 size={14} />;
      case OrderStatus.PREPARING: return <ChefHat size={14} />;
      case OrderStatus.SHIPPING: return <Truck size={14} />;
      case OrderStatus.DELIVERED: return <CheckCircle size={14} />;
      case OrderStatus.CANCELLED: return <XCircle size={14} />;
      default: return null;
    }
  };

  const getStatusCount = (status: OrderStatus) => {
    return orders.filter(o => o.status === status).length;
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Pedidos</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie e acompanhe todos os pedidos em tempo real.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, ID ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              title="Lista"
            >
              <LayoutList size={18} />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              title="Kanban"
            >
              <KanbanSquare size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        {/* Main Tabs */}
        <div className="flex gap-6 border-b border-gray-200 px-2">
          <button
            onClick={() => { setActiveTab('active'); setFilterStatus('all'); }}
            className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'active' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Pedidos Ativos
          </button>
          <button
            onClick={() => { setActiveTab('archived'); setFilterStatus('all'); }}
            className={`pb-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'archived' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Histórico
          </button>
        </div>

        {/* Status Pills */}
        <div className="flex overflow-x-auto space-x-3 pb-2 scrollbar-hide">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border
              ${filterStatus === 'all' ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            Todos
          </button>
          {(activeTab === 'active' ? activeStatuses : archivedStatuses).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2
                ${filterStatus === status
                  ? getStatusColor(status).replace('bg-', 'bg-opacity-100 bg-').replace('text-', 'text-white text-').replace('border-', 'border-transparent border-')
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}
                ${filterStatus === status ? 'shadow-md ring-2 ring-offset-1 ring-gray-100' : ''}
              `}
            >
              <span className={`flex items-center justify-center w-5 h-5 rounded-full bg-white/20 ${filterStatus === status ? 'text-inherit' : 'text-gray-400'}`}>
                {getStatusIcon(status)}
              </span>
              {status}
              <span className="ml-1 opacity-60 text-[10px] bg-black/5 px-1.5 py-0.5 rounded-full">
                {getStatusCount(status)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Pedido</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Cliente</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Itens</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Total</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50/80 transition-colors group cursor-pointer" onClick={() => setSelectedOrder(order)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-500 group-hover:bg-white group-hover:shadow-sm transition-all">
                          <span className="font-mono font-bold text-xs">
                            #{order.displayId ? order.displayId.toString().padStart(4, '0') : order.id.slice(0, 4).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</span>
                          <span className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                          {order.customerName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{order.customerName}</p>
                          <p className="text-xs text-gray-500">{order.customerPhone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="group/tooltip relative">
                        <span className="text-gray-600 font-medium border-b border-dashed border-gray-300 cursor-help">
                          {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                        </span>
                        <div className="absolute left-0 bottom-full mb-2 w-48 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                          <ul className="space-y-1">
                            {order.items.map((item, i) => (
                              <li key={i} className="flex justify-between">
                                <span className="truncate max-w-[120px]">{item.productName}</span>
                                <span className="text-gray-400">x{item.quantity}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-gray-900">R$ {order.totalAmount.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Ver Detalhes"
                        >
                          <Eye size={18} />
                        </button>
                        {order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED && (
                          <button
                            onClick={() => handleStatusChange(order.id, OrderStatus.DELIVERED)}
                            className="p-2 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                            title="Marcar como Entregue"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredOrders.length === 0 && (
              <div className="flex flex-col items-center justify-center p-16 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Search size={24} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Nenhum pedido encontrado</h3>
                <p className="text-gray-500 mt-1">Tente ajustar os filtros ou buscar por outro termo.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Kanban View */
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px]">
          {(activeTab === 'active' ? activeStatuses : archivedStatuses).map(status => (
            <div key={status} className="min-w-[300px] bg-gray-50 rounded-2xl p-4 flex flex-col h-full border border-gray-200/60">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm">
                  {getStatusIcon(status)}
                  {status}
                </h3>
                <span className="bg-white px-2 py-0.5 rounded-md text-xs font-bold text-gray-400 shadow-sm border border-gray-100">
                  {filteredOrders.filter(o => o.status === status).length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
                {filteredOrders.filter(o => o.status === status).map(order => (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs font-mono font-bold text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                        #{order.displayId || order.id.slice(0, 4)}
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="font-bold text-gray-900 text-sm">{order.customerName}</p>
                      <p className="text-xs text-gray-500 truncate">{order.items.length} itens • R$ {order.totalAmount.toFixed(2)}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <div className="flex -space-x-2">
                        {/* Placeholder for item avatars if available */}
                        <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-gray-500">
                          {order.items.length > 0 ? order.items[0].productName.charAt(0) : '-'}
                        </div>
                        {order.items.length > 1 && (
                          <div className="w-6 h-6 rounded-full bg-gray-50 border-2 border-white flex items-center justify-center text-[8px] font-bold text-gray-400">
                            +{order.items.length - 1}
                          </div>
                        )}
                      </div>
                      <button className="text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Ver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modern Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="bg-white border-b border-gray-100 p-6 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusIcon(selectedOrder.status)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    Pedido #{selectedOrder.displayId ? selectedOrder.displayId.toString().padStart(4, '0') : selectedOrder.id.slice(0, 8).toUpperCase()}
                    <span className="text-sm font-normal text-gray-400">
                      • {new Date(selectedOrder.createdAt).toLocaleDateString()}
                    </span>
                  </h3>
                  <p className="text-sm text-gray-500">
                    Status atual: <span className="font-bold text-gray-900">{selectedOrder.status}</span>
                  </p>
                  {selectedOrder.status === OrderStatus.CANCELLED && selectedOrder.cancellationReason && (
                    <p className="text-sm text-red-600 mt-1">
                      Motivo: <span className="font-medium">{selectedOrder.cancellationReason}</span>
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printOrder(selectedOrder.id)}
                  className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors"
                  title="Imprimir"
                >
                  <Printer size={20} />
                </button>
                <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50">

              {/* Timeline */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
                <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Clock size={18} className="text-primary" />
                  Linha do Tempo
                </h4>
                <div className="relative flex items-center justify-between px-4">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 -z-10" />
                  {[OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.SHIPPING, OrderStatus.DELIVERED].map((step) => {
                    const isCompleted = Object.values(OrderStatus).indexOf(selectedOrder.status) >= Object.values(OrderStatus).indexOf(step);
                    const isCurrent = selectedOrder.status === step;
                    return (
                      <div key={step} className="flex flex-col items-center gap-2 bg-white px-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                          ${isCompleted || isCurrent ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-300'}
                        `}>
                          {getStatusIcon(step)}
                        </div>
                        <span className={`text-[10px] font-bold uppercase ${isCurrent ? 'text-primary' : 'text-gray-400'}`}>
                          {step.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3 mb-8">
                {Object.values(OrderStatus).map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(selectedOrder.id, status)}
                    disabled={selectedOrder.status === status}
                    className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2
                      ${selectedOrder.status === status
                        ? 'bg-gray-900 text-white border-gray-900 opacity-50 cursor-not-allowed'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary shadow-sm hover:shadow-md'}`}
                  >
                    {getStatusIcon(status)}
                    {status}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Items & Notes */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Items Table */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/30">
                      <h4 className="font-bold text-gray-900">Itens do Pedido</h4>
                    </div>
                    <table className="w-full text-sm text-left">
                      <thead className="text-gray-400 font-medium text-xs uppercase bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-3">Produto</th>
                          <th className="px-6 py-3 text-center">Qtd</th>
                          <th className="px-6 py-3 text-right">Preço Unit.</th>
                          <th className="px-6 py-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {selectedOrder.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                {item.productName.charAt(0)}
                              </div>
                              {item.productName}
                            </td>
                            <td className="px-6 py-4 text-center text-gray-600">{item.quantity}</td>
                            <td className="px-6 py-4 text-right text-gray-600">R$ {item.priceAtPurchase.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right font-bold text-gray-900">
                              R$ {(item.priceAtPurchase * item.quantity).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Notes Section */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MessageSquare size={18} className="text-gray-400" />
                      Observações
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                        <p className="text-xs font-bold text-yellow-700 uppercase mb-2">Nota do Cliente</p>
                        <p className="text-sm text-gray-700 italic">"Por favor, entregar na portaria."</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Nota Interna</p>
                        <textarea
                          placeholder="Adicionar nota para a equipe..."
                          className="w-full bg-transparent border-none p-0 text-sm focus:ring-0 resize-none"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Customer & Payment */}
                <div className="space-y-6">
                  {/* Customer Card */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <User size={18} className="text-primary" />
                      Cliente
                    </h4>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">
                        {selectedOrder.customerName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{selectedOrder.customerName}</p>
                        <a href={`https://wa.me/55${selectedOrder.customerPhone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-sm text-green-600 hover:underline flex items-center gap-1">
                          <Phone size={12} /> {selectedOrder.customerPhone}
                        </a>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <MapPin size={18} className="text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase">Endereço de Entrega</p>
                          <p className="text-sm text-gray-700">{selectedOrder.address || 'Retirada na Loja'}</p>
                          {selectedOrder.address && (
                            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrder.address)}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                              Ver no mapa
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Truck size={18} className="text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase">Tipo de Entrega</p>
                          <p className="text-sm text-gray-700">{selectedOrder.address ? 'Delivery' : 'Retirada'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Wallet size={18} className="text-green-600" />
                      Pagamento
                    </h4>

                    <div className="bg-gray-50 p-3 rounded-xl mb-4 flex items-center gap-3">
                      {selectedOrder.paymentMethod === 'pix' ? <DollarSign size={20} className="text-green-600" /> : <CreditCard size={20} className="text-blue-600" />}
                      <div>
                        <p className="text-sm font-bold text-gray-900 capitalize">{selectedOrder.paymentMethod}</p>
                        <p className="text-xs text-gray-500">
                          {selectedOrder.paymentMethod === 'pix' ? 'Pagamento Aprovado' : 'Pagamento na Entrega'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm border-t border-gray-100 pt-4">
                      <div className="flex justify-between text-gray-500">
                        <span>Subtotal</span>
                        <span>R$ {selectedOrder.totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Taxa de Entrega</span>
                        <span>R$ 0,00</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Descontos</span>
                        <span className="text-green-600">- R$ 0,00</span>
                      </div>
                      <div className="pt-3 mt-3 border-t border-gray-100 flex justify-between items-center">
                        <span className="font-bold text-gray-900">Total Final</span>
                        <span className="text-xl font-bold text-primary">R$ {selectedOrder.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Printer Section */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Printer size={18} className="text-gray-400" />
                      Impressão do Pedido
                    </h4>

                    <div className="bg-gray-50 p-3 rounded-xl mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Impressora Selecionada</p>
                        <p className="text-sm font-bold text-gray-900">{printerName}</p>
                      </div>
                      <Link to="/settings?tab=printers" className="text-xs text-blue-600 hover:underline font-medium">
                        Trocar
                      </Link>
                    </div>

                    <button
                      onClick={() => printOrder(selectedOrder.id)}
                      className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-gray-900/20"
                    >
                      <Printer size={18} />
                      Imprimir Agora
                    </button>
                  </div>

                  {/* Fiscal / NFe Section */}
                  <FiscalSection order={selectedOrder} />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-white border-t border-gray-100 p-4 flex justify-end gap-3 shrink-0">
              <button onClick={() => setSelectedOrder(null)} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors">
                Fechar
              </button>
              <button
                onClick={() => setWhatsappModalOpen(true)}
                className="px-6 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg shadow-green-600/25 transition-colors flex items-center gap-2"
              >
                <Send size={18} />
                Enviar no WhatsApp
              </button>

              <WhatsappModal
                isOpen={whatsappModalOpen}
                onClose={() => setWhatsappModalOpen(false)}
                order={selectedOrder}
              />
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
