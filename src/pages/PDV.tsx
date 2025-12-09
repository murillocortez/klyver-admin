import React, { useState, useEffect, useRef } from 'react';
import {
    Search, ShoppingCart, User, Plus, Minus, Trash2,
    CreditCard, CheckCircle, Package, AlertTriangle,
    UserPlus, Tag, RefreshCw, LogOut, Printer
} from 'lucide-react';
import { printSimulation, printOrder, getAutoPrint } from '../services/printerService';
import { db } from '../services/dbService';
import { Product, Customer, OrderItem } from '../types';
import { CustomerIdentifyModal } from '../components/pdv/CustomerIdentifyModal';
import { CustomerEditModal } from '../components/pdv/CustomerEditModal';
import { PaymentModal } from '../components/pdv/PaymentModal';
import { CustomerCheckModal } from '../components/pdv/CustomerCheckModal';
import { CheckoutSuccessModal } from '../components/pdv/CheckoutSuccessModal';
import { invoiceService } from '../services/fiscal/invoiceService';
import { buildFiscalPayload } from '../services/fiscal/payloadBuilder';
import { useRole } from '../hooks/useRole';
import { Role } from '../types';

export const PDV: React.FC = () => {
    // State
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(false);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showCustomerCheckModal, setShowCustomerCheckModal] = useState(false);
    const [successData, setSuccessData] = useState<{ order: any, invoice?: any } | null>(null);
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [simulationMode, setSimulationMode] = useState(false);
    const { role } = useRole();

    // Refs for focus management
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadProducts();

        // Load state from localStorage
        const savedCart = localStorage.getItem('pdv_cart');
        const savedCustomer = localStorage.getItem('pdv_customer');

        if (savedCart) {
            try {
                setCart(JSON.parse(savedCart));
            } catch (e) { console.error('Error loading cart', e); }
        }

        if (savedCustomer) {
            try {
                setCustomer(JSON.parse(savedCustomer));
            } catch (e) { console.error('Error loading customer', e); }
        }
    }, []);

    // Save state to localStorage
    useEffect(() => {
        localStorage.setItem('pdv_cart', JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        if (customer) {
            localStorage.setItem('pdv_customer', JSON.stringify(customer));
        } else {
            localStorage.removeItem('pdv_customer');
        }
    }, [customer]);

    // Prevent accidental close
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (cart.length > 0) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [cart]);

    useEffect(() => {
        if (searchTerm.length > 1) {
            const term = searchTerm.toLowerCase();
            const results = products.filter(p =>
                p.name.toLowerCase().includes(term) ||
                p.sku?.includes(term) ||
                p.activeIngredient?.toLowerCase().includes(term)
            ).slice(0, 8);
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    }, [searchTerm, products]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F1') {
                e.preventDefault();
                searchInputRef.current?.focus();
            } else if (e.key === 'F2') {
                e.preventDefault();
                if (confirm('Limpar carrinho?')) setCart([]);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Re-calculate discounts when customer changes
    useEffect(() => {
        if (customer && customer.healthInsurancePlan) {
            applyPlanDiscount(customer.healthInsurancePlan.discount_percent);
        } else {
            removeDiscounts();
        }
    }, [customer]);

    const loadProducts = async () => {
        try {
            const data = await db.getProducts();
            setProducts(data.filter(p => p.status === 'active'));
        } catch (error) {
            console.error('Error loading products', error);
        }
    };

    const applyPlanDiscount = (percent: number) => {
        setCart(prev => prev.map(item => {
            // Logic: Apply discount only if allowed (e.g. not OTC if restricted, but for now apply all)
            const originalPrice = item.originalPrice || item.priceAtPurchase;
            const discountAmount = originalPrice * (percent / 100);
            return {
                ...item,
                originalPrice: originalPrice,
                discountApplied: discountAmount,
                priceAtPurchase: originalPrice - discountAmount
            };
        }));
    };

    const removeDiscounts = () => {
        setCart(prev => prev.map(item => ({
            ...item,
            priceAtPurchase: item.originalPrice || item.priceAtPurchase,
            discountApplied: 0,
            originalPrice: undefined
        })));
    };

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(i => i.productId === product.id);

            // Calculate price based on current customer plan
            let price = product.price;
            let discount = 0;
            let original = product.price;

            if (customer?.healthInsurancePlan) {
                discount = price * (customer.healthInsurancePlan.discount_percent / 100);
                price = price - discount;
            }

            if (existing) {
                return prev.map(i => i.productId === product.id
                    ? { ...i, quantity: i.quantity + 1 }
                    : i
                );
            }

            return [...prev, {
                productId: product.id,
                productName: product.name,
                quantity: 1,
                priceAtPurchase: price,
                originalPrice: original,
                discountApplied: discount,
                category: product.category,
                image_url: product.images?.[0]
            }];
        });
        setSearchTerm('');
        searchInputRef.current?.focus();
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.productId === productId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(i => i.productId !== productId));
    };

    const handleBarcodeScan = async (code: string) => {
        // Try to find by barcode first
        let product = products.find(p => p.barcode === code);

        // If not found, try by SKU or Name (exact match)
        if (!product) {
            product = products.find(p => p.sku === code || p.name.toLowerCase() === code.toLowerCase());
        }

        if (product) {
            addToCart(product);
            setSearchTerm('');
        } else {
            // If it looks like a barcode (digits > 7), show alert
            if (/^\d{8,}$/.test(code)) {
                alert('Produto não encontrado com este código de barras.');
            }
            // Otherwise it might be a search term, let the effect handle it
        }
    };

    const handleCheckout = async (method: any, amountPaid: number, change: number, nfeData?: { cpf: string }) => {
        setLoading(true);
        try {
            const total = cart.reduce((sum, i) => sum + (i.priceAtPurchase * i.quantity), 0);
            let finalCustomerId = customer?.id;

            // Handle NFe Customer Logic
            if (nfeData?.cpf) {
                const cleanCpf = nfeData.cpf.replace(/\D/g, '');

                // If current customer has no CPF or different CPF, we need to check/create
                if (!customer || (customer.cpf && customer.cpf.replace(/\D/g, '') !== cleanCpf)) {
                    // Check if customer exists by CPF
                    const customers = await db.getCustomers(); // Ideally getCustomerByCpf
                    const existing = customers.find(c => c.cpf && c.cpf.replace(/\D/g, '') === cleanCpf);

                    if (existing) {
                        finalCustomerId = existing.id;
                    } else if (!customer) {
                        // Create quick customer only if no customer is currently selected
                        // If a customer IS selected but has no CPF, we should ideally update them, 
                        // but for now let's assume we create a new one or link if anonymous.
                        const newCustomer = await db.createCustomerQuick({
                            name: `Consumidor ${nfeData.cpf}`,
                            cpf: nfeData.cpf,
                            phone: '',
                            referrer: 'PDV'
                        });
                        finalCustomerId = newCustomer.id;
                    } else {
                        // Customer is selected but CPF is new/different -> Update customer CPF?
                        // For safety, let's just log it or update if empty.
                        if (!customer.cpf) {
                            await db.updateCustomer({ ...customer, cpf: nfeData.cpf });
                        }
                    }
                }
            }

            const order = await db.createPDVSale({
                customerId: finalCustomerId,
                totalAmount: total,
                paymentMethod: method,
                amountPaid,
                changeAmount: change
            }, cart);

            // Emit NFe if requested
            let invoice = undefined;
            if (nfeData) {
                try {
                    const payload = await buildFiscalPayload(order.id);
                    // Override CPF if provided explicitly
                    if (nfeData.cpf && payload.customer) {
                        payload.customer.cpf = nfeData.cpf;
                    }

                    invoice = await invoiceService.emitInvoice(order.id, payload);
                } catch (nfeError: any) {
                    console.error('NFe Error:', nfeError);
                    alert(`Venda salva, mas erro ao emitir NFe: ${nfeError.message}`);
                }
            }

            // Show Success Modal
            setSuccessData({ order, invoice });

            // Auto-print if enabled
            if (getAutoPrint()) {
                printOrder(order.id);
            }

            // Reset Cart (but keep customer until new sale logic if desired, or reset all)
            setCart([]);
            setCustomer(null);
            localStorage.removeItem('pdv_cart');
            localStorage.removeItem('pdv_customer');
            setShowPaymentModal(false);
        } catch (error) {
            console.error('Checkout error', error);
            alert(`Erro ao finalizar venda: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        } finally {
            setLoading(false);
        }
    };

    const handleFinalizeClick = () => {
        if (simulationMode) {
            // Just clear simulation
            setCart([]);
            setSimulationMode(false);
            return;
        }

        if (!customer) {
            setShowCustomerCheckModal(true);
        } else {
            setShowPaymentModal(true);
        }
    };

    const subtotal = cart.reduce((sum, i) => sum + ((i.originalPrice || i.priceAtPurchase) * i.quantity), 0);
    const totalDiscount = cart.reduce((sum, i) => sum + ((i.discountApplied || 0) * i.quantity), 0);
    const total = subtotal - totalDiscount;

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
            {/* Left Column: Product Search & Cart */}
            <div className="flex-1 flex flex-col p-4 pr-2 gap-4">
                {/* Search Bar */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 relative z-20">
                    <div className="flex items-center gap-3">
                        <Search className="text-gray-400" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Buscar produto (Nome, SKU, Código de Barras)..."
                            className="flex-1 text-lg outline-none font-medium text-gray-700 placeholder-gray-400"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    handleBarcodeScan(searchTerm);
                                }
                            }}
                            autoFocus
                        />
                    </div>

                    {/* Simulation Mode Toggle */}
                    <div className="mt-2 flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={simulationMode}
                                onChange={e => setSimulationMode(e.target.checked)}
                                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                            />
                            <span className={`text-sm font-bold ${simulationMode ? 'text-purple-600' : 'text-gray-500'}`}>
                                Modo Simulação / Pré-Venda
                            </span>
                        </label>
                    </div>

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden max-h-[60vh] overflow-y-auto">
                            {searchResults.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className="w-full p-4 hover:bg-blue-50 flex items-center gap-4 border-b border-gray-50 transition-colors text-left group"
                                >
                                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        {product.images?.[0] ? (
                                            <img src={product.images[0]} alt="" className="w-full h-full object-contain p-1" />
                                        ) : (
                                            <Package size={20} className="text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900 group-hover:text-blue-700">{product.name}</p>
                                        <p className="text-xs text-gray-500">{product.manufacturer} • {product.presentation}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg text-gray-900">R$ {product.price.toFixed(2)}</p>
                                        {product.stockTotal <= 0 && (
                                            <span className="text-xs text-red-500 font-bold bg-red-50 px-2 py-1 rounded-full">Sem Estoque</span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Cart Items */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h2 className="font-bold text-gray-700 flex items-center gap-2">
                            <ShoppingCart size={20} />
                            Carrinho de Compras
                        </h2>
                        <span className="text-sm font-medium text-gray-500">{cart.length} itens</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                                <ShoppingCart size={64} className="mb-4" />
                                <p className="text-lg font-medium">Carrinho vazio</p>
                                <p className="text-sm">Busque produtos para iniciar a venda</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.productId} className="flex items-center gap-4 p-3 bg-white border border-gray-100 rounded-xl hover:shadow-sm transition-all">
                                    <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt="" className="w-full h-full object-contain p-1" />
                                        ) : (
                                            <Package size={20} className="text-gray-400" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 truncate">{item.productName}</p>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-medium text-gray-900">R$ {item.priceAtPurchase.toFixed(2)}</span>
                                            {item.discountApplied && item.discountApplied > 0 && (
                                                <span className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded font-bold">
                                                    -{((item.discountApplied / (item.originalPrice || 1)) * 100).toFixed(0)}%
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                                        <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600">
                                            <Minus size={14} />
                                        </button>
                                        <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600">
                                            <Plus size={14} />
                                        </button>
                                    </div>

                                    <div className="text-right min-w-[80px]">
                                        <p className="font-bold text-gray-900">R$ {(item.priceAtPurchase * item.quantity).toFixed(2)}</p>
                                    </div>

                                    <button onClick={() => removeFromCart(item.productId)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Right Column: Customer & Checkout */}
            <div className="w-96 flex flex-col p-4 pl-2 gap-4">
                {/* Customer Panel */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="font-bold text-gray-700 flex items-center gap-2">
                            <User size={20} />
                            Cliente
                        </h2>
                    </div>

                    <div className="p-4">
                        {customer ? (
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                                        {customer.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{customer.name}</h3>
                                        <p className="text-sm text-gray-500">{customer.phone}</p>
                                        {customer.isVip && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full mt-1">
                                                <Tag size={10} /> VIP
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {customer.healthInsurancePlan && (
                                    <div className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-3">
                                        <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                            <CheckCircle size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-green-800 uppercase">Convênio Ativo</p>
                                            <p className="font-bold text-green-700">{customer.healthInsurancePlan.name}</p>
                                            <p className="text-xs text-green-600">{customer.healthInsurancePlan.discount_percent}% de desconto aplicado</p>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-xl">
                                    <div>
                                        <span className="block mb-0.5">Total Gasto</span>
                                        <span className="font-bold text-gray-900">R$ {customer.totalSpent?.toFixed(2) || '0.00'}</span>
                                    </div>
                                    <div>
                                        <span className="block mb-0.5">Última Compra</span>
                                        <span className="font-bold text-gray-900">
                                            {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : '-'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowEditCustomerModal(true)}
                                        className="flex-1 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <User size={16} /> Editar
                                    </button>
                                    <button
                                        onClick={() => setCustomer(null)}
                                        className="flex-1 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <LogOut size={16} /> Trocar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                                    <User size={32} />
                                </div>
                                <p className="text-gray-500 text-sm mb-4">Nenhum cliente identificado</p>
                                <button
                                    onClick={() => setShowCustomerModal(true)}
                                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                                >
                                    <UserPlus size={18} />
                                    Identificar Cliente
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Checkout Panel */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                    <div className="flex-1 p-6 space-y-4">
                        <div className="flex justify-between items-center text-gray-500">
                            <span>Subtotal</span>
                            <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
                        </div>

                        {totalDiscount > 0 && (
                            <div className="flex justify-between items-center text-green-600 bg-green-50 p-2 rounded-lg -mx-2">
                                <span className="flex items-center gap-1.5 font-medium">
                                    <Tag size={16} /> Descontos
                                </span>
                                <span className="font-bold">- R$ {totalDiscount.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="pt-4 border-t border-gray-100">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-lg font-bold text-gray-900">Total a Pagar</span>
                                <span className="text-3xl font-black text-gray-900">R$ {total.toFixed(2)}</span>
                            </div>
                            <p className="text-right text-xs text-gray-400">
                                {cart.length} itens
                            </p>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 border-t border-gray-100">
                        <button
                            disabled={cart.length === 0}
                            onClick={handleFinalizeClick}
                            className="w-full py-4 bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xl hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
                        >
                            <CreditCard size={24} />
                            {simulationMode ? 'Fechar Simulação' : 'Finalizar Venda'}
                        </button>

                        {simulationMode && role !== Role.OPERADOR && (
                            <button
                                disabled={cart.length === 0}
                                onClick={() => {
                                    if (confirm('Converter simulação em pedido real?')) {
                                        setSimulationMode(false);
                                        // Check for customer before payment
                                        if (!customer) {
                                            setShowCustomerCheckModal(true);
                                        } else {
                                            setShowPaymentModal(true);
                                        }
                                    }
                                }}
                                className="w-full py-3 bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 mt-3"
                            >
                                <RefreshCw size={20} />
                                Converter em Pedido
                            </button>
                        )}

                        {simulationMode && cart.length > 0 && (
                            <button
                                onClick={() => printSimulation(cart, total, customer)}
                                className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-300 transition-all flex items-center justify-center gap-2 mt-3"
                            >
                                <Printer size={20} />
                                Imprimir Simulação
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            {
                showCustomerModal && (
                    <CustomerIdentifyModal
                        onClose={() => setShowCustomerModal(false)}
                        onSelect={setCustomer}
                    />
                )
            }

            {
                showEditCustomerModal && customer && (
                    <CustomerEditModal
                        customer={customer}
                        onClose={() => setShowEditCustomerModal(false)}
                        onSave={(updated) => setCustomer(updated)}
                    />
                )
            }

            {
                showCustomerCheckModal && (
                    <CustomerCheckModal
                        onClose={() => setShowCustomerCheckModal(false)}
                        onIdentify={() => {
                            setShowCustomerCheckModal(false);
                            setShowCustomerModal(true);
                        }}
                        onContinueWithoutCustomer={() => {
                            setShowCustomerCheckModal(false);
                            setShowPaymentModal(true);
                        }}
                    />
                )
            }

            {
                showPaymentModal && (
                    <PaymentModal
                        total={total}
                        customer={customer}
                        onClose={() => setShowPaymentModal(false)}
                        onConfirm={handleCheckout}
                    />
                )
            }
            {
                successData && (
                    <CheckoutSuccessModal
                        order={successData.order}
                        invoice={successData.invoice}
                        onClose={() => setSuccessData(null)}
                        onNewSale={() => {
                            setSuccessData(null);
                            searchInputRef.current?.focus();
                        }}
                    />
                )
            }
        </div >
    );
};
