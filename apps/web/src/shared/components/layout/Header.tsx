import { Link } from '@tanstack/react-router';
import { Search, LogOut, Building2, Sun, Moon, Menu } from 'lucide-react';
import { useAuth } from '../../../features/auth/hooks/useAuth.js';
import { useTheme } from '../../../features/theme/hooks/useTheme.js';
import { useQueryClient } from '@tanstack/react-query';
import './Layout.css';

interface HeaderProps {
  toggleSidebar?: () => void;
}

export function Header({ toggleSidebar }: HeaderProps) {
  const { user, logout, isSuperAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();

  // En un caso real, el tenant vendría de un contexto o del JWT (subdominio)
  const tenantName = isSuperAdmin 
    ? 'Plataforma Global' 
    : user?.clienteNombre || 'Casa de Cobranzas del Putumayo E.U.';

  const handleLogout = async () => {
    await logout();
    queryClient.clear(); // Limpia la caché de React Query para evitar fugas visuales de datos entre sesiones
  };

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        {toggleSidebar && (
          <button className="hamburger-btn" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
        )}
        {!isSuperAdmin && (
          <div className="header-search">
            <Search size={18} />
            <input type="text" placeholder="Buscar expediente, cédula, juzgado..." />
          </div>
        )}
      </div>

      <div className="header-user">
        <div className="tenant-badge hide-on-mobile">
          <Building2 size={16} color="var(--gold)" />
          {tenantName}
        </div>

        <Link to="/my-profile" className="user-profile-link" title="Gestionar Mi Perfil">
          <div className="user-profile">
            <div className="user-info hide-on-mobile" style={{ textAlign: 'right' }}>
              <span className="user-name">{user?.firstName} {user?.lastName}</span>
              <span className="user-role">{user?.roles?.[0]}</span>
            </div>
            <div className="avatar">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          </div>
        </Link>

        <button className="icon-btn" onClick={toggleTheme} title="Cambiar tema" style={{ padding: '0.4rem', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }}>
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className="logout-btn" onClick={handleLogout} title="Cerrar sesión">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
