import axios from 'axios';

interface BrasilApiCnpjResponse {
    cnpj: string;
    razao_social: string;
    nome_fantasia: string;
    descricao_situacao_cadastral: string;
    cnae_fiscal_descricao: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cep: string;
    uf: string;
    municipio: string;
    ddd_telefone_1: string;
}

export const brasilApiService = {
    async getCnpj(cnpj: string): Promise<BrasilApiCnpjResponse | null> {
        try {
            const cleanCnpj = cnpj.replace(/\D/g, '');
            if (cleanCnpj.length !== 14) return null;

            const response = await axios.get(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
            return response.data;
        } catch (error) {
            console.error('BrasilAPI Error:', error);
            return null;
        }
    }
};
