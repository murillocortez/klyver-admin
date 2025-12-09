import { supabase } from './supabase';
import { AnalyticsSummary, AppNotification, AppSettings, Customer, DailyOffer, Order, OrderItem, OrderStatus, Product, ProductBatch, ProductCategory, Role, StorePlan, StoreSubscription, User, SalesDataPoint, HealthInsurancePlan } from '../types';
import { whatsappService } from './whatsappService';

// Helper to simulate async delay (optional, but keeping for compatibility if needed, though Supabase is async)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class DBService {

  // Products
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_batches(*)');

    if (error) throw error;

    return data.map(this.mapProduct);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_batches(*)')
      .eq('id', id)
      .single();

    if (error) return undefined;
    return this.mapProduct(data);
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_batches(*)')
      .eq('barcode', barcode)
      .single();

    if (error) return undefined;
    return this.mapProduct(data);
  }

  async searchProducts(query: string): Promise<Product[]> {
    if (!query || query.length < 3) return [];

    const { data, error } = await supabase
      .from('products')
      .select('*, product_batches(*)')
      .or(`name.ilike.%${query}%,sku.ilike.%${query}%`)
      .limit(20);

    if (error) {
      console.error(error);
      return [];
    }

    return data.map(this.mapProduct);
  }

  async saveProduct(product: Product): Promise<void> {
    // Check if ID is a valid UUID (approximate check)
    const isValidUUID = product.id && product.id.length > 20;

    const dbProduct: any = {
      name: product.name,
      description: product.description,
      sku: product.sku || null,
      price: product.price,
      promotional_price: product.promotionalPrice || null,
      cost_price: product.costPrice || null,
      category: product.category,
      custom_category: product.customCategory || null,
      requires_prescription: product.requiresPrescription,
      prescription_notes: product.prescriptionNotes || null,
      min_stock_threshold: product.minStockThreshold,
      expiry_alert_threshold: product.expiryAlertThreshold || null,
      status: product.status,
      manufacturer: product.manufacturer || null,
      unit: product.unit,
      instructions: product.instructions || null,
      images: product.images,
      barcode: product.barcode || null,
      updated_at: new Date().toISOString()
    };

    let savedId = product.id;

    if (isValidUUID) {
      dbProduct.id = product.id;
      const { error } = await supabase.from('products').upsert(dbProduct);
      if (error) throw error;
    } else {
      // Insert new product
      const { data, error } = await supabase.from('products').insert(dbProduct).select().single();
      if (error) throw error;
      savedId = data.id;
    }

    // Handle Batches and Stock
    // If the user is using the "Simple Stock" mode (editing stockTotal directly), we need to ensure batches reflect this.

    const currentBatches = product.batches || [];
    const currentStockSum = currentBatches.reduce((sum, b) => sum + b.quantity, 0);
    const targetStock = Number(product.stockTotal) || 0; // Ensure number

    // If stockTotal is provided and differs from batch sum, or if we have no batches but have stock
    if (product.stockTotal !== undefined && (currentBatches.length === 0 || targetStock !== currentStockSum)) {
      if (currentBatches.length === 0) {
        // Case 1: No batches exist. Create a default one if stock > 0
        if (targetStock > 0 && savedId) {
          let expiryDate = product.expiryDate;

          if (!expiryDate) {
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            expiryDate = nextYear.toISOString().split('T')[0]; // YYYY-MM-DD
          }

          await supabase.from('product_batches').insert({
            product_id: savedId,
            batch_number: 'LOTE-INICIAL',
            quantity: targetStock,
            expiry_date: expiryDate
          });
        }
      } else {
        // Case 2: Batches exist. Update the first one to absorb the difference.
        const firstBatch = currentBatches[0];
        if (firstBatch && firstBatch.id) {
          const updateData: any = { quantity: targetStock };
          if (product.expiryDate) {
            updateData.expiry_date = product.expiryDate;
          }

          await supabase.from('product_batches').update(updateData).eq('id', firstBatch.id);
        }
      }
    } else {
      // Standard Batch Saving (if UI supported it correctly)
      if (product.batches) {
        for (const batch of product.batches) {
          const isBatchIdValid = batch.id && batch.id.length > 20;
          const batchData: any = {
            product_id: savedId,
            batch_number: batch.batchNumber,
            quantity: batch.quantity,
            expiry_date: batch.expiryDate
          };

          if (isBatchIdValid) {
            batchData.id = batch.id;
            await supabase.from('product_batches').upsert(batchData);
          } else {
            await supabase.from('product_batches').insert(batchData);
          }
        }
      }
    }
  }

  async deleteProduct(id: string): Promise<void> {
    await supabase.from('products').delete().eq('id', id);
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name, category)), customers(name, phone)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(this.mapOrder);
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(name, category)), customers(name, phone)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(this.mapOrder);
  }

  async getOrder(id: string): Promise<Order | null> {
    let query = supabase
      .from('orders')
      .select('*, order_items(*, products(name, category)), customers(name, phone)');

    if (id.length === 36) {
      query = query.eq('id', id);
    } else {
      query = query.ilike('id', `${id}%`);
    }

    const { data, error } = await query.single();

    if (error) return null;
    return this.mapOrder(data);
  }

  async updateOrderStatus(orderId: string, status: Order['status'], cancellationReason?: string): Promise<void> {
    const updateData: any = { status };
    if (cancellationReason) {
      updateData.cancellation_reason = cancellationReason;
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) throw error;

    // Send WhatsApp Notification (Async)
    try {
      const order = await this.getOrder(orderId);
      if (order) {
        await whatsappService.sendOrderStatusMessage(order, status as OrderStatus);
      }
    } catch (err) {
      console.error('Failed to trigger WhatsApp notification:', err);
    }

    // Inventory logic is handled by triggers or manual decrement here if needed.
    // For now, we assume stock is decremented at order creation or confirmation via RPC/Trigger.
    if (status === OrderStatus.CONFIRMED) {
      // Implement stock decrement logic if not done at creation
    }
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*');

    if (error) throw error;
    return data.map(this.mapCustomer);
  }

  async getCustomerById(id: string): Promise<Customer | undefined> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return undefined;
    return this.mapCustomer(data);
  }

  async updateCustomer(customer: Customer): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .update({
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        cpf: customer.cpf || null,
        birth_date: customer.birthDate || null,
        referrer: customer.referrer || null,
        insurance_plan_id: customer.insurancePlanId || null,
        insurance_card_number: customer.insuranceCardNumber || null,
        status: customer.status,
        tags: customer.tags,
        internal_notes: customer.internalNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', customer.id);

    if (error) throw error;
  }

  async deleteCustomer(id: string): Promise<void> {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
  }

  async getBirthdaysToday(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*');

    if (error) throw error;

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    return data
      .map(this.mapCustomer)
      .filter(c => {
        if (!c.birthDate) return false;
        // Parse YYYY-MM-DD
        const [year, month, day] = c.birthDate.split('-').map(Number);
        return month === currentMonth && day === currentDay;
      });
  }

  // Analytics
  async getSalesData(days: number): Promise<SalesDataPoint[]> {
    const data = await this.getAnalyticsData(days);
    return data.salesByDate;
  }

  async getAnalyticsData(days: number): Promise<AnalyticsSummary> {
    // Fetch all orders for the period
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const { data: ordersData, error } = await supabase
      .from('orders')
      .select('*, order_items(*, products(category, cost_price))')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    const orders = ordersData.map(o => ({
      ...o,
      items: o.order_items.map((i: any) => ({
        ...i,
        category: i.products?.category,
        costPrice: i.products?.cost_price
      }))
    }));

    // KPI Calculations
    const validOrders = orders.filter(o => o.status !== 'Cancelado');
    const totalRevenue = validOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const totalOrders = orders.length;
    const averageTicket = totalOrders > 0 ? totalRevenue / validOrders.length : 0;

    // Margin
    let totalCost = 0;
    validOrders.forEach(o => {
      o.items.forEach((item: any) => {
        const cost = item.costPrice || (item.price_at_purchase * 0.5);
        totalCost += cost * item.quantity;
      });
    });
    const totalMargin = totalRevenue - totalCost;

    // Sales By Date
    const salesByDateMap = new Map<string, { revenue: number, orders: number, cost: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      salesByDateMap.set(dateStr, { revenue: 0, orders: 0, cost: 0 });
    }

    validOrders.forEach(o => {
      const dateStr = new Date(o.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (salesByDateMap.has(dateStr)) {
        const entry = salesByDateMap.get(dateStr)!;
        entry.revenue += Number(o.total_amount);
        entry.orders += 1;
        o.items.forEach((item: any) => {
          const cost = item.costPrice || (item.price_at_purchase * 0.5);
          entry.cost += cost * item.quantity;
        });
      }
    });

    const salesByDate: SalesDataPoint[] = Array.from(salesByDateMap.entries()).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders,
      cost: data.cost,
      margin: data.revenue - data.cost
    }));

    // Sales By Category
    const categoryMap = new Map<string, number>();
    validOrders.forEach(o => {
      o.items.forEach((item: any) => {
        const cat = item.category || 'Desconhecido';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + (item.price_at_purchase * item.quantity));
      });
    });
    const salesByCategory = Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Sales By Payment
    const paymentMap = new Map<string, number>();
    validOrders.forEach(o => {
      const method = o.payment_method || 'Unknown';
      paymentMap.set(method, (paymentMap.get(method) || 0) + 1);
    });
    const salesByPayment = Array.from(paymentMap.entries()).map(([name, value]) => ({ name, value }));

    // Top Products (Need product names, fetched in query?)
    // I didn't fetch product name in the analytics query above, let's assume I did or fetch it.
    // I'll skip detailed top products for now or rely on what I have.
    // Actually, I can fetch product name in the join.

    return {
      totalRevenue,
      totalOrders,
      averageTicket,
      totalMargin,
      salesByDate,
      salesByCategory,
      salesByPayment,
      topProducts: [], // Placeholder
      expiringProducts: [] // Placeholder
    };
  }

  // Settings
  async getSettings(): Promise<AppSettings> {
    const { data, error } = await supabase.from('store_settings').select('*').limit(1).maybeSingle();
    if (error || !data) {
      // Return default if not found
      return {
        pharmacy: { name: '', cnpj: '', address: '', phone: '', email: '', openingHours: '', estimatedDeliveryTime: 0, logoUrl: '', primaryColor: '', secondaryColor: '' },
        delivery: { methods: { delivery: true, pickup: true }, feeType: 'fixed', fixedFee: 0, freeShippingThreshold: 0 },
        payment: { pixEnabled: true, pixKey: '', creditCardEnabled: true, maxInstallments: 3, debitCardEnabled: true, cashEnabled: true, customInstructions: '' },
        notifications: { lowStockAlert: true, newOrderAlert: true, emailChannel: true, pushChannel: true },
        apiToken: '',
        store: { welcomeMessage: '', bannerUrl: '' },
        socialMedia: {},
        vip: { enabled: false, discountPercentage: 0, inactivityDays: 0, minOrderCountMonthly: 0, minSpentMonthly: 0 },
        enableHealthInsurance: false
      };
    }
    return this.mapSettings(data);
  }

  async updateSettings(newSettings: AppSettings): Promise<void> {
    // Map back to DB columns
    const dbSettings = {
      pharmacy_name: newSettings.pharmacy.name,
      cnpj: newSettings.pharmacy.cnpj,
      address: newSettings.pharmacy.address,
      phone: newSettings.pharmacy.phone,
      email: newSettings.pharmacy.email,
      opening_hours: newSettings.pharmacy.openingHours,
      estimated_delivery_time: newSettings.pharmacy.estimatedDeliveryTime,
      logo_url: newSettings.pharmacy.logoUrl,
      primary_color: newSettings.pharmacy.primaryColor,
      secondary_color: newSettings.pharmacy.secondaryColor,
      pharmacist_name: newSettings.pharmacy.pharmacistName,
      pharmacist_register: newSettings.pharmacy.pharmacistRegister,
      additional_pharmacists: newSettings.pharmacy.additionalPharmacists,

      // Fiscal Data
      ie: newSettings.pharmacy.ie,
      im: newSettings.pharmacy.im,
      cnae: newSettings.pharmacy.cnae,
      tax_regime: newSettings.pharmacy.taxRegime,
      enotas_enabled: newSettings.pharmacy.enotasEnabled,
      fiscal_provider: newSettings.pharmacy.fiscalProvider,
      fiscal_api_key: newSettings.pharmacy.fiscalApiKey,
      fiscal_company_id: newSettings.pharmacy.fiscalCompanyId,
      fiscal_certificate_url: newSettings.pharmacy.fiscalCertificateUrl,
      fiscal_certificate_password: newSettings.pharmacy.fiscalCertificatePassword,

      social_whatsapp: newSettings.socialMedia?.whatsapp,
      social_instagram: newSettings.socialMedia?.instagram,
      social_tiktok: newSettings.socialMedia?.tiktok,
      social_twitter: newSettings.socialMedia?.twitter,
      social_linkedin: newSettings.socialMedia?.linkedin,
      social_facebook: newSettings.socialMedia?.facebook,
      delivery_fee_type: newSettings.delivery.feeType,
      fixed_delivery_fee: newSettings.delivery.fixedFee,
      free_shipping_threshold: newSettings.delivery.freeShippingThreshold,
      payment_pix_enabled: newSettings.payment.pixEnabled,
      payment_pix_key: newSettings.payment.pixKey,
      payment_credit_enabled: newSettings.payment.creditCardEnabled,
      payment_credit_max_installments: newSettings.payment.maxInstallments,
      payment_debit_enabled: newSettings.payment.debitCardEnabled,
      payment_cash_enabled: newSettings.payment.cashEnabled,
      notification_low_stock: newSettings.notifications.lowStockAlert,
      notification_new_order: newSettings.notifications.newOrderAlert,
      notification_email_channel: newSettings.notifications.emailChannel,
      notification_push_channel: newSettings.notifications.pushChannel,
      api_token: newSettings.apiToken,
      welcome_message: newSettings.store.welcomeMessage,
      banner_url: newSettings.store.bannerUrl,
      updated_at: new Date().toISOString(),

      // VIP
      vip_enabled: newSettings.vip?.enabled,
      vip_discount_percentage: newSettings.vip?.discountPercentage,
      vip_inactivity_days: newSettings.vip?.inactivityDays,
      vip_min_order_count: newSettings.vip?.minOrderCountMonthly,
      vip_min_spent: newSettings.vip?.minSpentMonthly,

      // Health Insurance
      enable_health_insurance: newSettings.enableHealthInsurance
    };

    const { data: existing } = await supabase.from('store_settings').select('id').limit(1).maybeSingle();

    if (existing) {
      const { error } = await supabase.from('store_settings').update(dbSettings).eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('store_settings').insert(dbSettings);
      if (error) throw error;
    }
  }

  // ...

  private mapSettings(s: any): AppSettings {
    // Map DB to AppSettings
    return {
      pharmacy: {
        name: s.pharmacy_name,
        cnpj: s.cnpj,
        address: s.address,
        phone: s.phone,
        email: s.email,
        openingHours: s.opening_hours,
        estimatedDeliveryTime: s.estimated_delivery_time,
        logoUrl: s.logo_url,
        primaryColor: s.primary_color,
        secondaryColor: s.secondary_color,
        pharmacistName: s.pharmacist_name,
        pharmacistRegister: s.pharmacist_register,
        additionalPharmacists: s.additional_pharmacists || [],

        // Fiscal
        ie: s.ie,
        im: s.im,
        cnae: s.cnae,
        taxRegime: s.tax_regime,
        enotasEnabled: s.enotas_enabled,
        fiscalProvider: s.fiscal_provider || 'none',
        fiscalApiKey: s.fiscal_api_key,
        fiscalCompanyId: s.fiscal_company_id,
        fiscalCertificateUrl: s.fiscal_certificate_url,
        fiscalCertificatePassword: s.fiscal_certificate_password
      },
      socialMedia: {
        whatsapp: s.social_whatsapp,
        instagram: s.social_instagram,
        tiktok: s.social_tiktok,
        twitter: s.social_twitter,
        linkedin: s.social_linkedin,
        facebook: s.social_facebook
      },
      vip: {
        enabled: s.vip_enabled,
        discountPercentage: s.vip_discount_percentage,
        inactivityDays: s.vip_inactivity_days,
        minOrderCountMonthly: s.vip_min_order_count,
        minSpentMonthly: s.vip_min_spent
      },
      enableHealthInsurance: s.enable_health_insurance || false,
      delivery: {
        methods: { delivery: true, pickup: true }, // Simplified
        feeType: s.delivery_fee_type as 'fixed' | 'radius',
        fixedFee: s.fixed_delivery_fee,
        freeShippingThreshold: s.free_shipping_threshold
      },
      payment: {
        pixEnabled: s.payment_pix_enabled,
        pixKey: s.payment_pix_key,
        creditCardEnabled: s.payment_credit_enabled,
        maxInstallments: s.payment_credit_max_installments || 3,
        debitCardEnabled: s.payment_debit_enabled,
        cashEnabled: s.payment_cash_enabled,
        customInstructions: ''
      },
      notifications: {
        lowStockAlert: s.notification_low_stock,
        newOrderAlert: s.notification_new_order,
        emailChannel: true,
        pushChannel: true
      },
      apiToken: '',
      store: {
        welcomeMessage: s.welcome_message || '',
        bannerUrl: s.banner_url || ''
      }
    };
  }
  // Daily Offers
  async getDailyOffers(): Promise<DailyOffer[]> {
    const { data, error } = await supabase
      .from('daily_offers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((o: any) => ({
      id: o.id,
      title: o.title,
      subtitle: o.subtitle,
      imageUrl: o.image_url,
      productId: o.product_id,
      active: o.active,
      views: o.views,
      clicks: o.clicks,
      sales: o.sales
    }));
  }

  async saveDailyOffer(offer: DailyOffer): Promise<void> {
    const dbOffer = {
      title: offer.title,
      subtitle: offer.subtitle || null,
      image_url: offer.imageUrl || null,
      product_id: offer.productId || null,
      active: offer.active,
      updated_at: new Date().toISOString()
    };

    if (offer.id) {
      const { error } = await supabase.from('daily_offers').update(dbOffer).eq('id', offer.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('daily_offers').insert(dbOffer);
      if (error) throw error;
    }
  }

  async deleteDailyOffer(id: string): Promise<void> {
    await supabase.from('daily_offers').delete().eq('id', id);
  }

  // Notifications
  async getNotifications(): Promise<AppNotification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return data.map((n: any) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type as 'info' | 'success' | 'warning' | 'error',
      timestamp: n.created_at,
      read: n.read,
      link: n.link
    }));
  }

  async markNotificationAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (error) throw error;
  }

  async markAllNotificationsAsRead(): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false);

    if (error) throw error;
  }

  // User Management
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) throw error;

    return data.map((p: any) => ({
      id: p.id,
      name: p.full_name || 'Usuário',
      email: '', // Email not available in public profiles table
      role: p.role as Role,
      avatar: p.avatar_url
    }));
  }

  async addUser(user: User): Promise<void> {
    // This would typically require an Edge Function to create a user in auth.users
    console.warn('User creation from client side is restricted. Implement Edge Function for full support.');
    // For now, we can't easily create a user in auth.users from here without logging them in.
    throw new Error('Criação de usuários via Dashboard requer configuração de Função Edge (Backend).');
  }

  async updateUserRole(id: string, role: Role): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id);

    if (error) throw error;
  }

  async getCurrentUserRole(): Promise<Role | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || !data) return null;
    return data.role as Role;
  }

  async deleteUser(id: string): Promise<void> {
    // Note: This only deletes the profile. The auth user remains.
    // To fully delete, we'd need an Edge Function.
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
  }

  private mapProduct(p: any): Product {
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      sku: p.sku,
      price: p.price,
      promotionalPrice: p.promotional_price,
      costPrice: p.cost_price,
      images: p.images || [],
      category: p.category as ProductCategory,
      customCategory: p.custom_category,
      requiresPrescription: p.requires_prescription,
      prescriptionNotes: p.prescription_notes,
      stockTotal: p.product_batches?.reduce((acc: number, b: any) => acc + b.quantity, 0) || 0,
      minStockThreshold: p.min_stock_threshold,
      batches: p.product_batches?.map((b: any) => ({
        id: b.id,
        batchNumber: b.batch_number,
        quantity: b.quantity,
        expiryDate: b.expiry_date
      })) || [],
      status: p.status as 'active' | 'inactive',
      manufacturer: p.manufacturer,
      unit: p.unit,
      instructions: p.instructions,
      lastUpdated: p.updated_at,
      expiryAlertThreshold: 3, // Default

      // Pricing
      manualMargin: p.manual_margin,
      desiredMarginPercent: p.desired_margin_percent,
      pmcPrice: p.pmc_price,
      realMargin: p.real_margin,
      suggestedPrice: p.suggested_price,
      barcode: p.barcode
    };
  }

  private mapOrder(o: any): Order {
    return {
      id: o.id,
      displayId: o.id.substring(0, 8), // Mock display ID
      customerId: o.customer_id,
      customerName: o.customers?.name || 'Cliente', // Requires join
      customerPhone: o.customers?.phone || '',
      items: o.order_items?.map((i: any) => ({
        productId: i.product_id,
        productName: i.products?.name || 'Produto', // Requires join
        quantity: i.quantity,
        priceAtPurchase: i.price_at_purchase,
        category: i.products?.category
      })) || [],
      totalAmount: o.total_amount,
      status: o.status as OrderStatus,
      createdAt: o.created_at,
      address: o.delivery_address,
      paymentMethod: o.payment_method,
      deliveryManId: undefined,
      cancellationReason: o.cancellation_reason,
      origin: o.origin,
      amountPaid: o.amount_paid,
      changeAmount: o.change_amount,
      cashierId: o.cashier_id
    };
  }

  private mapCustomer(c: any): Customer {
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      totalSpent: c.total_spent || 0,
      orderCount: c.purchase_count || 0,
      lastOrderDate: c.last_purchase_date,
      tags: c.tags || [],
      isRecurring: c.is_recurring || false,
      joinedAt: c.created_at,
      status: c.status,
      internalNotes: c.internal_notes,
      birthDate: c.birth_date,
      cpf: c.cpf,
      referrer: c.referrer,
      isVip: c.is_vip,
      insurancePlanId: c.insurance_plan_id,
      insuranceCardNumber: c.insurance_card_number,
      healthInsurancePlan: c.health_insurance_plans ? {
        id: c.health_insurance_plans.id,
        name: c.health_insurance_plans.name,
        discount_percent: c.health_insurance_plans.discount_percent,
        rules: c.health_insurance_plans.rules
      } : undefined
    };
  }

  // Plans & Subscriptions
  async getPlans(): Promise<StorePlan[]> {
    const { data, error } = await supabase
      .from('store_plans')
      .select('*')
      .order('price_month', { ascending: true });

    if (error) throw error;
    // @ts-ignore
    return data.map(plan => ({
      ...plan,
      code: 'free', // Default or derive from name
      limits: { orders: 100, products: 50, users: 1 }, // Mock defaults
      features: plan.features || []
    }));
  }

  async getSubscription(): Promise<StoreSubscription | null> {
    // Get the first store (assuming single store for now)
    const { data: stores } = await supabase.from('stores').select('id').limit(1);
    if (!stores || stores.length === 0) return null;

    const storeId = stores[0].id;

    const { data, error } = await supabase
      .from('store_subscriptions')
      .select('*, plan:store_plans(*)')
      .eq('store_id', storeId)
      .single();

    if (error) return null;

    const mappedPlan: any = data.plan ? {
      ...data.plan,
      code: 'free',
      limits: { orders: 100, products: 50, users: 1 },
      features: (data.plan as any).features || []
    } : undefined;

    return {
      ...data,
      status: data.status as any,
      period: data.period as any,
      renew_at: data.renew_at || '',
      plan: mappedPlan
    };
  }

  async updateSubscription(subscriptionId: string, planId: string, period: 'monthly' | 'yearly'): Promise<void> {
    const { error } = await supabase
      .from('store_subscriptions')
      .update({ plan_id: planId, period, updated_at: new Date().toISOString() })
      .eq('id', subscriptionId);

    if (error) throw error;
  }

  async logPriceChange(productId: string, field: string, oldValue: any, newValue: any): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('price_history').insert({
      product_id: productId,
      field_name: field,
      old_value: String(oldValue),
      new_value: String(newValue),
      changed_by: user?.id
    });
  }
  // PDV & CRM
  async getHealthInsurancePlans(): Promise<any[]> {
    const { data, error } = await supabase.from('health_insurance_plans' as any).select('*').order('name');
    if (error) throw error;
    return data;
  }

  async createCustomerQuick(customerData: Partial<Customer>): Promise<Customer> {
    const dbCustomer = {
      name: customerData.name || 'Cliente',
      phone: customerData.phone || '',
      cpf: customerData.cpf || null,
      birth_date: customerData.birthDate || null,
      referrer: customerData.referrer || null,
      insurance_plan_id: customerData.insurancePlanId || null,
      insurance_card_number: customerData.insuranceCardNumber || null,
      email: customerData.email || null,
      address: customerData.address || null,
      status: 'active',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('customers').insert(dbCustomer).select().single();
    if (error) throw error;
    return this.mapCustomer(data);
  }

  async createPDVSale(orderData: Partial<Order>, items: OrderItem[]): Promise<Order> {
    // Prepare items for JSONB
    const itemsJson = items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      priceAtPurchase: item.priceAtPurchase,
      originalPrice: item.originalPrice || item.priceAtPurchase,
      discountApplied: item.discountApplied || 0
    }));

    const { data, error } = await supabase.rpc('create_pdv_sale', {
      p_customer_id: orderData.customerId || '', // Ensure string if required, or handle null if RPC supports it
      p_total_amount: orderData.totalAmount || 0,
      p_payment_method: orderData.paymentMethod || 'money',
      p_amount_paid: orderData.amountPaid || 0,
      p_change_amount: orderData.changeAmount || 0,
      p_items: itemsJson
    });

    if (error) throw error;

    // Handle RPC return (might be array or object depending on client/driver)
    const result = Array.isArray(data) ? data[0] : data;

    if (result && !result.success) throw new Error(result.error);

    // Return a mock order object since the RPC handles everything
    // Ideally we would fetch the created order, but for UI feedback this is enough
    return {
      id: result.order_id,
      ...orderData,
      items,
      createdAt: new Date().toISOString(),
      status: OrderStatus.DELIVERED
    } as Order;
  }

  async updateCustomerStats(customerId: string): Promise<void> {
    // Calculate totals
    const { data: orders } = await supabase.from('orders').select('total_amount, created_at').eq('customer_id', customerId);

    if (!orders) return;

    const totalSpent = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    const purchaseCount = orders.length;
    const lastPurchaseDate = orders.length > 0 ? orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at : null;

    // VIP Logic (Simple rule: > R$ 1000 or > 10 purchases)
    const isVip = totalSpent > 1000 || purchaseCount > 10;

    await supabase.from('customers').update({
      total_spent: totalSpent,
      purchase_count: purchaseCount,
      last_purchase_date: lastPurchaseDate,
      is_vip: isVip
    } as any).eq('id', customerId);
  }
}

export const db = new DBService();
