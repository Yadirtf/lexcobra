import { useState } from 'react';
import { Plus, Building, Edit2, Power, PowerOff } from 'lucide-react';
import { usePortfolios, Portfolio, useUpdatePortfolio } from '../api/portfolios.js';
import { CreatePortfolioModal } from './CreatePortfolioModal.js';
import { UpdatePortfolioModal } from './UpdatePortfolioModal.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import './Portfolios.css';

import { Link } from '@tanstack/react-router';

export function PortfoliosListPage() {
  const { data: portfolios, isLoading, error } = usePortfolios();
  const { canManageUsers } = useAuth(); // LegalRep and SuperAdmin
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const { mutateAsync: updatePortfolio } = useUpdatePortfolio();

  const handleToggleStatus = async (portfolio: Portfolio) => {
    try {
      await updatePortfolio({
        id: portfolio.id,
        data: { activo: !portfolio.activo }
      });
    } catch (e) {
      alert('Error al cambiar el estado de la cartera');
    }
  };

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
          <div key={portfolio.id} className="portfolio-card-wrapper">
            <Link 
              to="/portfolios/$portfolioId" 
              params={{ portfolioId: portfolio.id }} 
              className="portfolio-card"
              style={portfolio.logoUrl ? {
                backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.6) 100%), url(${portfolio.logoUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: '#fff',
                textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                border: '1px solid rgba(255,255,255,0.1)'
              } : undefined}
            >
              <div className="portfolio-card-header">
                <div>
                  <h3 className="portfolio-name" style={portfolio.logoUrl ? { color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.8)' } : {}}>{portfolio.nombreEntidad}</h3>
                  <span className="portfolio-taxid" style={portfolio.logoUrl ? { color: 'rgba(255,255,255,0.9)', textShadow: '0 1px 2px rgba(0,0,0,0.8)' } : {}}>
                    {portfolio.nit ? `NIT: ${portfolio.nit}` : 'Sin NIT registrado'}
                  </span>
                </div>
                <span className={`status-badge ${!portfolio.activo ? 'inactive' : ''}`}>
                  {portfolio.activo ? 'ACTIVA' : 'INACTIVA'}
                </span>
              </div>

              <div className="portfolio-stats">
                <div className="stat-item">
                  <span className="stat-label" style={portfolio.logoUrl ? { color: '#bbb' } : {}}>Obligaciones</span>
                  <span className="stat-value">{portfolio._count?.obligaciones || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label" style={portfolio.logoUrl ? { color: '#bbb' } : {}}>Recaudo Estimado</span>
                  <span className="stat-value" style={portfolio.logoUrl ? { color: '#4ade80' } : { color: 'var(--accent-h)' }}>$ 0</span>
                </div>
              </div>
            </Link>

            {canManageUsers && (
              <div className="portfolio-card-actions">
                <button 
                  className="icon-btn action-btn toggle-status-btn" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggleStatus(portfolio);
                  }}
                  title={portfolio.activo ? "Desactivar Cartera" : "Activar Cartera"}
                >
                  {portfolio.activo ? <PowerOff size={16} color="#ef4444" /> : <Power size={16} color="#22c55e" />}
                </button>
                <button 
                  className="icon-btn action-btn edit-portfolio-btn" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedPortfolio(portfolio);
                  }}
                  title="Editar Cartera"
                >
                  <Edit2 size={18} color="#4ade80" />
                </button>
              </div>
            )}
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

      <UpdatePortfolioModal 
        isOpen={!!selectedPortfolio}
        onClose={() => setSelectedPortfolio(null)}
        portfolio={selectedPortfolio}
      />
    </div>
  );
}
