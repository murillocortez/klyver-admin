import React, { useRef } from 'react';
import { CheckCircle, Download, FileText, ShoppingBag, X, Printer, Share2 } from 'lucide-react';
import { Order } from '../../types';

interface CheckoutSuccessModalProps {
    order: Order;
    invoice?: any;
    onClose: () => void;
    onNewSale: () => void;
}

export const CheckoutSuccessModal: React.FC<CheckoutSuccessModalProps> = ({ order, invoice, onClose, onNewSale }) => {
    const receiptRef = useRef<HTMLDivElement>(null);

    const whatsappLink = `https://wa.me/${order.customerPhone?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(
        `Olá ${order.customerName}, seu pedido #${order.displayId} foi confirmado! Confira o recibo digital.`
    )}`;

    const handlePrint = () => {
        const content = receiptRef.current;
        if (content) {
            const printWindow = window.open('', '', 'height=600,width=400');
            if (printWindow) {
                printWindow.document.write('<html><head><title>Cupom Fiscal</title>');
                printWindow.document.write('<style>body { font-family: monospace; font-size: 12px; } .text-center { text-align: center; } .flex { display: flex; } .justify-between { justify-content: space-between; } .font-bold { font-weight: bold; } .border-t { border-top: 1px dashed #000; } .border-b { border-bottom: 1px dashed #000; } .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; } .mb-2 { margin-bottom: 0.5rem; } </style>');
                printWindow.document.write('</head><body>');
                printWindow.document.write(content.innerHTML);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.print();
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="p-8 text-center">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-600/20">
                        <CheckCircle size={40} strokeWidth={3} />
                    </div>

                    <div className="flex flex-col items-center gap-2 mb-2">
                        <h2 className="text-2xl font-black text-gray-900">Venda Finalizada!</h2>
                        {invoice ? (
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200 flex items-center gap-1">
                                <FileText size={12} /> NOTA FISCAL EMITIDA
                            </span>
                        ) : (
                            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200 flex items-center gap-1">
                                <ShoppingBag size={12} /> VENDA SIMPLES (SEM NOTA)
                            </span>
                        )}
                    </div>

                    {/* Electronic Receipt Preview */}
                    <div className="bg-yellow-50/50 border border-yellow-100 rounded-xl p-4 mb-6 text-left font-mono text-sm shadow-sm max-h-[300px] overflow-y-auto" ref={receiptRef}>
                        <div className="text-center mb-4">
                            <h3 className="font-bold text-lg uppercase">Farma Vida</h3>
                            <p className="text-xs text-gray-500">CNPJ: 00.000.000/0001-00</p>
                            <p className="text-xs text-gray-500">Rua Exemplo, 123 - Centro</p>
                            <p className="text-xs text-gray-500">Tel: (11) 99999-9999</p>
                        </div>

                        <div className="border-b border-dashed border-gray-300 mb-2 pb-2 text-center">
                            <p className="font-bold text-lg">
                                {invoice ? 'EXTRATO DE VENDA (SAT/NFC-e)' : 'CUPOM NÃO FISCAL'}
                            </p>
                            <p className="text-xs">Pedido #{order.displayId} - {new Date(order.createdAt).toLocaleString()}</p>
                            {invoice && (
                                <div className="mt-1">
                                    <p className="text-[10px] font-bold">CHAVE DE ACESSO:</p>
                                    <p className="text-[10px] break-all">{invoice.access_key || '0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000'}</p>
                                    <p className="text-[10px] mt-1">Consulte pela Chave de Acesso em:</p>
                                    <p className="text-[10px]">www.nfe.fazenda.gov.br/portal</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2 mb-4">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <p className="font-bold truncate">{item.productName}</p>
                                        <p className="text-xs text-gray-500">
                                            {item.quantity} x R$ {item.priceAtPurchase.toFixed(2)}
                                            {(item.discountApplied ?? 0) > 0 && ` (-R$ ${(item.discountApplied ?? 0).toFixed(2)})`}
                                        </p>
                                    </div>
                                    <p className="font-bold">R$ {(item.quantity * item.priceAtPurchase).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-dashed border-gray-300 pt-2 space-y-1 text-right">
                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>R$ {(order.totalAmount + (order.discountAmount || 0)).toFixed(2)}</span>
                            </div>
                            {(order.discountAmount ?? 0) > 0 && (
                                <div className="flex justify-between text-green-600 font-bold">
                                    <span>Descontos:</span>
                                    <span>- R$ {(order.discountAmount ?? 0).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-lg font-black mt-2">
                                <span>TOTAL:</span>
                                <span>R$ {order.totalAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="border-t border-dashed border-gray-300 pt-2 mt-2 text-xs">
                            <div className="flex justify-between">
                                <span>Pagamento ({order.paymentMethod}):</span>
                                <span>R$ {order.amountPaid?.toFixed(2)}</span>
                            </div>
                            {(order.changeAmount ?? 0) > 0 && (
                                <div className="flex justify-between">
                                    <span>Troco:</span>
                                    <span>R$ {(order.changeAmount ?? 0).toFixed(2)}</span>
                                </div>
                            )}
                        </div>

                        {order.customerName && (
                            <div className="border-t border-dashed border-gray-300 pt-2 mt-2 text-center text-xs">
                                <p>Cliente: {order.customerName}</p>
                                {order.customerCpf && <p>CPF: {order.customerCpf}</p>}
                            </div>
                        )}

                        <div className="mt-4 text-center text-xs text-gray-400">
                            <p>Obrigado pela preferência!</p>
                            <p>Volte sempre.</p>
                        </div>
                    </div>

                    <div className="flex gap-2 mb-6 justify-center">
                        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold text-gray-700 transition-colors">
                            <Printer size={16} /> Imprimir
                        </button>
                    </div>

                    {invoice && (
                        <div className="bg-gray-50 rounded-xl p-4 mb-8 border border-gray-100">
                            <h3 className="font-bold text-gray-900 flex items-center justify-center gap-2 mb-4">
                                <FileText size={18} className="text-blue-600" />
                                Nota Fiscal Emitida
                            </h3>

                            <div className="grid grid-cols-2 gap-3">
                                {invoice.pdf_url && (
                                    <a
                                        href={invoice.pdf_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all group"
                                    >
                                        <Download size={24} className="text-gray-400 group-hover:text-blue-600" />
                                        <span className="text-xs font-bold">Baixar PDF</span>
                                    </a>
                                )}
                                {invoice.xml_url && (
                                    <a
                                        href={invoice.xml_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex flex-col items-center justify-center gap-2 p-3 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all group"
                                    >
                                        <FileText size={24} className="text-gray-400 group-hover:text-blue-600" />
                                        <span className="text-xs font-bold">Ver XML</span>
                                    </a>
                                )}
                            </div>

                            <a
                                href={whatsappLink}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-4 w-full py-3 bg-[#25D366] text-white rounded-xl font-bold hover:bg-[#128C7E] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20"
                            >
                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                Enviar no WhatsApp
                            </a>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            Fechar
                        </button>
                        <button
                            onClick={onNewSale}
                            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                        >
                            <ShoppingBag size={18} />
                            Nova Venda
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
