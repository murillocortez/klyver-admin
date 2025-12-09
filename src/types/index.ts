
export enum Role {
  CEO = 'CEO',
  ADMIN = 'ADMIN',
  GERENTE = 'GERENTE',
  OPERADOR = 'OPERADOR',
  NENHUM = 'NENHUM',
  NO_ACCESS = 'NO_ACCESS'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export enum ProductCategory {
  MEDICINE = 'Medicamento',
  HYGIENE = 'Higiene',
  SUPPLEMENT = 'Suplemento',
  COSMETIC = 'Cosmético',
  INFANT = 'Infantil',
  OTC = 'OTC (Isento)',
  CUSTOM = 'Outros'
}

export interface ProductBatch {
  id: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string; // ISO Date
}

export interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  promotionalPrice?: number;
  costPrice?: number; // Added for margin calculation
  images: string[];
  category: ProductCategory | string;
  customCategory?: string;
  requiresPrescription: boolean;
  prescriptionNotes?: string;
  stockTotal: number;
  minStockThreshold: number;
  batches: ProductBatch[];
  status: 'active' | 'inactive';
  manufacturer?: string;
  unit: string;
  instructions?: string; // HTML/Markdown
  lastUpdated: string;
  expiryAlertThreshold?: number; // Months
  expiryDate?: string; // Helper for UI (maps to batch)

  // Pricing Formation
  manualMargin?: number;
  desiredMarginPercent?: number;
  pmcPrice?: number;
  pmvgPrice?: number;
  realMargin?: number;
  suggestedPrice?: number;
  registration?: string; // ANVISA
  activeIngredient?: string;
  presentation?: string;
  therapeuticClass?: string;

  // Fiscal Data
  ncm?: string;
  cest?: string;
  cfop?: string; // 5102, 5405, etc
  taxSource?: '0' | '1' | '2'; // Origem da mercadoria
  barcode?: string;
}

export interface HealthInsurancePlan {
  id: string;
  name: string;
  discount_percent: number;
  rules?: any;
  created_at?: string;
}

export enum OrderStatus {
  PENDING = 'Pendente',
  CONFIRMED = 'Confirmado',
  PREPARING = 'Em Preparação',
  SHIPPING = 'A Caminho',
  READY = 'Pronto para Retirada',
  DELIVERED = 'Entregue',
  CANCELLED = 'Cancelado'
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  priceAtPurchase: number;
  category?: string;
  // PDV specific
  originalPrice?: number;
  discountApplied?: number;
  image_url?: string;
}

export interface Order {
  id: string;
  displayId?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: string; // ISO Date
  address: string;
  paymentMethod: string;
  deliveryManId?: string;
  cancellationReason?: string;
  // PDV Fields
  origin?: 'online' | 'presencial';
  amountPaid?: number;
  changeAmount?: number;
  cashierId?: string;
  // Extra fields for receipts
  customerCpf?: string;
  discountAmount?: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalSpent: number;
  orderCount: number;
  lastOrderDate: string;
  tags: string[];
  isRecurring: boolean;
  joinedAt: string;
  status: 'active' | 'blocked';
  internalNotes?: string;
  birthDate?: string;
  // CRM & PDV Fields
  cpf?: string;
  referrer?: string;
  isVip?: boolean;
  insurancePlanId?: string;
  insuranceCardNumber?: string;
  healthInsurancePlan?: HealthInsurancePlan;
}

export interface DashboardStats {
  totalOrdersToday: number;
  totalRevenueWeek: number;
  newCustomers30Days: number;
  recurringRate: number; // percentage
}

export interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
  cost?: number;
  margin?: number;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  totalMargin: number;
  salesByDate: SalesDataPoint[];
  salesByCategory: { name: string; value: number }[];
  salesByPayment: { name: string; value: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  expiringProducts: { name: string; batch: string; date: string; quantity: number }[];
}

// Settings Interfaces
export interface PharmacySettings {
  name: string;
  cnpj: string;
  ie?: string; // Inscrição Estadual
  im?: string; // Inscrição Municipal
  cnae?: string;
  taxRegime?: 'simples' | 'lucro_presumido' | 'lucro_real';
  address: string;
  phone: string;
  email: string;
  openingHours: string;
  estimatedDeliveryTime: number; // minutes
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  pharmacistName?: string;
  pharmacistRegister?: string;
  siteUrl?: string;
  additionalPharmacists?: { name: string; register: string }[];

  // eNotas Integration
  enotasEnabled?: boolean;
  enotasApiKey?: string; // Only for local storage if needed, usually env

  // New Fiscal Settings
  fiscalProvider?: 'none' | 'plugnotas' | 'nuvemfiscal' | 'notafacil';
  fiscalApiKey?: string;
  fiscalCompanyId?: string;
  fiscalCertificateUrl?: string;
  fiscalCertificatePassword?: string;
}

export interface SocialMediaSettings {
  whatsapp?: string;
  instagram?: string;
  tiktok?: string;
  twitter?: string;
  linkedin?: string;
  facebook?: string;
}

export interface DeliverySettings {
  methods: {
    delivery: boolean;
    pickup: boolean;
  };
  feeType: 'fixed' | 'radius';
  fixedFee: number;
  freeShippingThreshold: number;
}

export interface PaymentSettings {
  pixEnabled: boolean;
  pixKey: string;
  creditCardEnabled: boolean;
  maxInstallments: number;
  debitCardEnabled: boolean;
  cashEnabled: boolean;
  customInstructions: string;
}

export interface NotificationSettings {
  lowStockAlert: boolean;
  newOrderAlert: boolean;
  emailChannel: boolean;
  pushChannel: boolean;
}

export interface StoreSettings {
  welcomeMessage: string;
  welcomeMessageBgColor?: string;
  welcomeMessageTextColor?: string;
  bannerUrl: string;
}

export interface VipSettings {
  enabled: boolean;
  discountPercentage: number;
  inactivityDays: number; // Days to lose VIP
  minOrderCountMonthly: number; // Orders per month to gain VIP
  minSpentMonthly: number; // Spent per month to gain VIP
}

export interface AppSettings {
  pharmacy: PharmacySettings;
  delivery: DeliverySettings;
  payment: PaymentSettings;
  notifications: NotificationSettings;
  apiToken: string;
  store: StoreSettings;
  socialMedia: SocialMediaSettings;
  vip: VipSettings;
  enableHealthInsurance: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  timestamp: string;
}

export interface DailyOffer {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  productId?: string;
  active: boolean;
  views?: number;
  clicks?: number;
  sales?: number;
}

export interface StorePlan {
  id: string;
  name: string;
  code: 'free' | 'essential' | 'pro' | 'advanced' | 'enterprise';
  price_month: number;
  price_year: number;
  limits: {
    orders: number;
    products: number;
    users: number;
  };
  features: string[];
}

export interface StoreSubscription {
  id: string;
  store_id: string;
  plan_id: string;
  status: 'active' | 'past_due' | 'canceled';
  period: 'monthly' | 'yearly';
  renew_at: string;
  plan?: StorePlan; // Joined
}

export interface Store {
  id: string;
  name: string;
}

// Cashback Interfaces
export interface CashbackSettings {
  percentualPadrao: number;
  diasValidade: number;
}

export interface CashbackTransaction {
  id: string;
  customerId: string;
  orderId?: string;
  tipo: 'credito' | 'debito' | 'expirado';
  valor: number;
  dataExpiracao?: string; // ISO Date
  createdAt: string; // ISO Date
}

export interface CashbackWallet {
  saldoAtual: number;
  ultimoCredito?: string;
  ultimoDebito?: string;
  updatedAt: string;
}

export interface SupportTicket {
  id: string;
  tenant_id: string;
  user_id?: string;
  requester_name: string;
  requester_phone?: string;
  subject?: string;
  message: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'open' | 'pending' | 'answered' | 'closed';
  created_at: string;
  updated_at: string;
}
