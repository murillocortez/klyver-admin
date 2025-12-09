import { db } from './dbService';
import { supabase } from './supabase';
import { SupportTicket } from '../types';

// Mock de FAQs por enquanto, idealmente viriam do banco
export const FAQ_ARTICLES = [
    {
        id: '1',
        category: 'Produtos',
        title: 'Como cadastrar um novo produto?',
        description: 'Aprenda a cadastrar medicamentos e produtos de perfumaria.',
        steps: [
            'Acesse o menu "Produtos".',
            'Clique no botão "Novo Produto" no canto superior direito.',
            'Preencha as informações obrigatórias (Nome, Código de Barras, Preço).',
            'Selecione a categoria correta.',
            'Clique em "Salvar".'
        ],
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' // Exemplo
    },
    {
        id: '2',
        category: 'CRM e Cashback',
        title: 'Como configurar a validade do Cashback?',
        description: 'Defina quanto tempo os créditos dos clientes são válidos.',
        steps: [
            'Vá em Configurações > Cashback.',
            'Procure o campo "Dias de Validade".',
            'Insira a quantidade de dias desejada (ex: 30 dias).',
            'Clique em "Salvar Alterações".'
        ]
    },
    {
        id: '3',
        category: 'Pedidos',
        title: 'O que fazer quando um pagamento dá erro?',
        description: 'Resolução de problemas comuns com cartão de crédito.',
        steps: [
            'Verifique se a internet da maquininha está conectada.',
            'Confira se o cliente digitou a senha corretamente.',
            'Peça para tentar outro cartão.',
            'Se o erro persistir, entre em contato com o suporte da operadora de cartão.'
        ]
    },
    {
        id: '4',
        category: 'Fiscal',
        title: 'Como emitir nota fiscal (NFC-e)?',
        description: 'Passo a passo para emissão de cupom fiscal.',
        steps: [
            'Ao finalizar uma venda no PDV, selecione "Finalizar e Emitir NFC-e".',
            'Aguarde a comunicação com a SEFAZ.',
            'Se aprovado, a impressão será automática.',
            'Se rejeitado, verifique o motivo na tela de erros.'
        ]
    },
    {
        id: '5',
        category: 'WhatsApp',
        title: 'Como conectar a API do WhatsApp?',
        description: 'Conecte seu número para envio automático de mensagens.',
        steps: [
            'Acesse Configurações > Notificações.',
            'Habilite "Notificações Automáticas".',
            'Escaneie o QR Code gerado com seu celular.',
            'Aguarde a confirmação de "Conectado".'
        ]
    }
];

export const supportService = {
    // Buscar Tickets (User vê os seus/da loja)
    async getTickets(): Promise<SupportTicket[]> {
        // Cast supabase to any
        // @ts-ignore
        const { data, error } = await (supabase as any)
            .from('support_tickets')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as SupportTicket[];
    },

    // Criar Ticket
    async createTicket(ticket: Omit<SupportTicket, 'id' | 'created_at' | 'updated_at' | 'tenant_id' | 'status'>): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();

        // @ts-ignore
        const { error } = await (supabase as any)
            .from('support_tickets')
            .insert({
                ...ticket,
                user_id: user?.id,
                status: 'open'
            });

        if (error) throw error;
    },

    // Mock de busca de FAQs (Simulação IA)
    async searchFAQs(query: string) {
        // Simular delay
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!query) return FAQ_ARTICLES;

        const lowerQuery = query.toLowerCase();
        return FAQ_ARTICLES.filter(article =>
            article.title.toLowerCase().includes(lowerQuery) ||
            article.description.toLowerCase().includes(lowerQuery) ||
            article.category.toLowerCase().includes(lowerQuery)
        );
    }
};
