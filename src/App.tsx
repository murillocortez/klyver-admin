import React, { Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { TenantRoot } from './components/TenantRoot';

// Lazy Load Pages
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const ProductList = React.lazy(() => import('./pages/ProductList').then(module => ({ default: module.ProductList })));
const OrderList = React.lazy(() => import('./pages/OrderList').then(module => ({ default: module.OrderList })));
const CustomerList = React.lazy(() => import('./pages/CustomerList').then(module => ({ default: module.CustomerList })));
const CustomerProfile = React.lazy(() => import('./pages/CustomerProfile').then(module => ({ default: module.CustomerProfile })));
const Reports = React.lazy(() => import('./pages/Reports').then(module => ({ default: module.Reports })));
const CMEDMonitor = React.lazy(() => import('./pages/CMEDMonitor').then(module => ({ default: module.CMEDMonitor })));
const PDV = React.lazy(() => import('./pages/PDV').then(module => ({ default: module.PDV })));
const Settings = React.lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const Login = React.lazy(() => import('./pages/Login').then(module => ({ default: module.Login })));
const DailyOffersPage = React.lazy(() => import('./pages/DailyOffersPage').then(module => ({ default: module.DailyOffersPage })));
const AwaitingApproval = React.lazy(() => import('./pages/AwaitingApproval').then(module => ({ default: module.AwaitingApproval })));
const PlansPage = React.lazy(() => import('./pages/PlansPage').then(module => ({ default: module.PlansPage })));
const SupportPage = React.lazy(() => import('./pages/SupportPage').then(module => ({ default: module.SupportPage })));
const RestockPage = React.lazy(() => import('./pages/RestockPage').then(module => ({ default: module.RestockPage })));
const OnboardingPage = React.lazy(() => import('./pages/OnboardingPage').then(module => ({ default: module.OnboardingPage })));
const AbcCurvePage = React.lazy(() => import('./pages/AbcCurvePage').then(module => ({ default: module.AbcCurvePage })));
const CRMAutomatedPage = React.lazy(() => import('./pages/CRMAutomatedPage').then(module => ({ default: module.CRMAutomatedPage })));
const SuppliersPage = React.lazy(() => import('./pages/purchasing/SuppliersPage').then(module => ({ default: module.SuppliersPage })));
const QuotationForm = React.lazy(() => import('./pages/purchasing/QuotationForm').then(module => ({ default: module.QuotationForm })));
const PurchaseDetails = React.lazy(() => import('./pages/purchasing/PurchaseDetails').then(module => ({ default: module.PurchaseDetails })));
const QuotationsPage = React.lazy(() => import('./pages/purchasing/QuotationsPage').then(module => ({ default: module.QuotationsPage })));
const PurchasesPage = React.lazy(() => import('./pages/purchasing/PurchasesPage').then(module => ({ default: module.PurchasesPage })));
const FinancialPage = React.lazy(() => import('./pages/purchasing/FinancialPage').then(module => ({ default: module.FinancialPage })));
const CashbackCRMPage = React.lazy(() => import('./pages/CashbackCRMPage').then(module => ({ default: module.CashbackCRMPage })));

import { Role } from './types';
import { useRole } from './hooks/useRole';
import { useAuth } from './context/AuthContext';
import { useTenant } from './context/TenantContext';
import { ToastContainer } from './components/ToastContainer';

import { AccessBlocker } from './components/AccessBlocker';
import { useTenantAccessGuard } from './hooks/useTenantAccessGuard';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredPermission?: string }> = ({ children, requiredPermission }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const { canView } = useRole();
  const { tenant, isBlocked, blockedReason } = useTenantAccessGuard(); // Use Guard Hook
  const location = useLocation();

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!isAuthenticated) return <Navigate to="../login" replace relative="path" />;

  // --- BLOCK CHECK ---
  if (isBlocked && tenant) {
    return <AccessBlocker tenant={tenant} reason={blockedReason || undefined} />;
  }
  // -------------------

  // --- ONBOARDING CHECK ---
  // If tenant is pending, FORCE onboarding, unless we are already there.
  // We use string check on path because relative navigation is tricky inside this logic
  if (tenant?.onboarding_status === 'pending') {
    // If the current route is NOT onboarding, redirect to it.
    // We assume this component is rendered UNDER /:slug/, so relative to current tenant root.
    // However, we are inside specific routes.
    // The easiest check is if we are rendering the <OnboardingPage /> child? No.
    if (!location.pathname.includes('/onboarding')) {
      return <Navigate to={`/${tenant.slug}/onboarding`} replace />;
    }
    // If we ARE on onboarding, allow it (fall through to return children, likely Layout which we might want to hide?)
    // Actually, OnboardingPage has its own layout, so we probably shouldn't wrap it in <Layout> if we can avoid it.
    // But ProtectedRoute wraps children in <Layout>.
    // We should probably NOT use ProtectedRoute for OnboardingPage, OR make ProtectedRoute smart enough to skip Layout for onboarding.
    // For now, let's keep it simple: OnboardingPage will be rendered inside Layout? No, User requested specific onboarding UI.
    // So OnboardingRoute should be separate or ProtectedRoute should handle "no layout".

    // Let's create a separate logic for Onboarding below in Routes.
  } else if (tenant?.onboarding_status === 'completed' && location.pathname.includes('/onboarding')) {
    // If completed and trying to go to onboarding, go to dashboard
    return <Navigate to={`/${tenant.slug}/dashboard`} replace />;
  }
  // ------------------------

  if (user?.role === Role.NO_ACCESS || user?.role === Role.NENHUM) {
    return <Navigate to="../aguardando-aprovacao" replace relative="path" />;
  }

  if (requiredPermission && !canView(requiredPermission)) {
    if (user?.role === Role.OPERADOR && requiredPermission === 'dashboard') {
      return <Navigate to="../orders" replace relative="path" />;
    }
    return <Navigate to="../dashboard" replace relative="path" />;
  }

  return <Layout>{children}</Layout>;
};

const AwaitingApprovalRoute: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="../login" replace relative="path" />;
  if (user?.role !== Role.NO_ACCESS && user?.role !== Role.NENHUM) return <Navigate to="../dashboard" replace relative="path" />;
  return <AwaitingApproval />;
};

// Simple wrapper for Onboarding that checks Auth but NO Layout
const OnboardingRoute: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const { tenant } = useTenant();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="../login" replace relative="path" />;

  // If already completed, kick out
  if (tenant?.onboarding_status === 'completed') {
    return <Navigate to={`/${tenant.slug}/dashboard`} replace />;
  }

  return <OnboardingPage />;
};

const RootRedirect: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tenant = searchParams.get('tenant');
  // @ts-ignore
  const defaultTenant = import.meta.env.VITE_DEFAULT_TENANT_SLUG_ADMIN || 'farma-vida';
  if (tenant) {
    return <Navigate to={`/${tenant}/dashboard`} replace />;
  }
  return <Navigate to={`/${defaultTenant}/dashboard`} replace />;
};

const App: React.FC = () => {
  return (
    <>
      <ToastContainer />
      <Router>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>}>
          <Routes>
            {/* Default Redirect: Checks for ?tenant=slug or defaults to farmavida */}
            <Route path="/" element={<RootRedirect />} />

            <Route path="/:slug" element={<TenantRoot />}>
              <Route path="login" element={<Login />} />

              {/* Onboarding Route - No Layout, Protected */}
              <Route path="onboarding" element={<OnboardingRoute />} />

              <Route path="support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />
              <Route path="ofertas-do-dia" element={<DailyOffersPage />} />
              <Route path="aguardando-aprovacao" element={<AwaitingApprovalRoute />} />

              <Route path="dashboard" element={<ProtectedRoute requiredPermission="dashboard"><Dashboard /></ProtectedRoute>} />
              <Route index element={<Navigate to="dashboard" replace />} />

              <Route path="products" element={<ProtectedRoute requiredPermission="products"><ProductList /></ProtectedRoute>} />
              <Route path="orders" element={<ProtectedRoute requiredPermission="orders"><OrderList /></ProtectedRoute>} />
              <Route path="customers" element={<ProtectedRoute requiredPermission="customers"><CustomerList /></ProtectedRoute>} />
              <Route path="admin/crm" element={<ProtectedRoute requiredPermission="customers"><CRMAutomatedPage /></ProtectedRoute>} />
              <Route path="customers/:id" element={<ProtectedRoute requiredPermission="customers"><CustomerProfile /></ProtectedRoute>} />
              <Route path="reports" element={<ProtectedRoute requiredPermission="reports"><Reports /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute requiredPermission="settings"><Settings /></ProtectedRoute>} />
              <Route path="daily-offers" element={<ProtectedRoute requiredPermission="daily-offers"><DailyOffersPage /></ProtectedRoute>} />
              <Route path="plans" element={<ProtectedRoute><PlansPage /></ProtectedRoute>} />
              <Route path="admin/cmed-monitor" element={<ProtectedRoute><CMEDMonitor /></ProtectedRoute>} />
              <Route path="admin/pdv" element={<ProtectedRoute><PDV /></ProtectedRoute>} />

              <Route path="admin/configuracoes-fiscal" element={<Navigate to="../settings?tab=fiscal" replace relative="path" />} />
              <Route path="admin/fiscal" element={<Navigate to="../settings?tab=fiscal" replace relative="path" />} />

              <Route path="admin/curva-abc" element={<ProtectedRoute requiredPermission="reports"><AbcCurvePage /></ProtectedRoute>} />

              <Route path="admin/suppliers" element={<ProtectedRoute><SuppliersPage /></ProtectedRoute>} />
              <Route path="admin/quotations" element={<ProtectedRoute><QuotationsPage /></ProtectedRoute>} />
              <Route path="admin/quotations/:id" element={<ProtectedRoute><QuotationForm /></ProtectedRoute>} />
              <Route path="admin/purchases" element={<ProtectedRoute><PurchasesPage /></ProtectedRoute>} />
              <Route path="admin/purchases/:id" element={<ProtectedRoute><PurchaseDetails /></ProtectedRoute>} />
              <Route path="admin/financial" element={<ProtectedRoute><FinancialPage /></ProtectedRoute>} />

              <Route path="admin/reposicao" element={<ProtectedRoute><RestockPage /></ProtectedRoute>} />

              <Route path="admin/crm/cashback" element={<ProtectedRoute><CashbackCRMPage /></ProtectedRoute>} />

              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </>
  );
};

export default App;
