
import { AppNotification, AppSettings, Customer, Order, OrderStatus, Product, ProductCategory, Role, User } from './types';

export const MOCK_USERS: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@pharma.com', role: Role.ADMIN, avatar: 'https://i.pravatar.cc/150?u=1' },
  { id: '2', name: 'Manager User', email: 'manager@pharma.com', role: Role.GERENTE, avatar: 'https://i.pravatar.cc/150?u=2' },
  { id: '3', name: 'Operator User', email: 'op@pharma.com', role: Role.OPERADOR, avatar: 'https://i.pravatar.cc/150?u=3' },
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Paracetamol 500mg',
    description: 'Analgésico e antitérmico indicado para redução de febre e alívio de dores leves a moderadas.',
    sku: '789123456001',
    price: 15.00,
    costPrice: 8.50,
    category: ProductCategory.OTC,
    requiresPrescription: false,
    stockTotal: 150,
    minStockThreshold: 20,
    batches: [
      { id: 'b1', batchNumber: 'L001', quantity: 100, expiryDate: '2025-12-31' },
      { id: 'b2', batchNumber: 'L002', quantity: 50, expiryDate: '2024-06-30' }
    ],
    status: 'active',
    unit: 'cx 20 comp',
    images: ['https://picsum.photos/200/200?random=1'],
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'p2',
    name: 'Amoxicilina 875mg',
    description: 'Antibiótico de amplo espectro indicado para infecções bacterianas.',
    sku: '789123456002',
    price: 45.50,
    costPrice: 28.00,
    category: ProductCategory.MEDICINE,
    requiresPrescription: true,
    prescriptionNotes: 'Retenção de receita obrigatória.',
    stockTotal: 40,
    minStockThreshold: 10,
    batches: [
      { id: 'b3', batchNumber: 'L003', quantity: 40, expiryDate: '2024-11-20' }
    ],
    status: 'active',
    unit: 'cx 14 comp',
    images: ['https://picsum.photos/200/200?random=2'],
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'p3',
    name: 'Shampoo Anticaspa',
    description: 'Controle eficaz da caspa e oleosidade.',
    sku: '789123456003',
    price: 32.90,
    promotionalPrice: 29.90,
    costPrice: 15.00,
    category: ProductCategory.HYGIENE,
    requiresPrescription: false,
    stockTotal: 8,
    minStockThreshold: 10, // Low stock alert
    batches: [],
    status: 'active',
    unit: 'frasco 200ml',
    images: ['https://picsum.photos/200/200?random=3'],
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'p4',
    name: 'Vitamina C 1g',
    description: 'Suplemento vitamínico efervescente.',
    sku: '789123456004',
    price: 18.00,
    costPrice: 9.00,
    category: ProductCategory.SUPPLEMENT,
    requiresPrescription: false,
    stockTotal: 60,
    minStockThreshold: 15,
    batches: [
      { id: 'b4', batchNumber: 'L004', quantity: 60, expiryDate: '2023-11-15' } // Expiring soon mock
    ],
    status: 'active',
    unit: 'tubo 10 comp',
    images: ['https://picsum.photos/200/200?random=4'],
    lastUpdated: new Date().toISOString()
  }
];

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Maria Silva',
    phone: '(11) 99999-1111',
    email: 'maria.silva@email.com',
    address: 'Rua das Flores, 123 - Centro',
    totalSpent: 450.00,
    orderCount: 5,
    lastOrderDate: '2023-10-25',
    tags: ['VIP'],
    isRecurring: true,
    joinedAt: '2023-01-10',
    status: 'active',
    internalNotes: 'Cliente prefere entrega na parte da manhã.'
  },
  {
    id: 'c2',
    name: 'João Santos',
    phone: '(11) 98888-2222',
    email: 'joao.santos@email.com',
    address: 'Av. Paulista, 1000 - Bela Vista',
    totalSpent: 89.90,
    orderCount: 1,
    lastOrderDate: '2023-10-26',
    tags: [],
    isRecurring: false,
    joinedAt: '2023-10-26',
    status: 'active'
  },
  {
    id: 'c3',
    name: 'Ana Costa',
    phone: '(21) 97777-3333',
    email: 'ana.costa@email.com',
    address: 'Rua do Porto, 50 - Porto',
    totalSpent: 1200.00,
    orderCount: 12,
    lastOrderDate: '2023-10-20',
    tags: ['VIP', 'Recorrente'],
    isRecurring: true,
    joinedAt: '2022-05-15',
    status: 'active',
    internalNotes: 'Cliente alérgica a dipirona.'
  },
  {
    id: 'c4',
    name: 'Carlos Oliveira',
    phone: '(31) 96666-4444',
    totalSpent: 0.00,
    orderCount: 0,
    lastOrderDate: '',
    tags: ['Novo'],
    isRecurring: false,
    joinedAt: new Date().toISOString(),
    status: 'active'
  },
  {
    id: 'c5',
    name: 'Roberto Malandro',
    phone: '(11) 91111-2222',
    address: 'Rua Desconhecida, 0',
    totalSpent: 50.00,
    orderCount: 1,
    lastOrderDate: '2023-09-01',
    tags: ['Risco'],
    isRecurring: false,
    joinedAt: '2023-08-01',
    status: 'blocked',
    internalNotes: 'Tentou golpe do pix falso. Bloqueado.'
  },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'o1',
    customerId: 'c1',
    customerName: 'Maria Silva',
    customerPhone: '(11) 99999-1111',
    items: [{ productId: 'p1', productName: 'Paracetamol 500mg', quantity: 2, priceAtPurchase: 15.00 }],
    totalAmount: 30.00,
    status: OrderStatus.PENDING,
    createdAt: new Date().toISOString(),
    address: 'Rua das Flores, 123',
    paymentMethod: 'Pix'
  },
  {
    id: 'o2',
    customerId: 'c2',
    customerName: 'João Santos',
    customerPhone: '(11) 98888-2222',
    items: [{ productId: 'p3', productName: 'Shampoo Anticaspa', quantity: 1, priceAtPurchase: 29.90 }],
    totalAmount: 29.90,
    status: OrderStatus.DELIVERED,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    address: 'Av. Paulista, 1000',
    paymentMethod: 'Credit Card'
  },
  {
    id: 'o3',
    customerId: 'c3',
    customerName: 'Ana Costa',
    customerPhone: '(21) 97777-3333',
    items: [
      { productId: 'p2', productName: 'Amoxicilina 875mg', quantity: 1, priceAtPurchase: 45.50 },
      { productId: 'p1', productName: 'Paracetamol 500mg', quantity: 1, priceAtPurchase: 15.00 }
    ],
    totalAmount: 60.50,
    status: OrderStatus.SHIPPING,
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    address: 'Rua do Porto, 50',
    paymentMethod: 'Cash'
  },
  {
    id: 'o4',
    customerId: 'c1',
    customerName: 'Maria Silva',
    customerPhone: '(11) 99999-1111',
    items: [{ productId: 'p3', productName: 'Shampoo Anticaspa', quantity: 2, priceAtPurchase: 32.90 }],
    totalAmount: 65.80,
    status: OrderStatus.DELIVERED,
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    address: 'Rua das Flores, 123',
    paymentMethod: 'Pix'
  }
];

export const MOCK_SETTINGS: AppSettings = {
  pharmacy: {
    name: 'PharmaDash Drugstore',
    cnpj: '12.345.678/0001-90',
    address: 'Av. Principal, 100 - Centro, São Paulo - SP',
    phone: '(11) 3000-0000',
    email: 'contato@pharmadash.com',
    openingHours: 'Seg-Sáb 08:00 - 22:00',
    estimatedDeliveryTime: 45,
    logoUrl: 'https://cdn-icons-png.flaticon.com/512/3022/3022646.png',
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af'
  },
  delivery: {
    methods: {
      delivery: true,
      pickup: true
    },
    feeType: 'fixed',
    fixedFee: 5.90,
    freeShippingThreshold: 100.00
  },
  payment: {
    pixEnabled: true,
    pixKey: '12.345.678/0001-90',
    creditCardEnabled: true,
    debitCardEnabled: true,
    cashEnabled: true,
    customInstructions: 'Entregador leva maquininha.',
    maxInstallments: 12
  },
  notifications: {
    lowStockAlert: true,
    newOrderAlert: true,
    emailChannel: true,
    pushChannel: false
  },
  apiToken: 'sk_test_51Mz9...',
  store: {
    welcomeMessage: 'Entrega rápida em até 45 minutos!',
    bannerUrl: 'https://picsum.photos/800/200'
  },
  socialMedia: {},
  vip: {
    enabled: false,
    discountPercentage: 0,
    inactivityDays: 0,
    minOrderCountMonthly: 0,
    minSpentMonthly: 0
  },
  enableHealthInsurance: true
};

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'Novo Pedido #O5',
    message: 'Novo pedido recebido de Maria Silva. Valor: R$ 45,00',
    type: 'success',
    read: false,
    timestamp: new Date().toISOString()
  },
  {
    id: 'n2',
    title: 'Estoque Crítico',
    message: 'Shampoo Anticaspa atingiu o nível mínimo (8 un).',
    type: 'warning',
    read: false,
    timestamp: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'n3',
    title: 'Backup Realizado',
    message: 'Backup do banco de dados concluído com sucesso.',
    type: 'info',
    read: true,
    timestamp: new Date(Date.now() - 86400000).toISOString()
  }
];
