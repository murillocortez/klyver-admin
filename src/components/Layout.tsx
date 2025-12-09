import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Menu,
  X,
  Check,
  ChevronDown,
  Search,
  HelpCircle,
  CreditCard,
  Store,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Printer,
  ClipboardList,
  Truck,
  Calculator,
  ShoppingBag,
  DollarSign,
  RefreshCw,
  Banknote,
  Headphones,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { db } from '../services/dbService';
import { AppNotification } from '../types';
import { PlanBadge } from './PlanBadge';
import { useSubscription } from '../context/SubscriptionContext';

interface SidebarItemProps {
  icon: any;
  label: string;
  path: string;
  active: boolean;
  collapsed?: boolean;
  locked?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, path, active, collapsed, locked }) => {
  const content = (
    <>
      <div className="relative">
        <Icon size={18} className={`transition-colors ${active ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'} ${locked ? 'opacity-50' : ''}`} />
        {locked && (
          <div className="absolute -top-1.5 -right-1.5 bg-gray-100 rounded-full p-0.5 border border-white shadow-sm">
            <Lock size={10} className="text-gray-500" />
          </div>
        )}
      </div>
      {!collapsed && <span className={`text-sm ${locked ? 'text-gray-400' : ''}`}>{label}</span>}
    </>
  );

  if (locked) {
    return (
      <div
        className={`flex items-center ${collapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-2.5 mx-3 rounded-lg cursor-not-allowed group opacity-70`}
        title="Disponível em planos superiores"
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      to={path}
      className={`flex items-center ${collapsed ? 'justify-center px-2' : 'space-x-3 px-4'} py-2.5 mx-3 rounded-lg transition-all duration-200 group
            ${active
          ? 'bg-primary/10 text-primary font-medium shadow-sm'
          : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
        }`}
      title={collapsed ? label : undefined}
    >
      {content}
    </Link>
  );
};

// New helper component for grouped items
const SidebarGroup: React.FC<{
  icon: any;
  label: string;
  active: boolean;
  collapsed?: boolean;
  children: React.ReactNode;
}> = ({ icon: Icon, label, active, collapsed, children }) => {
  const [isOpen, setIsOpen] = useState(active);

  useEffect(() => {
    if (active) setIsOpen(true);
  }, [active]);

  if (collapsed) {
    return <>{children}</>;
  }

  return (
    <div className="mx-3 mb-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 group text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 ${active ? 'text-gray-900 font-medium' : ''}`}
      >
        <div className="flex items-center space-x-3">
          <Icon size={18} className={`transition-colors ${active ? 'text-primary' : 'text-gray-400 group-hover:text-gray-600'}`} />
          <span className="text-sm">{label}</span>
        </div>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="mt-1 ml-4 border-l-2 border-gray-100 pl-2 space-y-1 animate-in slide-in-from-top-1">
          {children}
        </div>
      )}
    </div>
  );
};

const SidebarSection: React.FC<{ title: string; children: React.ReactNode; collapsed?: boolean }> = ({ title, children, collapsed }) => (
  <div className="mb-6">
    {!collapsed && <h3 className="px-7 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{title}</h3>}
    {collapsed && <div className="h-4"></div>}
    <div className="space-y-0.5">
      {children}
    </div>
  </div>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { isFeatureEnabled } = useSubscription();
  const { tenant } = useTenant();

  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetchNotifications();
    fetchSettings();
    const interval = setInterval(fetchNotifications, 30000);
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setShowNotifications(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => { clearInterval(interval); document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  const fetchNotifications = async () => {
    const data = await db.getNotifications();
    setNotifications(data);
  };
  const fetchSettings = async () => { try { const data = await db.getSettings(); setSettings(data); } catch (e) { } };
  const handleLogout = () => { logout(); navigate(`/${tenant?.slug || 'farmavida'}/login`); };
  const handleMarkAsRead = async (id: string) => { await db.markNotificationAsRead(id); setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)); };
  const handleMarkAllRead = async () => { await db.markAllNotificationsAsRead(); setNotifications(prev => prev.map(n => ({ ...n, read: true }))); };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Helper to prefix paths with current tenant slug
  const p = (path: string) => `/${tenant?.slug || 'farmavida'}${path}`;
  const isActive = (key: string) => location.pathname.includes(key);

  return (
    <div className="flex h-screen bg-[#f8f9fa] overflow-hidden font-sans">
      <aside className={`hidden md:flex flex-col ${isSidebarCollapsed ? 'w-20' : 'w-72'} bg-white/80 backdrop-blur-xl border-r border-gray-200/60 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300`}>
        <div className={`flex ${isSidebarCollapsed ? 'flex-col items-center py-6 gap-6' : 'items-center justify-between p-6'} mb-2 transition-all duration-300`}>
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
            {tenant?.logo_url ? <img src={tenant.logo_url} alt="Logo" className="w-9 h-9 object-contain" /> : <div className="w-9 h-9 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20 shrink-0">{tenant?.display_name?.charAt(0).toUpperCase() || settings?.pharmacy?.name?.charAt(0).toUpperCase() || 'F'}</div>}
            {!isSidebarCollapsed && <div className="overflow-hidden"><span className="block text-sm font-bold text-gray-900 leading-tight truncate">{tenant?.display_name || settings?.pharmacy?.name || 'PharmaDash'}</span><div className="mt-1"><PlanBadge /></div></div>}
          </div>
          <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className={`text-gray-400 hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-gray-100 ${isSidebarCollapsed ? 'bg-gray-50' : ''}`}>{isSidebarCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}</button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <SidebarSection title="Visão Geral" collapsed={isSidebarCollapsed}>
            <SidebarItem icon={LayoutDashboard} label="Dashboard" path={p('/dashboard')} active={isActive('dashboard') && !isActive('reports')} collapsed={isSidebarCollapsed} />

            <SidebarGroup icon={BarChart3} label="Gestão & BI" active={isActive('reports') || isActive('curva-abc')} collapsed={isSidebarCollapsed}>
              <SidebarItem icon={FileText} label="Relatórios" path={p('/reports')} active={isActive('reports')} collapsed={isSidebarCollapsed} />
              <SidebarItem icon={ClipboardList} label="Curva ABC" path={p('/admin/curva-abc')} active={isActive('admin/curva-abc')} collapsed={isSidebarCollapsed} locked={!isFeatureEnabled('curve_abc')} />
            </SidebarGroup>

            <SidebarGroup icon={ShoppingBag} label="Compras" active={isActive('admin/suppliers') || isActive('admin/quotations') || isActive('admin/purchases') || isActive('admin/financial')} collapsed={isSidebarCollapsed}>
              <SidebarItem icon={Truck} label="Fornecedores" path={p('/admin/suppliers')} active={isActive('admin/suppliers')} collapsed={isSidebarCollapsed} />
              <SidebarItem icon={Calculator} label="Cotação" path={p('/admin/quotations')} active={isActive('admin/quotations')} collapsed={isSidebarCollapsed} />
              <SidebarItem icon={ShoppingBag} label="Pedidos Compra" path={p('/admin/purchases')} active={isActive('admin/purchases')} collapsed={isSidebarCollapsed} />
              <SidebarItem icon={DollarSign} label="Financeiro" path={p('/admin/financial')} active={isActive('admin/financial')} collapsed={isSidebarCollapsed} />
            </SidebarGroup>
          </SidebarSection>

          <SidebarSection title="Operação" collapsed={isSidebarCollapsed}>
            <SidebarItem icon={ShoppingCart} label="Pedidos" path={p('/orders')} active={isActive('orders')} collapsed={isSidebarCollapsed} />
            <SidebarItem icon={Store} label="PDV / Caixa" path={p('/admin/pdv')} active={isActive('admin/pdv')} collapsed={isSidebarCollapsed} />
            <SidebarItem icon={Package} label="Produtos & Estoque" path={p('/products')} active={isActive('products')} collapsed={isSidebarCollapsed} />

            <SidebarGroup icon={Users} label="Clientes CRM" active={isActive('customers') || isActive('admin/crm') || isActive('admin/crm/cashback')} collapsed={isSidebarCollapsed}>
              <SidebarItem icon={Users} label="Lista de Clientes" path={p('/customers')} active={isActive('customers') && !isActive('admin/crm')} collapsed={isSidebarCollapsed} />
              <SidebarItem icon={RefreshCw} label="CRM Automático" path={p('/admin/crm')} active={isActive('admin/crm') && !isActive('cashback')} collapsed={isSidebarCollapsed} />
              <SidebarItem icon={Banknote} label="Cashback" path={p('/admin/crm/cashback')} active={isActive('admin/crm/cashback')} collapsed={isSidebarCollapsed} locked={!isFeatureEnabled('cashback')} />
            </SidebarGroup>

          </SidebarSection>

          <SidebarSection title="Sistema" collapsed={isSidebarCollapsed}>
            <SidebarItem icon={Headphones} label="Suporte" path={p('/support')} active={isActive('support')} collapsed={isSidebarCollapsed} />
            <SidebarItem icon={Settings} label="Configurações" path={p('/settings')} active={isActive('settings')} collapsed={isSidebarCollapsed} />
            <SidebarItem icon={CreditCard} label="Meu Plano" path={p('/plans')} active={isActive('plans')} collapsed={isSidebarCollapsed} />
          </SidebarSection>
        </nav>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className={`bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-200 to-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate capitalize">{user?.role}</p>
              </div>
            )}
            {!isSidebarCollapsed && (
              <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition-colors">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/20 backdrop-blur-sm md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="w-72 bg-white h-full shadow-2xl p-4 animate-in slide-in-from-left duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <span className="text-xl font-bold text-gray-900">Menu</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>
            <nav className="space-y-1">
              <SidebarItem icon={LayoutDashboard} label="Dashboard" path={p('/dashboard')} active={isActive('dashboard')} />
              <SidebarItem icon={ShoppingCart} label="Pedidos" path={p('/orders')} active={isActive('orders')} />
              <SidebarItem icon={Package} label="Produtos" path={p('/products')} active={isActive('products')} />
              <SidebarItem icon={Users} label="Clientes" path={p('/customers')} active={isActive('customers')} />
              <SidebarItem icon={Settings} label="Configurações" path={p('/settings')} active={isActive('settings')} />
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/60 flex items-center justify-between px-6 z-40 sticky top-0">
          <div className="flex items-center md:hidden">
            <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-500 hover:text-gray-700 p-2 -ml-2">
              <Menu size={20} />
            </button>
          </div>

          {/* Search Bar (Visual Only) */}
          <div className="hidden md:flex items-center bg-gray-100/50 border border-gray-200 rounded-lg px-3 py-1.5 w-64 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
            <Search size={14} className="text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="Buscar..."
              className="bg-transparent border-none outline-none text-sm text-gray-600 w-full placeholder-gray-400"
            />
            <span className="text-[10px] text-gray-400 border border-gray-200 rounded px-1.5 bg-white">⌘K</span>
          </div>

          <div className="flex items-center space-x-3">
            <button className="hidden md:flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <HelpCircle size={18} />
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative w-8 h-8 flex items-center justify-center rounded-full transition-all ${showNotifications ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-float border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-semibold text-gray-800 text-xs uppercase tracking-wider">Notificações</h3>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="text-[10px] text-primary hover:underline font-medium">
                        Marcar todas lidas
                      </button>
                    )}
                  </div>
                  <div className="max-h-[24rem] overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-sm">
                        <Bell size={24} className="mx-auto mb-2 opacity-20" />
                        Nenhuma notificação recente.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-start gap-3 group ${!n.read ? 'bg-blue-50/30' : ''}`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type === 'success' ? 'bg-green-500' : n.type === 'warning' ? 'bg-orange-500' : 'bg-primary'}`}></div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!n.read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                          </div>
                          {!n.read && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMarkAsRead(n.id); }}
                              className="text-gray-300 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-1"
                              title="Marcar como lida"
                            >
                              <Check size={14} />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
              >
                <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=random`} alt="User" className="w-7 h-7 rounded-full object-cover" />
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-float border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-3 border-b border-gray-50">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <div className="p-1">
                    <Link to={p('/settings')} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      <Settings size={16} />
                      Configurações
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left">
                      <LogOut size={16} />
                      Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
