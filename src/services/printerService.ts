import { Order } from '../types';
import { db } from './dbService';

export interface PrinterConfig {
    name: string;
    type: 'thermal' | 'laser' | 'inkjet';
    width: '80mm' | 'A4';
}

const STORAGE_KEYS = {
    NAME: 'fv_selected_printer_name',
    TYPE: 'fv_selected_printer_type',
    WIDTH: 'fv_selected_printer_width',
    AUTO_PRINT: 'fv_print_automatic'
};

export const getSelectedPrinter = (): PrinterConfig => {
    return {
        name: localStorage.getItem(STORAGE_KEYS.NAME) || 'Padrão do Sistema',
        type: (localStorage.getItem(STORAGE_KEYS.TYPE) as PrinterConfig['type']) || 'thermal',
        width: (localStorage.getItem(STORAGE_KEYS.WIDTH) as PrinterConfig['width']) || '80mm'
    };
};

export const saveSelectedPrinter = (config: PrinterConfig) => {
    localStorage.setItem(STORAGE_KEYS.NAME, config.name);
    localStorage.setItem(STORAGE_KEYS.TYPE, config.type);
    localStorage.setItem(STORAGE_KEYS.WIDTH, config.width);
};

export const setAutoPrint = (enabled: boolean) => {
    localStorage.setItem(STORAGE_KEYS.AUTO_PRINT, String(enabled));
};

export const getAutoPrint = (): boolean => {
    return localStorage.getItem(STORAGE_KEYS.AUTO_PRINT) === 'true';
};

export const generateThermalHTML = async (order: Order) => {
    const settings = await db.getSettings();
    const date = new Date(order.createdAt).toLocaleString('pt-BR');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Cupom #${order.displayId}</title>
        <style>
            @page { margin: 0; size: 80mm auto; }
            body { 
                font-family: 'Courier New', monospace; 
                width: 72mm; 
                margin: 0 auto; 
                padding: 10px 0;
                font-size: 12px;
                line-height: 1.2;
                color: black;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .border-b { border-bottom: 1px dashed #000; margin: 5px 0; padding-bottom: 5px; }
            .border-t { border-top: 1px dashed #000; margin: 5px 0; padding-top: 5px; }
            .flex { display: flex; justify-content: space-between; }
            .item-row { margin-bottom: 3px; }
            .item-name { font-weight: bold; display: block; }
            .item-details { display: flex; justify-content: space-between; font-size: 11px; }
            .total-row { font-size: 14px; font-weight: bold; margin-top: 5px; }
            .footer { margin-top: 15px; font-size: 10px; text-align: center; }
        </style>
    </head>
    <body>
        <div class="text-center">
            <div class="font-bold" style="font-size: 16px;">${settings.pharmacy.name}</div>
            <div>${settings.pharmacy.address}</div>
            <div>CNPJ: ${settings.pharmacy.cnpj}</div>
            <div>Tel: ${settings.pharmacy.phone}</div>
        </div>

        <div class="border-b"></div>

        <div class="text-center">
            <div class="font-bold">CUPOM NÃO FISCAL</div>
            <div>Pedido: #${order.displayId || order.id.slice(0, 8)}</div>
            <div>${date}</div>
        </div>

        <div class="border-b"></div>

        <div>
            ${order.items.map(item => `
                <div class="item-row">
                    <span class="item-name">${item.productName}</span>
                    <div class="item-details">
                        <span>${item.quantity}x R$ ${item.priceAtPurchase.toFixed(2)}</span>
                        <span>R$ ${(item.quantity * item.priceAtPurchase).toFixed(2)}</span>
                    </div>
                    ${item.discountApplied && item.discountApplied > 0 ? `
                        <div class="text-right" style="font-size: 10px;">
                            (Desc: -R$ ${item.discountApplied.toFixed(2)})
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>

        <div class="border-t">
            <div class="flex">
                <span>Subtotal:</span>
                <span>R$ ${(order.totalAmount + (order.items.reduce((acc, i) => acc + (i.discountApplied || 0), 0))).toFixed(2)}</span>
            </div>
            ${order.items.some(i => i.discountApplied) ? `
                <div class="flex">
                    <span>Descontos:</span>
                    <span>- R$ ${order.items.reduce((acc, i) => acc + (i.discountApplied || 0), 0).toFixed(2)}</span>
                </div>
            ` : ''}
            <div class="flex total-row">
                <span>TOTAL:</span>
                <span>R$ ${order.totalAmount.toFixed(2)}</span>
            </div>
        </div>

        <div class="border-b"></div>

        <div style="font-size: 11px;">
            <div class="flex">
                <span>Pagamento (${order.paymentMethod}):</span>
                <span>R$ ${(order.amountPaid || order.totalAmount).toFixed(2)}</span>
            </div>
            ${order.changeAmount ? `
                <div class="flex">
                    <span>Troco:</span>
                    <span>R$ ${order.changeAmount.toFixed(2)}</span>
                </div>
            ` : ''}
        </div>

        ${order.customerName ? `
            <div class="border-t text-center" style="font-size: 11px;">
                <div>Cliente: ${order.customerName}</div>
                ${order.customerPhone ? `<div>Tel: ${order.customerPhone}</div>` : ''}
            </div>
        ` : ''}

        <div class="footer">
            <p>Obrigado pela preferência!</p>
            <p>Volte sempre.</p>
            <p style="margin-top: 10px;">Sistema FarmaVida</p>
        </div>
        
        <script>
            window.onload = function() {
                window.print();
                // Optional: window.close();
            }
        </script>
    </body>
    </html>
    `;
};

export const generateA4HTML = async (order: Order) => {
    const settings = await db.getSettings();
    const date = new Date(order.createdAt).toLocaleString('pt-BR');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Pedido #${order.displayId}</title>
        <style>
            body { font-family: sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #333; }
            .info { color: #666; margin-top: 5px; }
            .order-info { display: flex; justify-content: space-between; margin-bottom: 30px; background: #f9f9f9; padding: 20px; border-radius: 8px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { text-align: left; padding: 12px; background: #f3f4f6; border-bottom: 2px solid #e5e7eb; }
            td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
            .totals { float: right; width: 300px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .final-total { font-size: 20px; font-weight: bold; border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; }
            .footer { clear: both; margin-top: 50px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">${settings.pharmacy.name}</div>
            <div class="info">${settings.pharmacy.address}</div>
            <div class="info">CNPJ: ${settings.pharmacy.cnpj} • Tel: ${settings.pharmacy.phone}</div>
        </div>

        <div class="order-info">
            <div>
                <strong>Cliente</strong><br>
                ${order.customerName || 'Consumidor Final'}<br>
                ${order.customerPhone || ''}<br>
                ${order.address || ''}
            </div>
            <div style="text-align: right;">
                <strong>Detalhes do Pedido</strong><br>
                Número: #${order.displayId || order.id}<br>
                Data: ${date}<br>
                Status: ${order.status}
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Produto</th>
                    <th>Qtd</th>
                    <th>Preço Unit.</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${order.items.map(item => `
                    <tr>
                        <td>
                            ${item.productName}
                            ${item.discountApplied ? `<br><small style="color: green;">Desconto: -R$ ${item.discountApplied.toFixed(2)}</small>` : ''}
                        </td>
                        <td>${item.quantity}</td>
                        <td>R$ ${item.priceAtPurchase.toFixed(2)}</td>
                        <td>R$ ${(item.quantity * item.priceAtPurchase).toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="totals">
            <div class="total-row">
                <span>Subtotal:</span>
                <span>R$ ${(order.totalAmount + (order.items.reduce((acc, i) => acc + (i.discountApplied || 0), 0))).toFixed(2)}</span>
            </div>
            <div class="total-row" style="color: green;">
                <span>Descontos:</span>
                <span>- R$ ${order.items.reduce((acc, i) => acc + (i.discountApplied || 0), 0).toFixed(2)}</span>
            </div>
            <div class="total-row final-total">
                <span>Total a Pagar:</span>
                <span>R$ ${order.totalAmount.toFixed(2)}</span>
            </div>
            <div class="total-row" style="margin-top: 10px; color: #666;">
                <span>Pagamento via ${order.paymentMethod}</span>
            </div>
        </div>

        <div class="footer">
            <p>Obrigado pela preferência!</p>
            <p>Documento auxiliar de venda - Não possui valor fiscal</p>
        </div>

        <script>
            window.onload = function() {
                window.print();
            }
        </script>
    </body>
    </html>
    `;
};

export const printOrder = async (orderId: string) => {
    try {
        // Fetch full order details if needed, or assume we pass the object. 
        // For now, let's assume we fetch it to be safe and consistent.
        const order = await db.getOrder(orderId);
        if (!order) throw new Error('Pedido não encontrado');

        const config = getSelectedPrinter();
        let html = '';

        if (config.width === '80mm') {
            html = await generateThermalHTML(order);
        } else {
            html = await generateA4HTML(order);
        }

        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
        } else {
            alert('Pop-up bloqueado. Permita pop-ups para imprimir.');
        }
    } catch (error) {
        console.error('Erro ao imprimir:', error);
        alert('Erro ao gerar impressão.');
    }
};

export const printSimulation = async (items: any[], total: number, customer: any) => {
    // Mock an order object for simulation
    const mockOrder: any = {
        id: 'SIMULACAO',
        displayId: 'SIMULACAO',
        createdAt: new Date().toISOString(),
        customerName: customer?.name || 'Cliente Não Identificado',
        customerPhone: customer?.phone,
        items: items,
        totalAmount: total,
        paymentMethod: 'A Definir',
        status: 'PENDING'
    };

    const html = await generateThermalHTML(mockOrder);

    // Inject simulation warning
    const finalHtml = html.replace('CUPOM NÃO FISCAL', 'SIMULAÇÃO — NÃO É DOCUMENTO FISCAL');

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
        printWindow.document.write(finalHtml);
        printWindow.document.close();
    }
};
