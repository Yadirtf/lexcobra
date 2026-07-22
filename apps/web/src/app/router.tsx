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
import { MyProfilePage } from '../features/employees/components/MyProfilePage.js';
import { CourtsPage } from '../features/courts/components/CourtsPage.js';
import { PublicReportPage } from '../features/reports/components/PublicReportPage.js';

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

import { useNavigate } from '@tanstack/react-router';

// Dashboard page (inside layout)
const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/',
  component: DashboardPage,
  beforeLoad: () => {
    const { isSuperAdmin } = useAuth.getState();
    if (isSuperAdmin) {
      throw redirect({ to: '/admin/clientes' });
    }
  },
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

const courtsRoute = createRoute({ getParentRoute: () => appRoute, path: '/courts', component: CourtsPage });
const reportsRoute = createRoute({ getParentRoute: () => appRoute, path: '/reports', component: () => <PlaceholderPage title="Reportes" /> });
const catalogsRoute = createRoute({ getParentRoute: () => appRoute, path: '/catalogs', component: () => <PlaceholderPage title="Catálogos" /> });

// Employees route — Solo Admin (Representante Legal y Dueño del sistema)
const employeesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/employees',
  component: EmployeesListPage,
  beforeLoad: () => {
    const { isLegalRep, isSuperAdmin } = useAuth.getState();
    if (!isLegalRep && !isSuperAdmin) {
      // El asesor (rol 'Usuario') no puede ver la lista — redirigir a su perfil
      throw redirect({ to: '/my-profile' });
    }
  },
});

// My Profile route — Disponible para TODOS los roles autenticados
const myProfileRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/my-profile',
  component: MyProfilePage,
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

const adminDashboardRoute = createRoute({
  getParentRoute: () => adminRoute,
  path: '/admin/dashboard',
  beforeLoad: () => {
    throw redirect({ to: '/admin/clientes' });
  },
  component: AdminDashboardPage,
});
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
    const navigate = useNavigate();

    return (
      <LoginPage
        onLogin={async (creds) => {
          const user = await login(creds.email, creds.password);
          const isSuperAdmin = user.roles?.includes('Dueño del sistema');
          if (isSuperAdmin) {
            navigate({ to: '/admin/clientes' });
          } else {
            navigate({ to: '/' });
          }
        }}
        isLoading={isLoading}
        error={error}
      />
    );
  },
  beforeLoad: () => {
    const { isAuthenticated, isSuperAdmin } = useAuth.getState();
    if (isAuthenticated) {
      throw redirect({ to: isSuperAdmin ? '/admin/clientes' : '/' });
    }
  },
});

// Public report route (external client sharing)
const publicReportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/public/reports/$token',
  component: PublicReportPage,
});

// Build route tree
const routeTree = rootRoute.addChildren([
  loginRoute,
  publicReportRoute,
  appRoute.addChildren([
    dashboardRoute,
    portfoliosRoute,
    portfolioDetailsRoute,
    createObligationRoute,
    courtsRoute,
    reportsRoute,
    catalogsRoute,
    employeesRoute,
    myProfileRoute,
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
