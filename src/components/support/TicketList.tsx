import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle, AlertOctagon, MoreHorizontal } from 'lucide-react';
import { supportService } from '../../services/supportService';
import { SupportTicket } from '../../types';

const StatusBadge = ({ status }: { status: string }) => {
    const config = {
        open: { color: 'bg-blue-50 text-blue-700', icon: Clock, label: 'Aberto' },
        pending: { color: 'bg-yellow-50 text-yellow-700', icon: Clock, label: 'Pendente' },
        answered: { color: 'bg-green-50 text-green-700', icon: CheckCircle, label: 'Respondido' },
        closed: { color: 'bg-gray-100 text-gray-500', icon: CheckCircle, label: 'Fechado' }
    };
    const { color, icon: Icon, label } = config[status as keyof typeof config] || config.open;

    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${color}`}>
            <Icon size={12} />
            {label}
        </span>
    );
};

export const TicketList: React.FC<{ refreshTrigger: number }> = ({ refreshTrigger }) => {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTickets();
    }, [refreshTrigger]);

    const loadTickets = async () => {
        setLoading(true);
        try {
            const data = await supportService.getTickets();
            setTickets(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Carregando histórico...</div>;

    if (tickets.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200 border-dashed">
                <p className="text-gray-400 font-medium">Você ainda não abriu nenhum chamado.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">ID / Assunto</th>
                            <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Criado em</th>
                            <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Urgência</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {tickets.map(ticket => (
                            <tr key={ticket.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900 text-sm">{ticket.subject || 'Sem Assunto'}</span>
                                        <span className="text-xs text-gray-400 font-mono">#{ticket.id.substring(0, 8)}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={ticket.status} />
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {new Date(ticket.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-xs font-bold uppercase ${ticket.urgency === 'high' ? 'text-red-500' :
                                            ticket.urgency === 'medium' ? 'text-yellow-600' : 'text-green-600'
                                        }`}>
                                        {ticket.urgency === 'low' ? 'Baixa' : ticket.urgency === 'medium' ? 'Média' : 'Alta'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
