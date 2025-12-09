export const govBrService = {
    async importDataStub(): Promise<{
        name: string;
        birthdate: string;
        email: string;
        phone: string;
        cpf: string;
    }> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        return {
            name: "Nome do Cliente Gov.br",
            birthdate: "1991-06-12",
            email: "cliente@gov.br",
            phone: "(11) 99999-9999",
            cpf: "123.456.789-00"
        };
    }
};
