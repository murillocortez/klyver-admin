import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Ban,
    CheckCircle,
    DollarSign,
    Edit,
    MapPin,
    Phone,
    Save,
    ShoppingBag,
    Star,
    X,
    Crown,
    Calendar,
    Mail,
    Tag,
    Clock,
    TrendingUp,
    Package,
    Gift,
    MessageCircle,
    Settings
} from 'lucide-react';
import { db } from '../services/dbService';
import { Customer, Order, OrderItem } from '../types';
import { CustomerEditModal } from '../components/pdv/CustomerEditModal';

const OrderDetailsModal = ({ order, onClose }: { order: Order; onClose: () => void }) => {
    if (!order) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                            <Package size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Detalhes do Pedido</h2>
                            <p className="text-sm text-gray-500 font-mono">#{order.id.substring(0, 8).toUpperCase()}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Status Bar */}
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Status Atual</p>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold 
                                ${order.status === 'Entregue' ? 'bg-green-100 text-green-700' :
                                    order.status === 'Cancelado' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                <div className={`w-2 h-2 rounded-full ${order.status === 'Entregue' ? 'bg-green-500' : order.status === 'Cancelado' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                {order.status}
                            </span>
                            {order.status === 'Cancelado' && order.cancellationReason && (
                                <p className="text-xs text-red-600 mt-1 font-medium">Motivo: {order.cancellationReason}</p>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Data do Pedido</p>
                            <p className="font-medium text-gray-900">{new Date(order.createdAt).toLocaleDateString()} às {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <MapPin size={16} className="text-gray-400" />
                                Entrega
                            </h3>
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                                <p className="text-sm text-gray-600 leading-relaxed">{order.address || 'Retirada na loja'}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <DollarSign size={16} className="text-gray-400" />
                                Pagamento
                            </h3>
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                                <p className="text-sm font-medium text-gray-900">{order.paymentMethod}</p>
                                <p className="text-xs text-gray-500 mt-1">Total: R$ {order.totalAmount.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <ShoppingBag size={16} className="text-gray-400" />
                            Itens do Pedido
                        </h3>
                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Produto</th>
                                        <th className="px-4 py-3 text-center">Qtd</th>
                                        <th className="px-4 py-3 text-right">Preço</th>
                                        <th className="px-4 py-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {order.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-gray-900">{item.productName}</p>
                                                <p className="text-xs text-gray-500">{item.category || 'Geral'}</p>
                                            </td>
                                            <td className="px-4 py-3 text-center font-medium">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right text-gray-600">R$ {item.priceAtPurchase.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900">
                                                R$ {(item.quantity * item.priceAtPurchase).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 font-bold text-gray-900">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-4 text-right text-gray-600">Total do Pedido</td>
                                        <td className="px-4 py-4 text-right text-lg">R$ {order.totalAmount.toFixed(2)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 font-bold transition-colors shadow-sm"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export const CustomerProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [internalNotes, setInternalNotes] = useState('');
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        if (id) fetchCustomerData(id);
    }, [id]);

    const fetchCustomerData = async (customerId: string) => {
        setLoading(true);
        const data = await db.getCustomerById(customerId);
        const orderData = await db.getOrdersByCustomer(customerId);

        if (data) {
            setCustomer(data);
            setInternalNotes(data.internalNotes || '');
            setOrders(orderData);
        }
        setLoading(false);
    };

    const handleSaveNotes = async () => {
        if (!customer) return;
        const updatedCustomer = { ...customer, internalNotes };
        await db.updateCustomer(updatedCustomer);
        setCustomer(updatedCustomer);
        setIsEditingNotes(false);
    };

    const toggleBlockStatus = async () => {
        if (!customer) return;
        const newStatus = customer.status === 'active' ? 'blocked' : 'active';
        if (confirm(`Tem certeza que deseja ${newStatus === 'blocked' ? 'bloquear' : 'desbloquear'} este cliente?`)) {
            const updatedCustomer = { ...customer, status: newStatus as any };
            await db.updateCustomer(updatedCustomer);
            setCustomer(updatedCustomer);
        }
    };

    const toggleVipStatus = async () => {
        if (!customer) return;
        let newTags = [...customer.tags];
        if (newTags.includes('VIP')) {
            newTags = newTags.filter(t => t !== 'VIP');
        } else {
            newTags.push('VIP');
        }
        const updatedCustomer = { ...customer, tags: newTags };
        await db.updateCustomer(updatedCustomer);
        setCustomer(updatedCustomer);
    };

    // Calculate Purchase Preferences
    const purchasePreferences = useMemo(() => {
        if (!orders.length) return [];
        const categories: Record<string, number> = {};
        let totalItems = 0;

        orders.forEach(order => {
            if (order.status !== 'Cancelado') {
                order.items.forEach(item => {
                    const cat = item.category || 'Outros';
                    categories[cat] = (categories[cat] || 0) + item.quantity;
                    totalItems += item.quantity;
                });
            }
        });

        return Object.entries(categories)
            .map(([name, count]) => ({ name, percentage: Math.round((count / totalItems) * 100) }))
            .sort((a, b) => b.percentage - a.percentage);
    }, [orders]);

    if (loading) return <div className="p-12 text-center text-gray-500 font-medium">Carregando perfil do cliente...</div>;
    if (!customer) return <div className="p-12 text-center text-red-500 font-bold">Cliente não encontrado.</div>;

    // Metrics Calculation
    const averageTicket = customer.orderCount > 0 ? customer.totalSpent / customer.orderCount : 0;
    const ltv = customer.totalSpent * 1.2; // 20% projection

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
            <button onClick={() => navigate('/customers')} className="flex items-center text-gray-500 hover:text-gray-800 transition-colors font-medium">
                <ArrowLeft size={18} className="mr-2" /> Voltar para lista
            </button>

            {/* Header Profile */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-bl-full opacity-50 -z-0" />

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg ring-4 ring-white
                            ${customer.tags.includes('VIP') ? 'bg-gradient-to-br from-yellow-100 to-orange-100 text-yellow-700' : 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700'}`}>
                            {customer.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{customer.name}</h1>
                                {customer.tags.includes('VIP') && (
                                    <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 border border-yellow-200">
                                        <Crown size={12} className="fill-yellow-600" /> VIP
                                    </span>
                                )}
                                {customer.status === 'blocked' && (
                                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full border border-red-200">
                                        Bloqueado
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                <a href={`https://wa.me/55${customer.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-green-600 transition-colors">
                                    <MessageCircle size={16} /> {customer.phone}
                                </a>
                                <span className="text-gray-300">|</span>
                                <span className="flex items-center gap-1.5">
                                    <Mail size={16} /> {customer.email || 'Sem email'}
                                </span>
                                <span className="text-gray-300">|</span>
                                <span className="flex items-center gap-1.5">
                                    <Calendar size={16} /> Desde {new Date(customer.joinedAt).toLocaleDateString()}
                                </span>
                            </div>

                            <div className="flex gap-2 mt-4">
                                {customer.tags.filter(t => t !== 'VIP').map(tag => (
                                    <span key={tag} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 border border-gray-200 flex items-center gap-1 group">
                                        <Tag size={12} /> {tag}
                                        <button
                                            onClick={async () => {
                                                if (confirm(`Remover a tag "${tag}"?`)) {
                                                    const newTags = customer.tags.filter(t => t !== tag);
                                                    const updatedCustomer = { ...customer, tags: newTags };
                                                    await db.updateCustomer(updatedCustomer);
                                                    setCustomer(updatedCustomer);
                                                }
                                            }}
                                            className="hover:text-red-500 hidden group-hover:block"
                                        >
                                            <X size={10} />
                                        </button>
                                    </span>
                                ))}
                                <button
                                    onClick={async () => {
                                        const tag = prompt('Digite o nome da nova tag:');
                                        if (tag && tag.trim()) {
                                            const newTags = [...customer.tags, tag.trim()];
                                            const updatedCustomer = { ...customer, tags: newTags };
                                            await db.updateCustomer(updatedCustomer);
                                            setCustomer(updatedCustomer);
                                        }
                                    }}
                                    className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                                >
                                    + Adicionar Tag
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={toggleVipStatus}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-bold transition-all shadow-sm active:scale-95
                                ${customer.tags.includes('VIP')
                                    ? 'bg-white border-yellow-200 text-yellow-700 hover:bg-yellow-50'
                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                        >
                            <Crown size={18} className={customer.tags.includes('VIP') ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'} />
                            <span>{customer.tags.includes('VIP') ? 'Remover VIP' : 'Promover a VIP'}</span>
                        </button>

                        <div className="relative group">
                            <button className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 transition-colors">
                                <Settings size={20} />
                            </button>
                            {/* Dropdown Menu */}
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-1 hidden group-hover:block z-20">
                                <button
                                    onClick={async () => {
                                        const action = customer.status === 'blocked' ? 'desbloquear' : 'bloquear';
                                        const confirmText = prompt(`Para confirmar, digite "${action}" abaixo:`);
                                        if (confirmText?.toLowerCase() === action) {
                                            await toggleBlockStatus();
                                        } else if (confirmText) {
                                            alert('Palavra de confirmação incorreta.');
                                        }
                                    }}
                                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2
                                        ${customer.status === 'blocked' ? 'text-green-600 hover:bg-green-50' : 'text-orange-600 hover:bg-orange-50'}`}
                                >
                                    {customer.status === 'blocked' ? <CheckCircle size={16} /> : <Ban size={16} />}
                                    {customer.status === 'blocked' ? 'Desbloquear Contato' : 'Bloquear Contato'}
                                </button>
                                <button
                                    onClick={async () => {
                                        const confirmText = prompt('ATENÇÃO: Isso apagará permanentemente o contato e seu histórico.\nPara confirmar, digite "excluir":');
                                        if (confirmText?.toLowerCase() === 'excluir') {
                                            try {
                                                await db.deleteCustomer(customer.id);
                                                alert('Contato excluído com sucesso.');
                                                navigate('/customers');
                                            } catch (error) {
                                                console.error('Erro ao excluir:', error);
                                                alert('Erro ao excluir contato. Verifique se existem pedidos vinculados.');
                                            }
                                        } else if (confirmText) {
                                            alert('Palavra de confirmação incorreta.');
                                        }
                                    }}
                                    className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 text-red-600 hover:bg-red-50"
                                >
                                    <X size={16} />
                                    Excluir Contato
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowEditModal(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 active:scale-95"
                    >
                        <Edit size={18} />
                        <span>Editar Perfil</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Info & Metrics */}
                <div className="space-y-8">

                    {/* Metrics Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><DollarSign size={12} /> Total Gasto</p>
                            <p className="text-xl font-bold text-gray-900">R$ {customer.totalSpent.toFixed(2)}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1"><ShoppingBag size={12} /> Pedidos</p>
                            <p className="text-xl font-bold text-gray-900">{customer.orderCount}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Ticket Médio</p>
                            <p className="text-xl font-bold text-gray-900">R$ {averageTicket.toFixed(2)}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 bg-gradient-to-br from-blue-50 to-white">
                            <p className="text-xs font-bold text-blue-600 uppercase mb-1">LTV Projetado</p>
                            <p className="text-xl font-bold text-blue-700">R$ {ltv.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <MapPin size={18} className="text-gray-400" />
                            Endereço Principal
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-gray-900 font-medium leading-relaxed">{customer.address || 'Endereço não cadastrado'}</p>
                            <div className="mt-3 flex gap-2">
                                <button className="text-xs font-bold text-blue-600 hover:underline">Ver no Mapa</button>
                                <span className="text-gray-300">|</span>
                                <button className="text-xs font-bold text-blue-600 hover:underline">Copiar</button>
                            </div>
                        </div>
                    </div>

                    {/* Internal Notes */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Notas Internas</h3>
                            {!isEditingNotes ? (
                                <button onClick={() => setIsEditingNotes(true)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                                    <Edit size={16} />
                                </button>
                            ) : (
                                <button onClick={handleSaveNotes} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                                    <Save size={16} />
                                </button>
                            )}
                        </div>
                        {isEditingNotes ? (
                            <textarea
                                className="w-full border border-gray-200 rounded-xl p-3 text-sm h-32 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                                value={internalNotes}
                                onChange={(e) => setInternalNotes(e.target.value)}
                                placeholder="Escreva observações importantes sobre o cliente..."
                                autoFocus
                            />
                        ) : (
                            <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100 text-sm text-gray-700 min-h-[100px] whitespace-pre-line">
                                {internalNotes || <span className="text-gray-400 italic">Nenhuma observação registrada.</span>}
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-3">
                        <button
                            onClick={() => {
                                const phone = customer.phone.replace(/\D/g, '');
                                const message = encodeURIComponent(`Olá ${customer.name}, aqui é da Farma Vida! Temos um cupom especial para você: *CLIENTE10* (10% OFF). Aproveite!`);
                                window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
                            }}
                            className="w-full py-3 rounded-xl border border-dashed border-gray-300 text-gray-500 font-bold hover:bg-gray-50 hover:text-gray-700 hover:border-gray-400 transition-all flex items-center justify-center gap-2"
                        >
                            <Gift size={18} />
                            Enviar Cupom de Desconto
                        </button>
                        <button
                            onClick={() => {
                                const phone = customer.phone.replace(/\D/g, '');
                                window.open(`https://wa.me/55${phone}`, '_blank');
                            }}
                            className="w-full py-3 rounded-xl border border-dashed border-gray-300 text-gray-500 font-bold hover:bg-gray-50 hover:text-gray-700 hover:border-gray-400 transition-all flex items-center justify-center gap-2"
                        >
                            <MessageCircle size={18} />
                            Iniciar Conversa no WhatsApp
                        </button>
                    </div>
                </div>

                {/* Right Column: Order History & Insights */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Purchase Preferences */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <TrendingUp size={20} className="text-gray-400" />
                            Preferências de Compra
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {purchasePreferences.length === 0 ? (
                                <span className="text-gray-500 text-sm italic">Sem dados de compra suficientes para análise.</span>
                            ) : (
                                purchasePreferences.map((pref, idx) => {
                                    const colors = [
                                        'bg-purple-50 text-purple-700 border-purple-100',
                                        'bg-pink-50 text-pink-700 border-pink-100',
                                        'bg-blue-50 text-blue-700 border-blue-100',
                                        'bg-green-50 text-green-700 border-green-100',
                                        'bg-orange-50 text-orange-700 border-orange-100'
                                    ];
                                    const colorClass = colors[idx % colors.length];

                                    return (
                                        <div key={pref.name} className={`px-4 py-2 rounded-xl text-sm font-bold border flex items-center gap-2 ${colorClass}`}>
                                            <span>{pref.name}</span>
                                            <span className="bg-white/50 px-1.5 py-0.5 rounded-md text-xs">{pref.percentage}%</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Order History */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Clock size={20} className="text-gray-400" />
                                Histórico de Pedidos
                            </h3>
                            <span className="text-sm font-medium text-gray-500">{orders.length} pedidos</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-gray-600">
                                <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase">
                                    <tr>
                                        <th className="px-6 py-4">ID</th>
                                        <th className="px-6 py-4">Data</th>
                                        <th className="px-6 py-4">Resumo</th>
                                        <th className="px-6 py-4">Total</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {orders.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-12 text-gray-400">Nenhum pedido encontrado.</td></tr>
                                    ) : (
                                        orders.map(order => (
                                            <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                                                <td className="px-6 py-4 font-mono font-medium text-gray-900">#{order.id.substring(0, 8).toUpperCase()}</td>
                                                <td className="px-6 py-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex -space-x-2 overflow-hidden">
                                                        {order.items.slice(0, 3).map((item, idx) => (
                                                            <div key={idx} className="inline-flex h-8 w-8 rounded-full bg-white border-2 border-gray-100 items-center justify-center text-[10px] font-bold text-gray-600 shadow-sm" title={item.productName}>
                                                                {item.productName[0]}
                                                            </div>
                                                        ))}
                                                        {order.items.length > 3 && (
                                                            <div className="inline-flex h-8 w-8 rounded-full bg-gray-100 border-2 border-white items-center justify-center text-[10px] font-bold text-gray-500 shadow-sm">
                                                                +{order.items.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-gray-900">R$ {order.totalAmount.toFixed(2)}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold 
                                                    ${order.status === 'Entregue' ? 'bg-green-50 text-green-700 border border-green-100' :
                                                            order.status === 'Cancelado' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => setSelectedOrder(order)}
                                                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors"
                                                        title="Ver Detalhes"
                                                    >
                                                        <ArrowLeft size={18} className="rotate-180" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Details Modal */}
            {
                selectedOrder && (
                    <OrderDetailsModal
                        order={selectedOrder}
                        onClose={() => setSelectedOrder(null)}
                    />
                )
            }

            {
                showEditModal && customer && (
                    <CustomerEditModal
                        customer={customer}
                        onClose={() => setShowEditModal(false)}
                        onSave={(updated) => {
                            setCustomer(updated);
                            setShowEditModal(false);
                        }}
                    />
                )
            }
        </div>
    );
};