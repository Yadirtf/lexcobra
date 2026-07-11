import { useState } from 'react';
import { Eye, Pencil, FileText } from 'lucide-react';
import { Obligation } from '../api/obligations.js';
import { ViewObligationModal } from './ViewObligationModal.js';
import { UpdateObligationModal } from './UpdateObligationModal.js';
import './Obligations.css';

interface ObligationsTableProps {
  obligations: Obligation[];
}

/** Elige una clase semántica basada en el nombre del estado (fallback si no hay color dinámico). */
function getStatusClass(estado?: { nombre?: string; color?: string | null } | null): string {
  if (!estado) return 'status-badge-neutral';
  const name = (estado.nombre || '').toLowerCase();
  if (/activ|normal|vigente|al día/.test(name))    return 'status-badge-active';
  if (/mora|vencid|atras/.test(name))               return 'status-badge-warning';
  if (/castigad|castigo|perdida|irrecuperable/.test(name)) return 'status-badge-danger';
  if (/jurídic|judicial|demand|proceso/.test(name)) return 'status-badge-info';
  if (/reestructurad|acuerdo/.test(name))           return 'status-badge-purple';
  return 'status-badge-neutral';
}

export function ObligationsTable({ obligations }: ObligationsTableProps) {
  const [selectedForView, setSelectedForView] = useState<Obligation | null>(null);
  const [selectedForUpdate, setSelectedForUpdate] = useState<Obligation | null>(null);

  if (obligations.length === 0) {
    return (
      <div className="obl-empty-state">
        <FileText />
        <p>No hay obligaciones registradas en esta cartera.</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

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
            const principalDebtor = obs.actores.find(
              (a) => a.rolActor?.nombreRol === 'Deudor Principal'
            )?.persona;

            // Iniciales para el avatar si lo necesitamos
            const initials = principalDebtor?.nombreCompleto
              ? principalDebtor.nombreCompleto.split(' ').map((w: string) => w[0]).slice(0, 2).join('')
              : '??';

            // Color dinámico del estado
            const dynColor = obs.estadoObligacion?.color;
            const statusStyle = dynColor
              ? {
                  background: `${dynColor}18`,
                  color: dynColor,
                  borderColor: `${dynColor}40`,
                }
              : undefined;

            return (
              <tr key={obs.id}>
                {/* Deudor */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'var(--accent-xs)',
                        border: '1.5px solid var(--accent-s)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: 'var(--accent-h)',
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </div>
                    <div>
                      <span className="debtor-name">
                        {principalDebtor?.nombreCompleto || 'Sin deudor'}
                      </span>
                      <span className="debtor-doc">
                        CC: {principalDebtor?.numeroIdentificacion || 'N/A'}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Nro. Crédito */}
                <td>
                  <span className="credit-number">{obs.numeroCredito}</span>
                </td>

                {/* Capital */}
                <td>
                  <span className="currency">{formatCurrency(obs.saldoCapitalDemandado)}</span>
                </td>

                {/* Estado */}
                <td>
                  <span
                    className={`status-badge ${!dynColor ? getStatusClass(obs.estadoObligacion) : ''}`}
                    style={statusStyle}
                  >
                    {obs.estadoObligacion?.nombre || 'SIN ESTADO'}
                  </span>
                </td>

                {/* Juzgado / Radicado */}
                <td>
                  <span className="juzgado-name">{obs.juzgado?.nombre || 'Sin Juzgado'}</span>
                  <span className="radicado-code">{obs.radicado || 'Sin radicado'}</span>
                </td>

                {/* Acciones */}
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button
                      className="action-btn-view"
                      onClick={() => setSelectedForView(obs)}
                      title="Ver detalle"
                    >
                      <Eye size={13} />
                      Ver
                    </button>
                    <button
                      className="action-btn-edit"
                      onClick={() => setSelectedForUpdate(obs)}
                      title="Actualizar obligación"
                    >
                      <Pencil size={13} />
                      Actualizar
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {selectedForView && (
        <ViewObligationModal
          isOpen={!!selectedForView}
          onClose={() => setSelectedForView(null)}
          obligation={selectedForView}
        />
      )}

      {selectedForUpdate && (
        <UpdateObligationModal
          isOpen={!!selectedForUpdate}
          onClose={() => setSelectedForUpdate(null)}
          obligation={selectedForUpdate}
        />
      )}
    </div>
  );
}
