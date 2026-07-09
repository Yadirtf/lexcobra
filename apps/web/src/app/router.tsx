import { createRouter, createRoute, createRootRoute, redirect } from '@tanstack/react-router';
import { AppLayout } from '../shared/components/layout/AppLayout.js';
import { LoginPage } from '../features/auth/components/LoginPage.js';
import { DashboardPage } from '../features/dashboard/components/DashboardPage.js';
import { PortfoliosListPage } from '../features/portfolios/components/PortfoliosListPage.js';
import { PortfolioDetailsPage } from '../features/portfolios/components/PortfolioDetailsPage.js';
import { useAuth } from '../features/auth/hooks/useAuth.js';
import { AdminDashboardPage } from '../features/admin/components/AdminDashboardPage.js';
import { TenantsListPage } from '../features/admin/components/TenantsListPage.js';
import { AdminPlansPage } from '../features/admin/components/AdminPlansPage.js';
import { AdminCatalogsPage } from '../features/admin/components/AdminCatalogsPage.js';
import { AdminUsersPage } from '../features/admin/components/AdminUsersPage.js';
import { AdminLocationsPage } from '../features/admin/components/AdminLocationsPage.js';
import { EmployeesListPage } from '../features/employees/components/EmployeesListPage.js';
import { CourtsPage } from '../features/courts/components/CourtsPage.js';

// Root route
const rootRoute = createRootRoute();

// Layout route (protected)
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  component: AppLayout,
  beforeLoad: () => {
    const { isAuthenticated } = useAuth.getState();
    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
});

// Dashboard page (inside layout)
const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/',
  component: DashboardPage,
});

// Portfolios list page
const portfoliosRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/portfolios',
  component: PortfoliosListPage,
});

// Portfolio details page
const portfolioDetailsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/portfolios/$portfolioId',
  component: PortfolioDetailsPage,
});

import { CreateObligationPage } from '../features/obligations/components/CreateObligationPage.js';
// Create obligation page
const createObligationRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/portfolios/$portfolioId/obligations/new',
  component: CreateObligationPage,
});

// Placeholders for other pages
const PlaceholderPage = ({ title }: { title: string }) => (
  <div style={{ padding: '2rem' }}>
    <h1>{title}</h1>
    <p>Esta sección se implementará en las próximas fases.</p>
  </div>
);

const obligationsRoute = createRoute({ getParentRoute: () => appRoute, path: '/obligations', component: () => <PlaceholderPage title="Obligaciones" /> });
const courtsRoute = createRoute({ getParentRoute: () => appRoute, path: '/courts', component: CourtsPage });
const reportsRoute = createRoute({ getParentRoute: () => appRoute, path: '/reports', component: () => <PlaceholderPage title="Reportes" /> });
const catalogsRoute = createRoute({ getParentRoute: () => appRoute, path: '/catalogs', component: () => <PlaceholderPage title="Catálogos" /> });

// Employees route (Tenant level)
const employeesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/employees',
  component: EmployeesListPage,
});

// ── Admin Routes (Protected by RBAC) ──────────────────────────
const adminRoute = createRoute({
  getParentRoute: () => appRoute,
  id: 'admin',
  beforeLoad: () => {
    const { isSuperAdmin } = useAuth.getState();
    if (!isSuperAdmin) {
      throw redirect({ to: '/' });
    }
  },
});

const adminDashboardRoute = createRoute({ getParentRoute: () => adminRoute, path: '/admin/dashboard', component: AdminDashboardPage });
const adminTenantsRoute = createRoute({ getParentRoute: () => adminRoute, path: '/admin/clientes', component: TenantsListPage });
const adminPlansRoute = createRoute({ getParentRoute: () => adminRoute, path: '/admin/planes', component: AdminPlansPage });
const adminCatalogsRoute = createRoute({ getParentRoute: () => adminRoute, path: '/admin/catalogos', component: AdminCatalogsPage });
const adminUsersRoute = createRoute({ getParentRoute: () => adminRoute, path: '/admin/usuarios', component: AdminUsersPage });
const adminLocationsRoute = createRoute({ getParentRoute: () => adminRoute, path: '/admin/ubicaciones', component: AdminLocationsPage });

// Login route (public)
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: function LoginRoute() {
    const { login, isLoading, error } = useAuth();
    return <LoginPage onLogin={async (creds) => { await login(creds.email, creds.password); }} isLoading={isLoading} error={error} />;
  },
  beforeLoad: () => {
    const { isAuthenticated } = useAuth.getState();
    if (isAuthenticated) {
      throw redirect({ to: '/' });
    }
  },
});

// Build route tree
const routeTree = rootRoute.addChildren([
  loginRoute,
  appRoute.addChildren([
    dashboardRoute,
    portfoliosRoute,
    portfolioDetailsRoute,
    createObligationRoute,
    obligationsRoute,
    courtsRoute,
    reportsRoute,
    catalogsRoute,
    employeesRoute,
    adminRoute.addChildren([
      adminDashboardRoute,
      adminTenantsRoute,
      adminPlansRoute,
      adminCatalogsRoute,
      adminUsersRoute,
      adminLocationsRoute,
    ]),
  ]),
]);

// Create router
export const router = createRouter({ routeTree });

// Register router types for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
