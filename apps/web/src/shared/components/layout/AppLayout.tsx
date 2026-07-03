import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from '@tanstack/react-router';
import { Sidebar } from './Sidebar.js';
import { Header } from './Header.js';
import { useAuth } from '../../../features/auth/hooks/useAuth.js';
import './Layout.css';

export function AppLayout() {
  const { isSuperAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="root-layout">
      {isSuperAdmin && (
        <div className="superadmin-banner">
          🔒 Estás navegando en modo Super Administrador (LexCobra SaaS)
        </div>
      )}
      <div className="app-layout">
        <div 
          className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} 
          onClick={() => setIsSidebarOpen(false)}
        />
        
        <Sidebar isOpen={isSidebarOpen} closeSidebar={() => setIsSidebarOpen(false)} />
        
        <div className="main-content">
          <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
          <main className="page-container">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
