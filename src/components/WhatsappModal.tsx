import React, { useState } from 'react';
import { Send, X, MessageSquare, AlertCircle } from 'lucide-react';
import { Order } from '../types';
import { whatsappService } from '../services/whatsappService';

interface WhatsappModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order;
}

export const WhatsappModal: React.FC<WhatsappModalProps> = ({ isOpen, onClose, order }) => {
    const defaultMessage = `Olá ${order.customerName.split(' ')[0]}, aqui é da Farma Vida! 🏥\n\n` +
        `Estamos entrando em contato sobre seu pedido #${order.displayId || order.id.slice(0, 4)}.\n` +
        `Status atual: ${order.status}.\n\n` +
        `Qualquer dúvida, estamos à disposição!`;

    const [message, setMessage] = useState(defaultMessage);
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSend = async () => {
        setSending(true);
        setError(null);
        try {
            const success = await whatsappService.sendWhatsappMessage(
                order.customerPhone,
                message,
                { orderId: order.id, customerId: order.customerId }
            );

            if (success) {
                setSent(true);
                setTimeout(() => {
                    setSent(false);
                    onClose();
                }, 2000);
            } else {
                setError('Falha ao enviar mensagem. Verifique os logs.');
            }
        } catch (err: any) {
            setError(err.message || 'Erro desconhecido');
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="bg-green-600 p-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 text-white">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
                            <MessageSquare size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Enviar WhatsApp</h3>
                            <p className="text-green-100 text-sm">Para: {order.customerName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold shrink-0">
                            {whatsappService.formatCustomerPhone(order.customerPhone).slice(2, 4)}
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-gray-500 uppercase">Número do Cliente</p>
                            <p className="text-gray-900 font-mono font-medium">{whatsappService.formatCustomerPhone(order.customerPhone)}</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                            Mensagem
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={8}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none resize-none text-sm leading-relaxed"
                            placeholder="Digite sua mensagem..."
                        />
                        <div className="flex justify-end mt-2">
                            <span className="text-xs text-gray-400">{message.length} caracteres</span>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm flex items-start gap-2">
                            <AlertCircle size={18} className="shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}

                    {sent ? (
                        <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 text-center font-bold animate-in bounce-in duration-300">
                            Mensagem enviada com sucesso!
                        </div>
                    ) : (
                        <button
                            onClick={handleSend}
                            disabled={sending || !message.trim()}
                            className="w-full py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-600/25 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {sending ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send size={20} />
                            )}
                            Enviar Mensagem
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
