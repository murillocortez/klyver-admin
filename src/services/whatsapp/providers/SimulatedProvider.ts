import { IWhatsappProvider } from './interfaces';

export class SimulatedProvider implements IWhatsappProvider {
    async sendMessage(phone: string, message: string): Promise<boolean> {
        console.group('🔔 [WhatsApp Simulado]');
        console.log('Para:', phone);
        console.log('Mensagem:', message);
        console.groupEnd();

        // Dispatch event for UI Toast
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('whatsapp-notification', {
                detail: {
                    type: 'success',
                    message: `Mensagem enviada para ${phone} (Simulado)`
                }
            }));
        }

        return true;
    }
}
