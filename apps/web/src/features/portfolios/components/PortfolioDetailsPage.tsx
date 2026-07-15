import { useParams, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { ChevronLeft, Plus, FileText } from 'lucide-react';
import { usePortfolios } from '../api/portfolios.js';
import { useObligations } from '../../obligations/api/obligations.js';
import { ObligationsTable } from '../../obligations/components/ObligationsTable.js';
import { GenerateReportModal } from '../../reports/components/GenerateReportModal.js';

export function PortfolioDetailsPage() {
  const { portfolioId } = useParams({ strict: false }) as { portfolioId: string };
  const { data: portfolios, isLoading: isPortfoliosLoading } = usePortfolios();
  const { data: obligations, isLoading: isObligationsLoading } = useObligations(portfolioId);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Buscar la cartera actual en la lista (lo ideal sería un endpoint getById, pero para mantenerlo simple reutilizamos el caché)
  const portfolio = portfolios?.find(p => p.id === portfolioId);

  if (isPortfoliosLoading) return <p>Cargando cartera...</p>;
  if (!portfolio) return <p>Cartera no encontrada</p>;

  return (
    <div className="portfolios-container">
      <Link to="/portfolios" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-3)', textDecoration: 'none', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
        <ChevronLeft size={16} /> Volver a Carteras
      </Link>

      <div className="portfolios-header" style={{ marginBottom: '1rem' }}>
        <div>
          <h1 className="portfolios-title">{portfolio.nombreEntidad}</h1>
          <p style={{ color: 'var(--text-4)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            NIT: {portfolio.nit || 'N/A'} | Rep. Legal: {portfolio.representante || 'N/A'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => setIsReportModalOpen(true)} 
            className="btn-secondary" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
          >
            <FileText size={18} /> Reporte de Cartera
          </button>
          <Link to="/portfolios/$portfolioId/obligations/new" params={{ portfolioId }} className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Nueva Obligación
          </Link>
        </div>
      </div>

      <div className="portfolio-stats" style={{ marginBottom: '2rem', background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div className="stat-item">
          <span className="stat-label">Total Obligaciones</span>
          <span className="stat-value">{obligations?.length || 0}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Capital Total Demandado</span>
          <span className="stat-value" style={{ color: 'var(--accent-h)' }}>
            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(
              obligations?.reduce((sum, obs) => sum + Number(obs.saldoCapitalDemandado), 0) || 0
            )}
          </span>
        </div>
      </div>

      <h3 style={{ color: 'var(--text)', marginBottom: '1rem' }}>Procesos Jurídicos</h3>
      
      {isObligationsLoading ? (
        <p>Cargando obligaciones...</p>
      ) : (
        <ObligationsTable obligations={obligations || []} />
      )}

      <GenerateReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        portfolioId={portfolioId}
        portfolioName={portfolio.nombreEntidad}
      />
    </div>
  );
}
