import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Plus, Trash2, Save, Store, Package,
    CheckCircle, AlertTriangle, TrendingDown, DollarSign, Truck, Search
} from 'lucide-react';
import { quotationService } from '../../services/purchasing/quotationService';
import { supplierService } from '../../services/purchasing/supplierService';
import { purchaseService } from '../../services/purchasing/purchaseService';
import { db } from '../../services/dbService'; // To search products
import { Supplier } from '../../services/purchasing/types';

export const QuotationForm: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [quotation, setQuotation] = useState<any>(null);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

    // Add Supplier Modal
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);

    // Add Product Modal
    const [showProductModal, setShowProductModal] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [productsFound, setProductsFound] = useState<any[]>([]);

    useEffect(() => {
        loadData();
    }, [id]);

    useEffect(() => {
        if (id) loadParticipatingSuppliers();
    }, [id]);

    const loadData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await quotationService.getById(id);
            setQuotation(data);
        } catch (error) {
            console.error(error);
            alert('Erro ao carregar cotação');
        } finally {
            setLoading(false);
        }
    };

    const loadParticipatingSuppliers = async () => {
        if (!id) return;
        const participating = await quotationService.getParticipatingSuppliers(id);
        setSuppliers(participating);
    };

    const handleManageSuppliers = async () => {
        // Show immediately to give feedback
        setShowSupplierModal(true);
        try {
            const all = await supplierService.getAll();
            setAllSuppliers(all.filter(s => s.ativo));
        } catch (error) {
            console.error(error);
            alert('Erro ao carregar fornecedores');
        }
    };

    const handleToggleSupplier = async (supplierId: string, isParticipating: boolean) => {
        if (!id) return;
        try {
            if (isParticipating) {
                // Remove
                await quotationService.removeSupplier(id, supplierId);
            } else {
                // Add
                await quotationService.addSupplier(id, supplierId);
            }
            // Refresh participating list
            loadParticipatingSuppliers();
        } catch (error) {
            console.error(error);
            alert('Erro ao atualizar fornecedor.');
        }
    };

    // Product Search
    useEffect(() => {
        if (productSearch.length > 2) {
            const timer = setTimeout(async () => {
                const results = await db.searchProducts(productSearch);
                setProductsFound(results);
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setProductsFound([]);
        }
    }, [productSearch]);

    const handleAddProduct = async (product: any) => {
        if (!id) return;
        await quotationService.addItem(id, product.id, 1); // Default qty 1
        setShowProductModal(false);
        setProductSearch('');
        loadData();
    };

    const handleRemoveItem = async (itemId: string) => {
        if (!confirm('Remover item?')) return;
        await quotationService.removeItem(itemId);
        loadData();
    };

    const handleQuantityChange = async (itemId: string, newQty: number) => {
        if (newQty < 1) return;
        try {
            // Optimistic update
            const updatedItems = quotation.items.map((i: any) =>
                i.id === itemId ? { ...i, quantity_requested: newQty } : i
            );
            setQuotation({ ...quotation, items: updatedItems });

            await quotationService.updateItemQuantity(itemId, newQty);
        } catch (error) {
            console.error(error);
            loadData(); // Revert on error
        }
    };

    const savePrice = async (itemId: string, supplierId: string, price: number, delivery?: number) => {
        if (!price) return;
        try {
            await quotationService.savedPrice(itemId, supplierId, price, delivery);
            loadData(); // Reload to refresh totals and best price calculation
        } catch (e) {
            console.error(e);
        }
    };

    // Helpers for Matrix
    const getPriceRecord = (itemId: string, supplierId: string) => {
        const item = quotation?.items?.find((i: any) => i.id === itemId);
        return item?.prices?.find((p: any) => p.supplier_id === supplierId);
    };

    const getBestPrice = (itemId: string) => {
        const item = quotation?.items?.find((i: any) => i.id === itemId);
        if (!item?.prices?.length) return null;

        // Filter by participating suppliers
        const activePrices = item.prices.filter((p: any) => suppliers.some(s => s.id === p.supplier_id));
        if (!activePrices.length) return null;

        let best = activePrices[0];
        for (const p of activePrices) {
            if (p.unit_price < best.unit_price) best = p;
        }
        return best;
    };

    const getWorstPrice = (itemId: string) => {
        const item = quotation?.items?.find((i: any) => i.id === itemId);
        if (!item?.prices?.length) return null;

        const activePrices = item.prices.filter((p: any) => suppliers.some(s => s.id === p.supplier_id));
        if (!activePrices.length) return null;

        let worst = activePrices[0];
        for (const p of activePrices) {
            if (p.unit_price > worst.unit_price) worst = p;
        }
        return worst;
    };

    const calculateTotals = () => {
        const totals: Record<string, number> = {};
        suppliers.forEach(s => totals[s.id] = 0);

        quotation?.items?.forEach((item: any) => {
            const best = getBestPrice(item.id);
            // We sum strictly for each supplier regardless if they are 'best'
            // But usually totals implies "If I buy the whole list from this supplier"
            suppliers.forEach(s => {
                const price = item.prices.find((p: any) => p.supplier_id === s.id);
                if (price) {
                    totals[s.id] += (price.unit_price * item.quantity_requested);
                }
            });
        });
        return totals;
    };

    const getWinningTotal = () => {
        let total = 0;
        quotation?.items?.forEach((item: any) => {
            const best = getBestPrice(item.id);
            if (best) {
                total += (best.unit_price * item.quantity_requested);
            }
        });
        return total;
    };

    const handleGenerateOrders = async () => {
        if (!id) return;
        if (!confirm(`Gerar pedidos de compra baseados nos melhores preços? \nValor Total Estimado: R$ ${getWinningTotal().toFixed(2)}`)) return;

        setLoading(true);
        try {
            // 1. Group winners by supplier
            const ordersMap: Record<string, any[]> = {}; // supplierId -> items[]

            for (const item of quotation.items) {
                const bestPrice = getBestPrice(item.id);
                if (bestPrice) {
                    if (!ordersMap[bestPrice.supplier_id]) {
                        ordersMap[bestPrice.supplier_id] = [];
                    }
                    ordersMap[bestPrice.supplier_id].push({
                        item,
                        price: bestPrice
                    });
                }
            }

            // 2. Create Purchases
            for (const supplierId in ordersMap) {
                const items = ordersMap[supplierId];
                const totalAmount = items.reduce((sum, { item, price }) => sum + (price.unit_price * item.quantity_requested), 0);

                // Create Header
                const purchase = await purchaseService.create({
                    supplier_id: supplierId,
                    total_amount: totalAmount,
                    status: 'lancado',
                    payment_terms: items[0].price.payment_terms || 'À Vista',
                    invoice_number: null
                });

                // Create Items
                const purchaseItems = items.map(({ item, price }) => ({
                    purchase_id: purchase.id,
                    product_id: item.product_id,
                    quantity: item.quantity_requested,
                    unit_price: price.unit_price,
                    batch_number: null,
                    expiry_date: null
                }));

                await purchaseService.addItems(purchaseItems);
            }

            // 3. Close Quotation
            await quotationService.updateStatus(id, 'fechada');

            alert('Pedidos gerados com sucesso!');
            navigate('/admin/purchases');

        } catch (error) {
            console.error(error);
            alert('Erro ao gerar pedidos.');
            setLoading(false);
        }
    };

    const totals = calculateTotals();

    if (loading) return <div className="p-12 text-center text-gray-500">Carregando cotação...</div>;

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
                <button onClick={() => navigate('/admin/quotations')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        Cotação #{quotation?.id?.slice(0, 8)}
                        <span className={`text-xs px-2 py-0.5 rounded uppercase ${quotation?.status === 'aberta' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}>
                            {quotation?.status}
                        </span>
                    </h1>
                    <p className="text-xs text-gray-500">Criado em {new Date(quotation?.created_at).toLocaleString()}</p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Package size={16} />
                        <strong>{quotation?.items?.length || 0}</strong> produtos
                    </div>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Store size={16} />
                        <strong>{suppliers.length}</strong> fornecedores
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleManageSuppliers}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 text-sm font-medium transition-colors cursor-pointer active:scale-95"
                    >
                        <Store size={16} />
                        Gerenciar Fornecedores
                    </button>
                    <button
                        onClick={() => setShowProductModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm font-medium transition-colors shadow-sm"
                    >
                        <Plus size={16} />
                        Adicionar Produto
                    </button>
                </div>
            </div>

            {/* Matrix View */}
            {suppliers.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <Store className="mx-auto text-gray-300 mb-3" size={48} />
                    <h3 className="text-lg font-medium text-gray-900">Nenhum fornecedor participante</h3>
                    <p className="text-gray-500 mb-4">Selecione quais fornecedores participarão desta cotação.</p>
                    <button
                        onClick={handleManageSuppliers}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                    >
                        Selecionar Fornecedores
                    </button>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 text-gray-500 text-xs uppercase font-bold tracking-wider">
                                <th className="p-4 border-b border-r border-gray-200 min-w-[300px] sticky left-0 bg-gray-50 z-10 w-[300px]">
                                    Produto
                                </th>
                                {/* Quantity Column */}
                                <th className="p-4 border-b border-r border-gray-200 w-[100px] text-center bg-gray-50">
                                    Qtd
                                </th>
                                {suppliers.map(s => (
                                    <th key={s.id} className="p-4 border-b border-r border-gray-200 min-w-[180px] bg-white text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-gray-900 truncate max-w-[150px]">{s.nome_fantasia || s.razao_social}</span>
                                        </div>
                                    </th>
                                ))}
                                <th className="p-4 border-b border-gray-200 w-[50px] text-center">
                                    {/* Actions */}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {quotation?.items?.length === 0 && (
                                <tr>
                                    <td colSpan={suppliers.length + 3} className="p-12 text-center text-gray-400">
                                        Nenhum produto adicionado. Clique em "Adicionar Produto" acima.
                                    </td>
                                </tr>
                            )}
                            {quotation?.items?.map((item: any) => {
                                const best = getBestPrice(item.id);
                                const worst = getWorstPrice(item.id);

                                return (
                                    <tr key={item.id} className="hover:bg-gray-50/30 transition-colors">
                                        {/* Product Info */}
                                        <td className="p-4 border-r border-gray-100 sticky left-0 bg-white group-hover:bg-gray-50/30 z-10">
                                            <div>
                                                <p className="font-bold text-gray-900 line-clamp-2">{item.product?.name}</p>
                                                <p className="text-xs text-gray-400">SKU: {item.product?.sku}</p>
                                            </div>
                                        </td>

                                        {/* Quantity */}
                                        <td className="p-4 border-r border-gray-100 text-center">
                                            <div className="flex justify-center">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="w-16 text-center bg-gray-50 border border-gray-200 rounded-lg py-1 font-mono font-bold text-gray-700 focus:ring-2 focus:ring-primary/20 outline-none"
                                                    value={item.quantity_requested}
                                                    onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                                                />
                                            </div>
                                        </td>

                                        {/* Supplier Columns */}
                                        {suppliers.map(s => {
                                            const priceRecord = getPriceRecord(item.id, s.id);
                                            const unitPrice = priceRecord?.unit_price || '';
                                            const delivery = priceRecord?.delivery_days || '';

                                            // Comparison styles
                                            let cellClass = "bg-white";
                                            let badge = null;

                                            if (priceRecord && best && priceRecord.id === best.id) {
                                                cellClass = "bg-green-50/50";
                                                badge = <span className="absolute top-1 right-1 text-[10px] bg-green-200 text-green-800 px-1 rounded flex items-center gap-0.5"><TrendingDown size={8} /> Melhor</span>;
                                            } else if (priceRecord && worst && priceRecord.id === worst.id && item.prices.length > 1) {
                                                cellClass = "bg-red-50/30";
                                            }

                                            return (
                                                <td key={s.id} className={`p-3 border-r border-gray-100 text-center relative ${cellClass}`}>
                                                    {badge}
                                                    <div className="space-y-2">
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                placeholder="0,00"
                                                                className={`w-full pl-7 pr-2 py-1.5 text-sm border rounded text-right focus:ring-2 focus:ring-blue-500/20 outline-none transition-colors
                                                                    ${priceRecord && best && priceRecord.id === best.id ? 'border-green-300 font-bold text-green-700 bg-white' : 'border-gray-200 text-gray-700 bg-gray-50/50'}
                                                                `}
                                                                defaultValue={unitPrice}
                                                                onBlur={(e) => savePrice(item.id, s.id, parseFloat(e.target.value), parseInt(delivery?.toString() || '0'))}
                                                            />
                                                        </div>
                                                        {/* Delivery Days */}
                                                        <div className="flex items-center justify-center gap-1 opacity-60 hover:opacity-100 transition-opacity">
                                                            <Truck size={12} className="text-gray-400" />
                                                            <input
                                                                type="number"
                                                                placeholder="Dias"
                                                                className="w-12 text-[10px] text-center border-b border-gray-200 bg-transparent focus:border-primary outline-none text-gray-500"
                                                                defaultValue={delivery}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                            );
                                        })}

                                        {/* Delete Action */}
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-gray-50 border-t-2 border-gray-200 font-bold text-gray-900 sticky bottom-0 z-20 shadow-inner">
                            <tr>
                                <td className="p-4 sticky left-0 bg-gray-50 uppercase text-xs text-gray-500 border-r border-gray-200">
                                    Totais da Cotação
                                </td>
                                <td className="p-4 text-center text-xs text-gray-500 border-r border-gray-200">
                                    -
                                </td>
                                {suppliers.map(s => {
                                    const total = totals[s.id] || 0;
                                    const isBestTotal = total > 0 && total === Math.min(...Object.values(totals).filter(v => v > 0));

                                    return (
                                        <td key={s.id} className={`p-4 text-center border-r border-gray-200 ${isBestTotal ? 'bg-green-100 text-green-800' : 'bg-gray-50'}`}>
                                            <div className="text-sm">R$ {total.toFixed(2)}</div>
                                            {isBestTotal && <div className="text-[10px] uppercase mt-1 flex items-center justify-center gap-1"><CheckCircle size={10} /> Menor Global</div>}
                                        </td>
                                    );
                                })}
                                <td className="p-4 bg-gray-50"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            {/* Floating Action Bar */}
            {getWinningTotal() > 0 && (
                <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
                    <button
                        onClick={handleGenerateOrders}
                        className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-xl hover:bg-black transition-transform hover:scale-105 flex items-center gap-3 font-bold"
                    >
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[10px] text-gray-400 uppercase font-light">Melhor Preço</span>
                            <span>R$ {getWinningTotal().toFixed(2)}</span>
                        </div>
                        <div className="h-8 w-px bg-gray-700 mx-1"></div>
                        <span className="flex items-center gap-2">
                            Gerar Pedidos <CheckCircle size={18} />
                        </span>
                    </button>
                </div>
            )}

            {/* Supplier Selection Modal */}
            {showSupplierModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold">Gerenciar Fornecedores</h2>
                            <button onClick={() => setShowSupplierModal(false)} className="p-2 bg-gray-100 rounded-full"><Trash2 size={16} className="rotate-45" /></button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2">
                            <p className="text-sm text-gray-500 mb-4">Selecione os fornecedores que participarão desta cotação:</p>
                            {allSuppliers.map(s => {
                                const isSelected = suppliers.some(part => part.id === s.id);
                                return (
                                    <div
                                        key={s.id}
                                        onClick={() => handleToggleSupplier(s.id, isSelected)}
                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                                            ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100 hover:border-gray-300'}
                                        `}
                                    >
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center
                                            ${isSelected ? 'bg-primary border-primary text-white' : 'border-gray-300'}
                                         `}>
                                            {isSelected && <CheckCircle size={12} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{s.nome_fantasia || s.razao_social}</p>
                                            <p className="text-xs text-gray-500">{s.cnpj}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="pt-4 border-t border-gray-100 mt-4 text-right">
                            <button onClick={() => setShowSupplierModal(false)} className="px-6 py-2 bg-primary text-white rounded-lg font-bold">Concluir</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Modal */}
            {showProductModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold">Adicionar Produto</h2>
                            <button onClick={() => setShowProductModal(false)} className="p-2 bg-gray-100 rounded-full"><Trash2 size={16} className="rotate-45" /></button>
                        </div>

                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Digite o nome do produto..."
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                                value={productSearch}
                                onChange={e => setProductSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2">
                            {productsFound.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => handleAddProduct(p)}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-xl transition-all text-left group"
                                >
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 group-hover:bg-blue-200 group-hover:text-blue-600 transition-colors">
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{p.name}</p>
                                        <p className="text-xs text-gray-500">{p.sku ? `SKU: ${p.sku}` : 'Sem SKU'}</p>
                                    </div>
                                    <div className="ml-auto">
                                        <Plus size={20} className="text-gray-300 group-hover:text-primary" />
                                    </div>
                                </button>
                            ))}
                            {productSearch.length > 2 && productsFound.length === 0 && (
                                <p className="text-center text-gray-400 py-8">Nenhum produto encontrado.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
