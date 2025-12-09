import { IWhatsappProvider, WhatsappProviderConfig } from './interfaces';

export class UltramsgProvider implements IWhatsappProvider {
    private apiUrl: string;
    private token: string;

    constructor(config: WhatsappProviderConfig) {
        if (!config.baseUrl || !config.token || !config.instanceName) {
            throw new Error('Configuração incompleta para UltraMsg');
        }
        // Construct API URL: https://api.ultramsg.com/instance1234
        // Users might provide baseUrl as "https://api.ultramsg.com" and instance as "instance1234"
        const base = config.baseUrl.replace(/\/$/, '');
        this.apiUrl = `${base}/${config.instanceName}`;
        this.token = config.token;
    }

    async sendMessage(phone: string, message: string): Promise<boolean> {
        try {
            const url = `${this.apiUrl}/messages/chat`;

            const body = {
                token: this.token,
                to: phone,
                body: message
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                console.error('[UltraMsg] Error:', await response.text());
                return false;
            }

            return true;
        } catch (error) {
            console.error('[UltraMsg] Falha ao enviar:', error);
            throw error;
        }
    }
}
