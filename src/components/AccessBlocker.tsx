import React, { useState } from 'react';
import { AlertTriangle, Lock, CreditCard, LifeBuoy, X, CheckCircle } from 'lucide-react';
import { supabase } from '../services/supabase'; // Ensure this points to correct Supabase client in Admin

interface AccessBlockerProps {
    tenant: any;
    reason?: string;
}

export const AccessBlocker: React.FC<AccessBlockerProps> = ({ tenant, reason }) => {
    const [isSupportOpen, setIsSupportOpen] = useState(false);

    const handleRenovate = () => {
        // Redirect to Klyver Master Checkout
        // Ideally this URL comes from env or calculated
        const masterUrl = import.meta.env.VITE_MASTER_URL || 'http://localhost:5175';
        // Port 5173 is usually Store or Master? User said: master on 517?, admin on 5174, store on 5173?
        // User metadata: Store (5173), Admin (5174), Master (5175).
        // I will default to 5175 for Master based on previous knowledge or use relative if known.
        // Actually, best to put in .env. Falling back to localhost:5175 for dev.

        const checkoutUrl = `${masterUrl}/billing/checkout?tenantId=${tenant.id}&planId=${tenant.plan_id}&reason=block`;
        window.location.href = checkoutUrl;
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden text-center animate-in zoom-in duration-300">
                <div className="bg-red-50 p-8 flex flex-col items-center border-b border-red-100">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Acesso Temporariamente Bloqueado</h2>
                    <p className="text-slate-600 mt-2 max-w-sm mx-auto">
                        Identificamos uma pendência na assinatura da <strong>{tenant.display_name}</strong>.
                    </p>
                </div>

                <div className="p-8 space-y-4">
                    {reason && (
                        <div className="bg-orange-50 text-orange-800 text-sm p-3 rounded-lg border border-orange-100 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            {reason}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-left">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Plano Atual</span>
                            <div className="text-slate-900 font-semibold mt-1">{tenant.plan_code || 'N/A'}</div>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Status</span>
                            <div className="text-red-600 font-bold mt-1 uppercase">{tenant.status}</div>
                        </div>
                    </div>

                    <div className="pt-4 space-y-3">
                        <button
                            onClick={handleRenovate}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center transition-all shadow-md hover:shadow-lg transform active:scale-95"
                        >
                            <CreditCard className="w-5 h-5 mr-2" />
                            Renovar Assinatura Agora
                        </button>

                        <button
                            onClick={() => setIsSupportOpen(true)}
                            className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center transition-all mt-3"
                        >
                            <LifeBuoy className="w-5 h-5 mr-2" />
                            Falar com Suporte
                        </button>

                        <button
                            onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
                            className="w-full text-slate-400 hover:text-slate-600 font-medium py-2 text-sm transition-colors"
                        >
                            Sair da conta e tentar outro usuário
                        </button>
                    </div>
                </div>

                {
                    isSupportOpen && (
                        <SupportModal
                            tenant={tenant}
                            onClose={() => setIsSupportOpen(false)}
                        />
                    )
                }
            </div>
        </div>
    );
};

// Internal Support Modal Component
const SupportModal: React.FC<{ tenant: any; onClose: () => void }> = ({ tenant, onClose }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        try {
            // Create ticket in Master's support_tickets table
            // Ideally use a service, but calling supabase directly here to save time
            const { error } = await (supabase as any).from('support_tickets').insert({
                tenant_id: tenant.id,
                origin: 'billing_block',
                subject: 'Bloqueio de Assinatura - ' + tenant.display_name,
                message: message,
                contact_name: name,
                contact_email: email,
                status: 'open',
                metadata: {
                    plan: tenant.plan_code,
                    status: tenant.status
                }
            });

            if (error) throw error;
            setSent(true);
        } catch (err) {
            console.error(err);
            alert('Erro ao enviar ticket. Tente novamente.');
        } finally {
            setSending(false);
        }
    };

    if (sent) {
        return (
            <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-xl max-w-md w-full p-8 text-center animate-in zoom-in">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Solicitação Enviada!</h3>
                    <p className="text-slate-500 mt-2 mb-6">Nossa equipe de suporte financeiro entrará em contato em breve pelo email informado.</p>
                    <button onClick={onClose} className="w-full bg-slate-900 text-white font-medium py-3 rounded-lg">
                        Fechar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-900">Falar com Suporte Financeiro</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Seu Nome</label>
                        <input required value={name} onChange={e => setName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ex: João Silva" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Seu E-mail</label>
                        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ex: joao@farmacia.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem</label>
                        <textarea required value={message} onChange={e => setMessage(e.target.value)} rows={3} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none" placeholder="Explique sua dúvida ou problema..." />
                    </div>
                    <button disabled={sending} type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg transition-colors flex justify-center">
                        {sending ? 'Enviando...' : 'Enviar Solicitação'}
                    </button>
                </form>
            </div>
        </div>
    );
};
