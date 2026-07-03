// ═══════════════════════════════════════════════════════════════
//  LexCobra — App Root
//  Router principal con guards de autenticación y rol
// ═══════════════════════════════════════════════════════════════


import { useEffect } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './router.js';
import { useAuth } from '../features/auth/hooks/useAuth.js';
import { useTheme } from '../features/theme/hooks/useTheme.js';

export function App() {
  const { isLoading } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
        Cargando sesión...
      </div>
    );
  }

  return <RouterProvider router={router} />;
}
