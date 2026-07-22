import { Link, useLocation } from '@tanstack/react-router';
import { LayoutDashboard, Briefcase, Scale, BarChart3, Settings, Users, CreditCard, Building2, X, MapPin } from 'lucide-react';
import { useAuth } from '../../../features/auth/hooks/useAuth.js';
import './Layout.css';

interface SidebarProps {
  isOpen?: boolean;
  closeSidebar?: () => void;
}

export function Sidebar({ isOpen, closeSidebar }: SidebarProps) {
  const location = useLocation();
  const { isSuperAdmin, isLegalRep } = useAuth();

  // Menú para el Dueño del Sistema (LexCobra SaaS)
  const adminNavigation = [
    { name: 'Casas de Cobranza', path: '/admin/clientes', icon: Building2 },
    { name: 'Planes & Facturación', path: '/admin/planes', icon: CreditCard },
    { name: 'Catálogos Globales', path: '/admin/catalogos', icon: Settings },
    { name: 'Ubicaciones (Colombia)', path: '/admin/ubicaciones', icon: MapPin },
    { name: 'Usuarios Internos', path: '/admin/usuarios', icon: Users },
  ];

  // Menú para los Clientes (Casas de Cobranza / Tenants)
  const tenantNavigation = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Carteras', path: '/portfolios', icon: Briefcase },
    { name: 'Juzgados', path: '/courts', icon: Scale },
    { name: 'Reportes', path: '/reports', icon: BarChart3 },
    ...(isLegalRep ? [{ name: 'Asesores', path: '/employees', icon: Users }] : []),
  ];

  const navigation = isSuperAdmin ? adminNavigation : tenantNavigation;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <Scale size={24} color="var(--gold)" />
          Lex<span>Cobra</span>
        </div>
        {closeSidebar && (
          <button className="mobile-close-btn" onClick={closeSidebar}>
            <X size={20} />
          </button>
        )}
      </div>
      
      <nav className="sidebar-nav">
        {navigation.map((item) => {
          const isActive = location.pathname === item.path || 
                          (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (closeSidebar && window.innerWidth <= 768) {
                  closeSidebar();
                }
              }}
            >
              <item.icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
