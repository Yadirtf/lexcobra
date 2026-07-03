import { LayoutDashboard } from 'lucide-react';

export function AdminDashboardPage() {
  return (
    <div className="portfolios-container">
      <div className="portfolios-header">
        <h1 className="portfolios-title">Resumen Global (LexCobra SaaS)</h1>
      </div>
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-3)', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)', marginTop: '1.5rem' }}>
        <LayoutDashboard size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
        <h2>Módulo en construcción</h2>
        <p style={{ marginTop: '0.5rem' }}>Aquí verás métricas como MRR, Active Tenants y Server Load.</p>
      </div>
    </div>
  );
}
