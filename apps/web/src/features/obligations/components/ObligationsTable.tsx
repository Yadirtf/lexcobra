import { Obligation } from '../api/obligations.js';
import './Obligations.css';

interface ObligationsTableProps {
  obligations: Obligation[];
}

export function ObligationsTable({ obligations }: ObligationsTableProps) {
  if (obligations.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-3)', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)', marginTop: '1.5rem' }}>
        <p>No hay obligaciones registradas en esta cartera.</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(amount);
  };

  return (
    <div className="obligations-table-container">
      <table className="obligations-table">
        <thead>
          <tr>
            <th>Deudor Principal</th>
            <th>Nro. Crédito</th>
            <th>Capital Demandado</th>
            <th>Estado</th>
            <th>Juzgado / Radicado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {obligations.map((obs) => {
            const principalDebtor = obs.actores.find(a => a.rolActor?.nombreRol === 'Deudor Principal')?.persona;
            
            return (
              <tr key={obs.id}>
                <td>
                  <span className="debtor-name">{principalDebtor?.nombreCompleto || 'Sin deudor'}</span>
                  <span className="debtor-doc">CC: {principalDebtor?.numeroIdentificacion || 'N/A'}</span>
                </td>
                <td>{obs.numeroCredito}</td>
                <td className="currency">{formatCurrency(obs.saldoCapitalDemandado)}</td>
                <td>
                  <span className="status-badge" style={{ background: obs.estadoObligacion?.color ? `${obs.estadoObligacion.color}20` : undefined, color: obs.estadoObligacion?.color || undefined }}>
                    {obs.estadoObligacion?.nombre || 'SIN ESTADO'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>{obs.juzgado?.nombre || 'Sin Juzgado'}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-4)' }}>{obs.radicado || 'Sin radicado'}</span>
                  </div>
                </td>
                <td>
                  <button className="btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>Ver</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
