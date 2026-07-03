import { Users, Plus } from 'lucide-react';

export function AdminUsersPage() {
  return (
    <div className="portfolios-container">
      <div className="portfolios-header">
        <h1 className="portfolios-title">Usuarios Internos (Soporte LexCobra)</h1>
        <button className="btn-primary" disabled>
          <Plus size={18} /> Nuevo Usuario
        </button>
      </div>
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-3)', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)', marginTop: '1.5rem' }}>
        <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
        <h2>Módulo en construcción</h2>
        <p style={{ marginTop: '0.5rem' }}>Administra los empleados internos de LexCobra con acceso a la gestión de inquilinos.</p>
      </div>
    </div>
  );
}
