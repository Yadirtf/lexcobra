import { useState } from 'react';
import { Plus, Building } from 'lucide-react';
import { usePortfolios } from '../api/portfolios.js';
import { CreatePortfolioModal } from './CreatePortfolioModal.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import './Portfolios.css';

import { Link } from '@tanstack/react-router';

export function PortfoliosListPage() {
  const { data: portfolios, isLoading, error } = usePortfolios();
  const { canManageUsers } = useAuth(); // LegalRep and SuperAdmin
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="portfolios-container">
      <div className="portfolios-header">
        <h1 className="portfolios-title">Carteras Asignadas</h1>
        {canManageUsers && (
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Nueva Cartera
          </button>
        )}
      </div>

      {isLoading && <p style={{ color: 'var(--text-3)' }}>Cargando carteras...</p>}
      {error && <p style={{ color: '#ef4444' }}>Ocurrió un error al cargar las carteras.</p>}

      <div className="portfolios-grid">
        {portfolios?.map((portfolio) => (
          <div key={portfolio.id} className="portfolio-card">
            <div className="portfolio-card-header">
              <div>
                <h3 className="portfolio-name">{portfolio.nombreEntidad}</h3>
                <span className="portfolio-taxid">
                  {portfolio.nit ? `NIT: ${portfolio.nit}` : 'Sin NIT registrado'}
                </span>
              </div>
              <span className={`status-badge ${!portfolio.activo ? 'inactive' : ''}`}>
                {portfolio.activo ? 'ACTIVA' : 'INACTIVA'}
              </span>
            </div>

            <div className="portfolio-stats">
              <div className="stat-item">
                <span className="stat-label">Obligaciones</span>
                <span className="stat-value">{portfolio._count?.obligaciones || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Recaudo Estimado</span>
                <span className="stat-value" style={{ color: 'var(--accent-h)' }}>$ 0</span>
              </div>
            </div>

            <div className="portfolio-actions">
              <Link to="/portfolios/$portfolioId" params={{ portfolioId: portfolio.id }} className="btn-secondary" style={{ textDecoration: 'none' }}>
                Ver Detalles
              </Link>
            </div>
          </div>
        ))}

        {portfolios?.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-3)', border: '1px dashed var(--border)', borderRadius: '12px' }}>
            <Building size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
            <p>No hay carteras registradas o no tienes acceso a ninguna.</p>
          </div>
        )}
      </div>

      <CreatePortfolioModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
