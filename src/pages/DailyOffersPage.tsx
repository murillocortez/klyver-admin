import React, { useState, useEffect } from 'react';
import {
    Plus,
    Trash2,
    Edit,
    Save,
    X,
    Image as ImageIcon,
    Search,
    Filter,
    Calendar,
    Tag,
    Clock,
    Eye,
    MousePointer,
    TrendingUp,
    ShoppingBag,
    MoreHorizontal,
    Copy,
    ExternalLink,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { db } from '../services/dbService';
import { DailyOffer, Product } from '../types';

export const DailyOffersPage: React.FC = () => {
    const [offers, setOffers] = useState<DailyOffer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOffer, setEditingOffer] = useState<DailyOffer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'scheduled' | 'expired'>('all');
    const [sortBy, setSortBy] = useState<'discount_desc' | 'discount_asc' | 'recent' | 'expiring'>('recent');

    const [formData, setFormData] = useState<Partial<DailyOffer>>({
        title: '',
        subtitle: '',
        imageUrl: '',
        productId: '',
        active: true
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [offersData, productsData] = await Promise.all([
                db.getDailyOffers(),
                db.getProducts()
            ]);
            setOffers(offersData);
            setProducts(productsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (offer: DailyOffer) => {
        setEditingOffer(offer);
        setFormData(offer);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta oferta?')) {
            try {
                await db.deleteDailyOffer(id);
                loadData();
            } catch (error) {
                console.error('Error deleting offer:', error);
            }
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const offerToSave = {
                ...formData,
                id: editingOffer?.id || ''
            } as DailyOffer;

            await db.saveDailyOffer(offerToSave);
            setIsModalOpen(false);
            setEditingOffer(null);
            setFormData({ title: '', subtitle: '', imageUrl: '', productId: '', active: true });
            loadData();
        } catch (error: any) {
            console.error('Error saving offer:', error);
            alert(`Erro ao salvar oferta: ${error.message || 'Erro desconhecido'}`);
        }
    };

    const getProductDetails = (productId?: string) => {
        return products.find(p => p.id === productId);
    };

    const calculateDiscount = (product?: Product) => {
        if (!product || !product.promotionalPrice || !product.price) return null;
        const discount = ((product.price - product.promotionalPrice) / product.price) * 100;
        return Math.round(discount);
    };

    const filteredOffers = offers.filter(offer => {
        const matchesSearch = offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            offer.subtitle?.toLowerCase().includes(searchTerm.toLowerCase());

        // Mock logic for status filtering (since we don't have real dates in DB yet)
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && offer.active) ||
            (filterStatus === 'expired' && !offer.active); // Simplified

        return matchesSearch && matchesStatus;
    }).sort((a, b) => {
        // Mock sorting logic
        return 0;
    });

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Ofertas & Promoções</h1>
                    <p className="text-gray-500 mt-1">Crie ofertas atrativas para aumentar suas vendas e destacar produtos.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingOffer(null);
                        setFormData({ title: '', subtitle: '', imageUrl: '', productId: '', active: true });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-600/20 active:scale-95"
                >
                    <Plus size={20} />
                    Criar Nova Oferta
                </button>
            </div>

            {/* Featured Banner (Optional/Mock) */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">DICA DO DIA</span>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Aumente suas vendas com ofertas relâmpago!</h2>
                        <p className="text-blue-100 max-w-lg">Produtos com desconto acima de 20% têm 3x mais chances de conversão. Crie uma oferta agora.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 text-center min-w-[100px]">
                            <p className="text-2xl font-bold">1.2k</p>
                            <p className="text-xs text-blue-100">Cliques Hoje</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 text-center min-w-[100px]">
                            <p className="text-2xl font-bold">R$ 4.5k</p>
                            <p className="text-xs text-blue-100">Vendas (Ofertas)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Actions */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col xl:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por produto ou oferta..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                    <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0 scrollbar-hide">
                        {['all', 'active', 'scheduled', 'expired'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status as any)}
                                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border ${filterStatus === status
                                    ? 'bg-gray-900 text-white border-gray-900'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                {status === 'all' ? 'Todas' :
                                    status === 'active' ? 'Ativas' :
                                        status === 'scheduled' ? 'Agendadas' : 'Expiradas'}
                            </button>
                        ))}
                    </div>

                    <div className="h-8 w-px bg-gray-200 mx-2 hidden xl:block" />

                    <select
                        className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white cursor-pointer hover:border-gray-300 transition-colors"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                    >
                        <option value="recent">Mais Recentes</option>
                        <option value="discount_desc">Maior Desconto</option>
                        <option value="discount_asc">Menor Desconto</option>
                        <option value="expiring">Próximas de Expirar</option>
                    </select>
                </div>
            </div>

            {/* Offers Grid */}
            {loading ? (
                <div className="text-center py-20 text-gray-500">Carregando ofertas...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredOffers.map(offer => {
                        const product = getProductDetails(offer.productId);
                        const discount = calculateDiscount(product);
                        const views = offer.views || 0;
                        const clicks = offer.clicks || 0;
                        const sales = offer.sales || 0;
                        const conversion = clicks > 0 ? ((sales / clicks) * 100).toFixed(1) : '0.0';

                        return (
                            <div key={offer.id} className="group bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all hover:border-blue-200 flex flex-col">
                                {/* Image Area */}
                                <div className="h-48 bg-gray-100 relative overflow-hidden">
                                    {offer.imageUrl ? (
                                        <img
                                            src={offer.imageUrl}
                                            alt={offer.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                                            <ImageIcon size={48} />
                                        </div>
                                    )}

                                    {/* Status Badge */}
                                    <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm backdrop-blur-md
                                            ${offer.active ? 'bg-green-500/90 text-white' : 'bg-gray-500/90 text-white'}`}>
                                            {offer.active ? 'ATIVA' : 'INATIVA'}
                                        </span>
                                    </div>

                                    {/* Discount Badge */}
                                    {discount && discount > 0 && (
                                        <div className="absolute bottom-3 left-3">
                                            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                                                {discount}% OFF
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-lg text-gray-900 leading-tight line-clamp-2">{offer.title}</h3>
                                        </div>
                                        <p className="text-gray-500 text-sm mb-4 line-clamp-2">{offer.subtitle}</p>

                                        {product && (
                                            <div className="bg-gray-50 rounded-xl p-3 mb-4 border border-gray-100">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Tag size={14} className="text-blue-500" />
                                                    <span className="text-xs font-bold text-gray-500 uppercase">{product.category}</span>
                                                </div>
                                                <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                                                <div className="mt-2 flex items-baseline gap-2">
                                                    {product.promotionalPrice ? (
                                                        <>
                                                            <span className="text-lg font-bold text-gray-900">R$ {product.promotionalPrice.toFixed(2)}</span>
                                                            <span className="text-sm text-gray-400 line-through">R$ {product.price.toFixed(2)}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-lg font-bold text-gray-900">R$ {product.price.toFixed(2)}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Metrics (Visual Only) */}
                                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-gray-100 mb-3">
                                        <div className="text-center">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold flex items-center justify-center gap-1"><Eye size={10} /> Views</p>
                                            <p className="text-sm font-bold text-gray-700">{views}</p>
                                        </div>
                                        <div className="text-center border-l border-gray-100">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold flex items-center justify-center gap-1"><MousePointer size={10} /> Clicks</p>
                                            <p className="text-sm font-bold text-gray-700">{clicks}</p>
                                        </div>
                                        <div className="text-center border-l border-gray-100">
                                            <p className="text-[10px] text-gray-400 uppercase font-bold flex items-center justify-center gap-1"><TrendingUp size={10} /> Conv.</p>
                                            <p className="text-sm font-bold text-green-600">{conversion}%</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 pt-2">
                                        <button
                                            onClick={() => handleEdit(offer)}
                                            className="flex-1 py-2 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Edit size={16} /> Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(offer.id)}
                                            className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">

                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white z-10">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {editingOffer ? 'Editar Oferta' : 'Criar Nova Oferta'}
                                </h2>
                                <p className="text-sm text-gray-500">Preencha os detalhes da campanha promocional.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-gray-50">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">

                                {/* Form Column */}
                                <form id="offerForm" onSubmit={handleSave} className="space-y-6">

                                    {/* Product Selection Block */}
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <ShoppingBag size={18} className="text-blue-500" />
                                            Produto da Oferta
                                        </h3>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Selecionar Produto</label>
                                            <select
                                                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                                value={formData.productId || ''}
                                                onChange={e => {
                                                    const pid = e.target.value;
                                                    const prod = products.find(p => p.id === pid);
                                                    setFormData({
                                                        ...formData,
                                                        productId: pid,
                                                        title: prod ? `Oferta: ${prod.name}` : formData.title,
                                                        imageUrl: prod && prod.images && prod.images.length > 0 ? prod.images[0] : formData.imageUrl
                                                    });
                                                }}
                                            >
                                                <option value="">-- Escolha um produto (Opcional) --</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name} - R$ {p.price.toFixed(2)}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Offer Details Block */}
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                                        <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                                            <Tag size={18} className="text-purple-500" />
                                            Detalhes da Campanha
                                        </h3>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título da Oferta</label>
                                            <input
                                                required
                                                type="text"
                                                placeholder="Ex: Super Desconto em Vitaminas"
                                                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none font-medium"
                                                value={formData.title}
                                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subtítulo / Descrição Curta</label>
                                            <input
                                                type="text"
                                                placeholder="Ex: Aproveite 20% OFF em toda linha C"
                                                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                value={formData.subtitle}
                                                onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">URL da Imagem (Banner)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="https://..."
                                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500/20 outline-none text-sm"
                                                    value={formData.imageUrl}
                                                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                                />
                                                <button type="button" className="p-3 bg-gray-100 rounded-xl hover:bg-gray-200 text-gray-600">
                                                    <ImageIcon size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Settings Block */}
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <Clock size={18} className="text-orange-500" />
                                            Configurações
                                        </h3>

                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">Status da Oferta</p>
                                                <p className="text-xs text-gray-500">Ofertas inativas não aparecem na loja.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={formData.active}
                                                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                                                />
                                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 transition-colors"></div>
                                            </label>
                                        </div>
                                    </div>
                                </form>

                                {/* Preview Column */}
                                <div className="space-y-6">
                                    <div className="sticky top-6">
                                        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
                                            <Eye size={16} /> Preview em Tempo Real
                                        </h3>

                                        {/* Card Preview */}
                                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden max-w-sm mx-auto transform transition-all hover:scale-105 duration-300">
                                            <div className="h-56 bg-gray-100 relative">
                                                {formData.imageUrl ? (
                                                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                                                        <ImageIcon size={48} className="mb-2 opacity-50" />
                                                        <span className="text-xs font-medium">Sem imagem</span>
                                                    </div>
                                                )}

                                                {/* Preview Badges */}
                                                <div className="absolute top-3 right-3">
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm backdrop-blur-md
                                                        ${formData.active ? 'bg-green-500/90 text-white' : 'bg-gray-500/90 text-white'}`}>
                                                        {formData.active ? 'ATIVA' : 'INATIVA'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-5">
                                                <h3 className="font-bold text-xl text-gray-900 mb-1 leading-tight">
                                                    {formData.title || 'Título da Oferta'}
                                                </h3>
                                                <p className="text-gray-500 text-sm mb-4">
                                                    {formData.subtitle || 'Subtítulo da oferta aparecerá aqui...'}
                                                </p>

                                                {formData.productId && (
                                                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-500 font-bold border border-blue-100">
                                                            %
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-blue-800 uppercase">Produto Vinculado</p>
                                                            <p className="text-sm font-medium text-blue-900 truncate max-w-[180px]">
                                                                {products.find(p => p.id === formData.productId)?.name}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                <button className="w-full mt-4 py-3 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-gray-200">
                                                    Ver Oferta
                                                </button>
                                            </div>
                                        </div>

                                        {/* Tips Box */}
                                        <div className="mt-6 bg-yellow-50 border border-yellow-100 rounded-xl p-4">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle size={20} className="text-yellow-600 mt-0.5" />
                                                <div>
                                                    <p className="font-bold text-yellow-800 text-sm">Dica de Conversão</p>
                                                    <p className="text-xs text-yellow-700 mt-1 leading-relaxed">
                                                        Ofertas com imagens de alta qualidade e títulos curtos (até 40 caracteres) tendem a ter 25% mais cliques.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-gray-100 bg-white flex justify-end gap-3 z-10">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-3 text-gray-700 hover:bg-gray-50 rounded-xl font-bold border border-gray-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                form="offerForm"
                                className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <Save size={18} />
                                Salvar Oferta
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
