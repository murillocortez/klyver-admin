import React, { useState, useEffect } from 'react';
import { X, CreditCard, Banknote, QrCode, DollarSign, CheckCircle } from 'lucide-react';

import { Customer } from '../../types';

interface PaymentModalProps {
    total: number;
    customer?: Customer | null;
    onClose: () => void;
    onConfirm: (method: 'credit_card' | 'debit_card' | 'money' | 'pix', amountPaid: number, change: number, nfeData?: { cpf: string }) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ total, customer, onClose, onConfirm }) => {
    const [method, setMethod] = useState<'credit_card' | 'debit_card' | 'money' | 'pix'>('money');
    const [amountPaid, setAmountPaid] = useState<string>('');
    const [change, setChange] = useState(0);
    const [wantNfe, setWantNfe] = useState(false);
    const [cpfCnpj, setCpfCnpj] = useState('');

    // Pre-fill CPF if customer is identified
    useEffect(() => {
        if (customer?.cpf) {
            setCpfCnpj(customer.cpf);
            setWantNfe(true);
        }
    }, [customer]);

    // Calculate change
    useEffect(() => {
        if (method === 'money' && amountPaid) {
            const paid = parseFloat(amountPaid);
            setChange(Math.max(0, paid - total));
        } else {
            setChange(0);
        }
    }, [amountPaid, method, total]);

    // Handle Enter key to confirm
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'Enter') {
                // Prevent default to avoid double submissions if focus is on button
                e.preventDefault();
                handleConfirm();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [method, amountPaid, change, wantNfe, cpfCnpj]);

    const handleConfirm = () => {
        if (wantNfe && cpfCnpj.replace(/\D/g, '').length < 11) {
            alert('Por favor, informe um CPF ou CNPJ válido para emitir a nota.');
            return;
        }
        const paid = method === 'money' ? parseFloat(amountPaid) || total : total;
        onConfirm(method, paid, change, wantNfe ? { cpf: cpfCnpj } : undefined);
    };

    const methods = [
        { id: 'money', label: 'Dinheiro', icon: Banknote, color: 'text-green-600', bg: 'bg-green-50' },
        { id: 'credit_card', label: 'Crédito', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
        { id: 'debit_card', label: 'Débito', icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-50' },
        { id: 'pix', label: 'PIX', icon: QrCode, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-900">Finalizar Venda</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="text-center mb-6">
                        <p className="text-sm text-gray-500 font-medium uppercase tracking-wide">Total a Pagar</p>
                        <h3 className="text-4xl font-black text-gray-900 mt-1">
                            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {methods.map(m => (
                            <button
                                key={m.id}
                                onClick={() => setMethod(m.id as any)}
                                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                  ${method === m.id ? `border-${m.color.split('-')[1]}-500 ${m.bg}` : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'}`}
                            >
                                <m.icon className={method === m.id ? m.color : 'text-gray-400'} size={24} />
                                <span className={`font-bold ${method === m.id ? 'text-gray-900' : 'text-gray-500'}`}>{m.label}</span>
                            </button>
                        ))}
                    </div>

                    {method === 'money' && (
                        <div className="bg-gray-50 p-4 rounded-xl space-y-4 border border-gray-100">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor Recebido</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        autoFocus
                                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-green-500/20 outline-none font-bold text-lg"
                                        value={amountPaid}
                                        onChange={e => setAmountPaid(e.target.value)}
                                        placeholder={total.toFixed(2)}
                                    />
                                </div>
                            </div>

                            {change > 0 && (
                                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                    <span className="font-bold text-gray-500">Troco</span>
                                    <span className="font-black text-xl text-green-600">R$ {change.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* NFe Section */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={wantNfe}
                                onChange={e => setWantNfe(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="font-bold text-gray-700">Emitir Nota Fiscal (NFe/NFCe)</span>
                        </label>

                        {wantNfe && (
                            <div className="animate-in slide-in-from-top-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CPF / CNPJ na Nota *</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    placeholder="000.000.000-00"
                                    value={cpfCnpj}
                                    onChange={e => {
                                        let v = e.target.value.replace(/\D/g, '');
                                        if (v.length > 14) v = v.slice(0, 14);

                                        if (v.length > 11) {
                                            // CNPJ Mask
                                            v = v.replace(/^(\d{2})(\d)/, '$1.$2');
                                            v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                                            v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
                                            v = v.replace(/(\d{4})(\d)/, '$1-$2');
                                        } else {
                                            // CPF Mask
                                            v = v.replace(/(\d{3})(\d)/, '$1.$2');
                                            v = v.replace(/(\d{3})(\d)/, '$1.$2');
                                            v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                                        }
                                        setCpfCnpj(v);
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => {
                            if (wantNfe && cpfCnpj.replace(/\D/g, '').length < 11) {
                                alert('Por favor, informe um CPF ou CNPJ válido para emitir a nota.');
                                return;
                            }
                            handleConfirm();
                        }}
                        className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={24} />
                        Confirmar Pagamento
                    </button>
                </div>
            </div>
        </div>
    );
};
