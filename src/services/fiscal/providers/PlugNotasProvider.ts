import { FiscalProvider, FiscalResult, InvoicePayload } from '../types';

export class PlugNotasProvider implements FiscalProvider {
    private apiKey: string;
    private companyId: string;

    constructor(apiKey: string, companyId: string) {
        this.apiKey = apiKey;
        this.companyId = companyId;
    }

    async emit(payload: InvoicePayload): Promise<FiscalResult> {
        // TODO: Implement PlugNotas API integration
        // POST https://api.plugnotas.com.br/nfe
        console.log('PlugNotas emit not implemented yet', payload);
        throw new Error('PlugNotas integration not implemented');
    }

    async getStatus(providerId: string): Promise<FiscalResult> {
        // TODO: Implement PlugNotas API integration
        // GET https://api.plugnotas.com.br/nfe/{id}
        throw new Error('PlugNotas integration not implemented');
    }

    async cancel(providerId: string, reason?: string): Promise<FiscalResult> {
        // TODO: Implement PlugNotas API integration
        // POST https://api.plugnotas.com.br/nfe/{id}/cancel
        throw new Error('PlugNotas integration not implemented');
    }
}
