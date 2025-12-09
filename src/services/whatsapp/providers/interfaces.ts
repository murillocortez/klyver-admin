export interface IWhatsappProvider {
    sendMessage(phone: string, message: string): Promise<boolean>;
    // Future support for templates
    // sendTemplateMessage(phone: string, templateId: string, parameters?: any): Promise<boolean>;
    // getStatus?(): Promise<'connected' | 'disconnected'>;
}

export type WhatsappProviderConfig = {
    provider: 'evolution_api' | 'ultramsg' | 'whatsapp_business' | 'simulated';
    baseUrl?: string;
    token?: string;
    instanceName?: string;
    number?: string;
};
