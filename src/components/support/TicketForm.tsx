import React, { useState } from 'react';
import { Send, AlertCircle, RefreshCw } from 'lucide-react';
import { supportService } from '../../services/supportService';

export const TicketForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        requester_name: '',
        requester_phone: '',
        subject: '',
        message: '',
        urgency: 'medium' as 'low' | 'medium' | 'high'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await supportService.createTicket({
                requester_name: formData.requester_name,
                requester_phone: formData.requester_phone,
                subject: formData.subject || 'Sem Assunto',
                message: formData.message,
                urgency: formData.urgency
            });

            // Simulate delay for better UX
            await new Promise(resolve => setTimeout(resolve, 800));

            alert('Seu chamado foi registrado. Aguarde retorno.');
            setFormData({ requester_name: '', requester_phone: '', subject: '', message: '', urgency: 'medium' });
            onSuccess();
        } catch (error) {
            console.error(error);
            alert('Erro ao enviar ticket.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <AlertCircle className="text-blue-600" size={20} />
                Abrir Chamado
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">Nome do Responsável</label>
                    <input
                        type="text"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        value={formData.requester_name}
                        onChange={e => setFormData({ ...formData, requester_name: e.target.value })}
                        placeholder="Ex: João da Silva"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">Telefone / WhatsApp</label>
                    <input
                        type="text"
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        value={formData.requester_phone}
                        onChange={e => setFormData({ ...formData, requester_phone: e.target.value })}
                        placeholder="(00) 00000-0000"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">Assunto Resumido</label>
                <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="Ex: Erro ao emitir nota fiscal"
                />
            </div>

            <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">Descrição Detalhada</label>
                <textarea
                    required
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Explique o que aconteceu, mensagens de erro, etc..."
                />
            </div>

            <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">Nível de Urgência</label>
                <div className="flex gap-4">
                    {[
                        { value: 'low', label: 'Baixa', color: 'bg-green-50 text-green-700 border-green-200' },
                        { value: 'medium', label: 'Média', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                        { value: 'high', label: 'Alta', color: 'bg-red-50 text-red-700 border-red-200' }
                    ].map(opt => (
                        <label key={opt.value} className={`flex-1 cursor-pointer border rounded-xl p-3 flex items-center justify-center gap-2 transition-all ${formData.urgency === opt.value ? `ring-2 ring-blue-500 ${opt.color}` : 'bg-white border-gray-200 opacity-60 hover:opacity-100 check'}`}>
                            <input
                                type="radio"
                                name="urgency"
                                value={opt.value}
                                checked={formData.urgency === opt.value}
                                onChange={() => setFormData({ ...formData, urgency: opt.value as any })}
                                className="sr-only"
                            />
                            <span className="font-bold text-sm">{opt.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="pt-4 flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed w-full md:w-auto justify-center"
                >
                    {loading ? <RefreshCw className="animate-spin" size={20} /> : <Send size={20} />}
                    <span>{loading ? 'Enviando...' : 'Enviar Ticket'}</span>
                </button>
            </div>
        </form>
    );
};
