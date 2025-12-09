import { IWhatsappProvider, WhatsappProviderConfig } from './interfaces';

export class EvolutionProvider implements IWhatsappProvider {
    private baseUrl: string;
    private token: string;
    private instanceName: string;

    constructor(config: WhatsappProviderConfig) {
        if (!config.baseUrl || !config.token || !config.instanceName) {
            throw new Error('Configuração incompleta para Evolution API (URL, Token e Instância obrigatórios)');
        }
        this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.token = config.token;
        this.instanceName = config.instanceName;
    }

    async sendMessage(phone: string, message: string): Promise<boolean> {
        try {
            const url = `${this.baseUrl}/message/sendText/${this.instanceName}`;

            const body = {
                number: phone,
                text: message,
                linkPreview: false
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.token
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('[Evolution API] Error:', errorData);
                throw new Error(`Erro API: ${response.statusText}`);
            }

            const data = await response.json();
            // Evolution usually returns { key: {...} } or status
            return true;
        } catch (error) {
            console.error('[Evolution API] Falha ao enviar:', error);
            throw error;
        }
    }
}
