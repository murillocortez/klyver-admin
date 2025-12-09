import React, { useEffect, useState } from 'react';
import {
  Edit2,
  Plus,
  Trash2,
  Filter,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Package,
  MoreHorizontal,
  Copy,
  Eye,
  Zap,
  TrendingUp,
  Box,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Home
} from 'lucide-react';
import { db } from '../services/dbService';
import { Product } from '../types';
import { ProductFormModal } from './ProductFormModal';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../hooks/useRole';
import { Role } from '../types';
import { useSearchParams, Link } from 'react-router-dom';
import { usePlan } from '../hooks/usePlan';
import { UpgradeModal } from '../components/UpgradeModal';

import { ClipboardList, LayoutList, Tag, Search } from 'lucide-react';
import { RestockPage } from './RestockPage';
import { DailyOffersPage } from './DailyOffersPage';
import { CMEDMonitor } from './CMEDMonitor';

// Simple Tab Button Component
const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all font-medium text-sm whitespace-nowrap relative
      ${active
        ? 'border-primary text-primary bg-primary/5'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
  >
    <Icon size={18} className={active ? 'text-primary' : 'text-gray-400'} />
    <span>{label}</span>
  </button>
);

export const ProductList: React.FC = () => {
  const { user } = useAuth();
  const { canDelete } = useRole();
  const { checkLimit, plan } = usePlan();
  const canEdit = user?.role === Role.CEO || user?.role === Role.ADMIN || user?.role === Role.GERENTE;
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'products';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);

  // Filters
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStock, setFilterStock] = useState('all'); // all, low, zero
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
  const [sortBy, setSortBy] = useState<'stock_desc' | 'stock_asc' | 'price_desc' | 'price_asc'>('stock_desc');

  const fetchProducts = async () => {
    setLoading(true);
    const data = await db.getProducts();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && products.length > 0) {
      const productToEdit = products.find(p => p.id === editId);
      if (productToEdit) {
        setEditingProduct(productToEdit);
        setIsModalOpen(true);
      }
    }
  }, [searchParams, products]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Preserve tab when closing modal
    const tab = searchParams.get('tab');
    setSearchParams(tab ? { tab } : {});
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await db.deleteProduct(id);
        fetchProducts();
      } catch (error: any) {
        console.error('Error deleting product:', error);
        alert(`Erro ao excluir produto: ${error.message || 'Erro desconhecido'}`);
      }
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    if (!checkLimit('products', products.length)) {
      setShowUpgradeModal(true);
      return;
    }
    setEditingProduct(undefined);
    setIsModalOpen(true);
  };

  const handleSave = async (product: Product) => {
    try {
      await db.saveProduct(product);
      setIsModalOpen(false);
      fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      alert(`Erro ao salvar produto: ${error.message || 'Verifique se o SKU é único ou se há campos obrigatórios faltando.'}`);
    }
  };

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  // Filter Logic
  const filteredProducts = products
    .filter(p => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = filterCategory === 'all' || p.category === filterCategory;

      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;

      let matchesStock = true;
      if (filterStock === 'low') matchesStock = p.stockTotal <= p.minStockThreshold && p.stockTotal > 0;
      if (filterStock === 'zero') matchesStock = p.stockTotal === 0;

      return matchesSearch && matchesCategory && matchesStatus && matchesStock;
    })
    .sort((a, b) => {
      if (sortBy === 'stock_desc') return b.stockTotal - a.stockTotal;
      if (sortBy === 'stock_asc') return a.stockTotal - b.stockTotal;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'price_asc') return a.price - b.price;
      return 0;
    });

  const criticalStockProducts = products.filter(p => p.stockTotal <= p.minStockThreshold);

  const categories = Array.from(new Set(products.map(p => p.category)));

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 flex overflow-hidden shadow-sm mb-6">
        <TabButton
          active={activeTab === 'products'}
          onClick={() => handleTabChange('products')}
          icon={LayoutList}
          label="Gerenciar Produtos"
        />
        <TabButton
          active={activeTab === 'restock'}
          onClick={() => handleTabChange('restock')}
          icon={ClipboardList}
          label="Reposição Inteligente"
        />
        <TabButton
          active={activeTab === 'offers'}
          onClick={() => handleTabChange('offers')}
          icon={Tag}
          label="Ofertas & Promoções"
        />
        <TabButton
          active={activeTab === 'cmed'}
          onClick={() => handleTabChange('cmed')}
          icon={Search}
          label="Monitoramento CMED"
        />
      </div>

      {activeTab === 'restock' ? (
        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
          <RestockPage />
        </div>
      ) : activeTab === 'offers' ? (
        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
          <DailyOffersPage />
        </div>
      ) : activeTab === 'cmed' ? (
        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
          <CMEDMonitor />
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
          {/* Header & Breadcrumb */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Link to="/dashboard" className="hover:text-primary transition-colors flex items-center gap-1">
                <Home size={14} /> Dashboard
              </Link>
              <ChevronRight size={14} />
              <span className="text-gray-900 font-medium">Produtos & Estoque</span>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Produtos & Estoque</h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-gray-500">Gerencie seus produtos, categorias, estoque e preços.</p>
                  {plan && plan.limits.products !== -1 && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${products.length >= plan.limits.products
                      ? 'bg-red-50 text-red-600 border-red-100'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                      {products.length} / {plan.limits.products}
                    </span>
                  )}
                </div>
              </div>
              {canEdit && (
                <button
                  onClick={handleAddNew}
                  className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/25 transition-all active:scale-95"
                >
                  <Plus size={20} />
                  <span>Novo Produto</span>
                </button>
              )}
            </div>
          </div>

          {/* Critical Stock Alert */}
          {criticalStockProducts.length > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <AlertTriangle size={100} className="text-red-500" />
              </div>
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-lg text-red-600">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Estoque Crítico</h3>
                    <p className="text-sm text-gray-500">{criticalStockProducts.length} produtos precisam de reposição urgente.</p>
                  </div>
                </div>
                <button
                  onClick={() => setFilterStock('low')}
                  className="text-sm font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors"
                >
                  Ver todos em risco
                </button>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide relative z-10">
                {criticalStockProducts.slice(0, 6).map(p => (
                  <div key={p.id} className="min-w-[200px] bg-white border border-gray-100 p-3 rounded-xl shadow-sm flex items-center gap-3 hover:shadow-md transition-all cursor-pointer" onClick={() => handleEdit(p)}>
                    <img src={p.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-50" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{p.name}</p>
                      <p className="text-xs text-red-600 font-bold">{p.stockTotal} un restantes</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Controls & Filters */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col xl:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por nome, categoria, SKU ou código..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <div className="h-8 w-px bg-gray-200 mx-2 hidden xl:block" />

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 focus:ring-2 focus:ring-primary/20 outline-none bg-white cursor-pointer hover:border-gray-300 transition-colors"
              >
                <option value="all">Todas Categorias</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 focus:ring-2 focus:ring-primary/20 outline-none bg-white cursor-pointer hover:border-gray-300 transition-colors"
              >
                <option value="all">Todos Status</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>

              <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                <button
                  onClick={() => setSortBy('stock_desc')}
                  className={`p-2 rounded-lg transition-all ${sortBy.includes('stock') ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Ordenar por Estoque"
                >
                  <Package size={18} />
                </button>
                <button
                  onClick={() => setSortBy('price_desc')}
                  className={`p-2 rounded-lg transition-all ${sortBy.includes('price') ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Ordenar por Preço"
                >
                  <TrendingUp size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Main Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs w-[40%]">Produto</th>
                    <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Preço</th>
                    <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Estoque</th>
                    <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                    {canEdit && <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan={canEdit ? 5 : 4} className="text-center py-12 text-gray-400">Carregando inventário...</td></tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 5 : 4} className="text-center py-16">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Search size={24} className="text-gray-300" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">Nenhum produto encontrado</h3>
                          <p className="text-gray-500 mt-1">Tente ajustar os filtros ou buscar por outro termo.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(product => (
                      <tr key={product.id} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="relative group/img">
                              <img
                                src={product.images[0]}
                                alt=""
                                className="w-12 h-12 rounded-xl bg-gray-100 object-cover border border-gray-200 group-hover/img:scale-105 transition-transform"
                              />
                              {product.promotionalPrice && (
                                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                                  PROMO
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-gray-900 text-base group-hover:text-primary transition-colors cursor-pointer" onClick={() => handleEdit(product)}>
                                  {product.name}
                                </p>
                                {/* Indicators */}
                                {product.stockTotal > 100 && (
                                  <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1" title="Alta Procura">
                                    <Zap size={10} />
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-medium">
                                  {product.category === 'Outros' ? product.customCategory : product.category}
                                </span>
                                <span className="text-xs text-gray-400">SKU: {product.sku || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            {product.promotionalPrice ? (
                              <>
                                <span className="font-bold text-red-600">R$ {product.promotionalPrice.toFixed(2)}</span>
                                <span className="text-xs text-gray-400 line-through">R$ {product.price.toFixed(2)}</span>
                              </>
                            ) : (
                              <span className="font-bold text-gray-900">R$ {product.price.toFixed(2)}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5
                          ${product.stockTotal === 0
                                ? 'bg-gray-100 text-gray-500 border-gray-200'
                                : product.stockTotal <= product.minStockThreshold
                                  ? 'bg-red-50 text-red-700 border-red-100'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${product.stockTotal === 0 ? 'bg-gray-400' :
                                product.stockTotal <= product.minStockThreshold ? 'bg-red-500' : 'bg-emerald-500'
                                }`} />
                              {product.stockTotal === 0 ? 'Esgotado' : `${product.stockTotal} un`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${product.status === 'active' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            {product.status === 'active' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            {product.status === 'active' ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        {canEdit && (
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleEdit(product)}
                                className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Editar"
                              >
                                <Edit2 size={18} />
                              </button>
                              {canDelete('products') && (
                                <button
                                  onClick={() => handleDelete(product.id)}
                                  className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Placeholder */}
            <div className="bg-white border-t border-gray-100 p-4 flex items-center justify-between text-sm text-gray-500">
              <span>Mostrando {filteredProducts.length} produtos</span>
              <div className="flex gap-2">
                <button className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50" disabled>Anterior</button>
                <button className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-50" disabled>Próxima</button>
              </div>
            </div>
          </div>

          {isModalOpen && (
            <ProductFormModal
              isOpen={isModalOpen}
              onClose={handleCloseModal}
              onSave={handleSave}
              initialData={editingProduct}
            />
          )}

          <UpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            featureName="Mais Produtos"
            requiredPlan="Superior"
          />
        </div>
      )}
    </div>
  );
};
