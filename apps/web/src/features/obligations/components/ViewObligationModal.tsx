import { X, FileText, Scale, Users, Clock, BookOpen, ArrowRight, User, Info, AlertCircle } from 'lucide-react';
import { Obligation, useObligationHistory } from '../api/obligations.js';
import { useCatalogs } from '../../../shared/api/catalogs.js';
import { useJuzgados } from '../api/catalogs.js';
import './Obligations.css';

interface ViewObligationModalProps {
  obligation: Obligation | null;
  isOpen: boolean;
  onClose: () => void;
}

/** Elige clase semántica según nombre del estado */
function getStatusClass(estado?: { nombre?: string; color?: string | null } | null): string {
  if (!estado) return 'status-badge-neutral';
  const n = (estado.nombre || '').toLowerCase();
  if (/activ|normal|vigente|al día/.test(n))           return 'status-badge-active';
  if (/mora|vencid|atras/.test(n))                      return 'status-badge-warning';
  if (/castigad|perdida|irrecuperable/.test(n))         return 'status-badge-danger';
  if (/jurídic|judicial|demand|proceso/.test(n))        return 'status-badge-info';
  if (/reestructurad|acuerdo/.test(n))                  return 'status-badge-purple';
  return 'status-badge-neutral';
}

/** Mapea nombre técnico del campo a etiqueta legible */
const FIELD_LABELS: Record<string, string> = {
  estadoObligacionId:              'Estado de Obligación',
  nivelRecuperacionId:             'Nivel de Recuperación',
  juzgadoId:                       'Juzgado',
  radicado:                        'Radicado',
  numeroCredito:                   'Número de Crédito',
  saldoCapitalDemandado:           'Saldo Capital Demandado',
  medidaCautelarId:                'Medida Cautelar',
  fechaReparto:                    'Fecha de Reparto',
  fechaPresentacionDemanda:        'Fecha de Demanda',
  mandamientoPagoFecha:            'Fecha Mandamiento de Pago',
  autoSeguirEjecucionFecha:        'Fecha Auto Seguir Ejecución',
  liquidacionCreditoAprobadaFecha: 'Fecha Liquidación de Crédito',
};

export function ViewObligationModal({ obligation, isOpen, onClose }: ViewObligationModalProps) {
  const { data: history, isLoading } = useObligationHistory(
    obligation?.id || '',
    isOpen && !!obligation
  );

  // Cargar todos los catálogos para resolver IDs → nombres en la auditoría
  const { estadosObligacion, nivelesRecuperacion } = useCatalogs();
  const { data: juzgados } = useJuzgados();

  if (!isOpen || !obligation) return null;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

  const formatDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  /**
   * Dada la clave del campo y un valor (posiblemente UUID), intenta resolverlo
   * a un texto legible usando los catálogos en memoria.
   */
  const resolveValue = (campo: string, valor: string | null): string => {
    if (!valor) return 'N/A';

    // Es un UUID? → intentar resolver con catálogos
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor);
    if (!isUUID) {
      // Podría ser fecha ISO, formatearla si parece serlo
      if (/^\d{4}-\d{2}-\d{2}T/.test(valor)) {
        try { return formatDateTime(valor); } catch { return valor; }
      }
      return valor;
    }

    // Intentar en estados
    if (campo === 'estadoObligacionId') {
      const found = estadosObligacion?.find((e: any) => e.id === valor);
      if (found) return found.nombre;
    }

    // Intentar en niveles de recuperación
    if (campo === 'nivelRecuperacionId') {
      const found = nivelesRecuperacion?.find((n: any) => n.id === valor);
      if (found) return found.nombre;
    }

    // Intentar en juzgados
    if (campo === 'juzgadoId') {
      const found = juzgados?.find((j: any) => j.id === valor);
      if (found) return found.nombre ?? valor;
    }

    // UUID no resuelto → mostrar versión corta
    return `${valor.slice(0, 8)}…`;
  };

  // Estado badge
  const dynColor = obligation.estadoObligacion?.color;
  const statusStyle = dynColor
    ? { background: `${dynColor}18`, color: dynColor, borderColor: `${dynColor}40` }
    : undefined;

  // Build timeline
  const timeline: { type: 'bitacora' | 'estado' | 'auditoria'; date: string; data: any }[] = [];
  if (history?.bitacoras)  history.bitacoras.forEach((b: any)  => timeline.push({ type: 'bitacora',  date: b.createdAt,   data: b }));
  if (history?.estados)    history.estados.forEach((e: any)    => timeline.push({ type: 'estado',    date: e.fechaCambio, data: e }));
  if (history?.auditorias) history.auditorias.forEach((a: any) => timeline.push({ type: 'auditoria', date: a.fechaCambio, data: a }));
  timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="obligation-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="obligation-modal" role="dialog" aria-modal="true" aria-label={`Detalle obligación ${obligation.numeroCredito}`}>

        {/* ── HEADER ─────────────────────────────────────────── */}
        <div className="obligation-modal-header">
          <div className="obligation-modal-header-left">
            <div className="obligation-modal-icon">
              <FileText />
            </div>
            <div>
              <h2 className="obligation-modal-title">
                Obligación #{obligation.numeroCredito}
              </h2>
              <p className="obligation-modal-subtitle">
                {obligation.numeroPagare ? `Pagaré: ${obligation.numeroPagare}` : 'Detalle completo de la obligación'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              className={`status-badge ${!dynColor ? getStatusClass(obligation.estadoObligacion) : ''}`}
              style={statusStyle}
            >
              {obligation.estadoObligacion?.nombre || 'SIN ESTADO'}
            </span>
            <button
              className="obligation-modal-close"
              onClick={onClose}
              aria-label="Cerrar modal"
              title="Cerrar"
            >
              <X />
            </button>
          </div>
        </div>

        {/* ── BODY ───────────────────────────────────────────── */}
        <div className="obligation-modal-body">

          {/* Grid: Generales + Jurídico */}
          <div className="obligation-info-grid">

            {/* Card: Datos Generales */}
            <div className="obligation-info-card">
              <div className="info-card-header">
                <div className="info-card-icon blue"><Info /></div>
                <span className="info-card-title">Datos Generales</span>
              </div>

              <div className="data-row">
                <span className="data-row-label">Nro. Crédito</span>
                <span className="data-row-value mono">{obligation.numeroCredito}</span>
              </div>
              <div className="data-row">
                <span className="data-row-label">Pagaré</span>
                <span className={`data-row-value${!obligation.numeroPagare ? ' na' : ' mono'}`}>
                  {obligation.numeroPagare || 'N/A'}
                </span>
              </div>
              <div className="data-row">
                <span className="data-row-label">Saldo Capital</span>
                <span className="data-row-value currency">
                  {formatCurrency(obligation.saldoCapitalDemandado)}
                </span>
              </div>
              <div className="data-row">
                <span className="data-row-label">Estado</span>
                <span
                  className={`status-badge ${!dynColor ? getStatusClass(obligation.estadoObligacion) : ''}`}
                  style={statusStyle}
                >
                  {obligation.estadoObligacion?.nombre || 'SIN ESTADO'}
                </span>
              </div>
              <div className="data-row">
                <span className="data-row-label">Nivel Recuperación</span>
                <span className={`data-row-value${!obligation.nivelRecuperacion ? ' na' : ''}`}>
                  {obligation.nivelRecuperacion?.nombre || 'N/A'}
                </span>
              </div>
            </div>

            {/* Card: Proceso Jurídico */}
            <div className="obligation-info-card">
              <div className="info-card-header">
                <div className="info-card-icon amber"><Scale /></div>
                <span className="info-card-title">Proceso Jurídico</span>
              </div>

              <div className="data-row">
                <span className="data-row-label">Juzgado</span>
                <span className={`data-row-value${!obligation.juzgado ? ' na' : ''}`} style={{ textAlign: 'right', fontSize: '0.8rem' }}>
                  {obligation.juzgado?.nombre || 'N/A'}
                </span>
              </div>
              <div className="data-row">
                <span className="data-row-label">Radicado</span>
                <span className={`data-row-value${!obligation.radicado ? ' na' : ' mono'}`}>
                  {obligation.radicado || 'N/A'}
                </span>
              </div>
              <div className="data-row">
                <span className="data-row-label">Medida Cautelar</span>
                <span className={`data-row-value${!obligation.medidaCautelar ? ' na' : ''}`}>
                  {obligation.medidaCautelar?.nombre || 'N/A'}
                </span>
              </div>
              <div className="data-row">
                <span className="data-row-label">Fecha Demanda</span>
                <span className={`data-row-value${!formatDate(obligation.fechaPresentacionDemanda) ? ' na' : ''}`}>
                  {formatDate(obligation.fechaPresentacionDemanda) || 'N/A'}
                </span>
              </div>
              <div className="data-row">
                <span className="data-row-label">Mandamiento Pago</span>
                <span className={`data-row-value${!formatDate(obligation.mandamientoPagoFecha) ? ' na' : ''}`}>
                  {formatDate(obligation.mandamientoPagoFecha) || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Card: Actores */}
          <div className="obligation-info-card obligation-info-card-full">
            <div className="info-card-header">
              <div className="info-card-icon green"><Users /></div>
              <span className="info-card-title">Actores Involucrados</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-4)' }}>
                {obligation.actores.length} actor(es)
              </span>
            </div>

            {obligation.actores.length === 0 ? (
              <p style={{ fontSize: '0.84rem', color: 'var(--text-4)', fontStyle: 'italic' }}>
                Sin actores registrados.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {obligation.actores.map((actor, idx) => {
                  const initials = actor.persona.nombreCompleto
                    ? actor.persona.nombreCompleto.split(' ').map((w: string) => w[0]).slice(0, 2).join('')
                    : '??';
                  return (
                    <div className="actor-chip" key={idx}>
                      <div className="actor-avatar">{initials}</div>
                      <div className="actor-info">
                        <span className="actor-name">{actor.persona.nombreCompleto}</span>
                        <span className="actor-doc">{actor.persona.numeroIdentificacion}</span>
                      </div>
                      <span className="actor-role-badge">
                        {actor.rolActor?.nombreRol || 'Sin rol'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card: Timeline */}
          <div className="obligation-info-card obligation-info-card-full">
            <div className="info-card-header">
              <div className="info-card-icon purple"><Clock /></div>
              <span className="info-card-title">Historial de Gestión</span>
              {!isLoading && (
                <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-4)' }}>
                  {timeline.length} evento(s)
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="timeline-loading">
                {[80, 60, 90, 50].map((w, i) => (
                  <div key={i} className="skeleton-line" style={{ width: `${w}%` }} />
                ))}
              </div>
            ) : timeline.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-4)' }}>
                <AlertCircle size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                <p style={{ fontSize: '0.84rem' }}>No hay registros de gestión todavía.</p>
              </div>
            ) : (
              <div className="timeline">
                {timeline.map((item, idx) => (
                  <div className="timeline-item" key={idx}>
                    <div className={`timeline-dot ${item.type}`}>
                      {item.type === 'bitacora'  && <BookOpen size={7} />}
                      {item.type === 'estado'    && <ArrowRight size={7} />}
                      {item.type === 'auditoria' && <Info size={7} />}
                    </div>

                    <span className="timeline-date">{formatDateTime(item.date)}</span>

                    <div className="timeline-card">
                      {/* ── Bitácora ─────────────────────────── */}
                      {item.type === 'bitacora' && (
                        <>
                          <div className="timeline-card-type bitacora">
                            <BookOpen size={10} />
                            Nota de Gestión
                          </div>
                          <p className="timeline-card-body">{item.data.observacion}</p>
                        </>
                      )}

                      {/* ── Cambio de Estado ─────────────────── */}
                      {item.type === 'estado' && (
                        <>
                          <div className="timeline-card-type estado">
                            <ArrowRight size={10} />
                            Cambio de Estado
                          </div>
                          <p className="timeline-card-body" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span className="timeline-arrow">
                              <strong>{item.data.estadoAnterior?.nombre || 'N/A'}</strong>
                            </span>
                            →
                            <span className="timeline-arrow">
                              <strong>{item.data.estadoNuevo?.nombre || 'N/A'}</strong>
                            </span>
                          </p>
                          {/* Nivel de recuperación si cambió */}
                          {item.data.nivelRecuperacionNuevo && (
                            <p className="timeline-card-body" style={{ marginTop: '0.35rem', fontSize: '0.77rem', color: 'var(--text-3)' }}>
                              Nivel: {item.data.nivelRecuperacionAnterior?.nombre || 'N/A'} → {item.data.nivelRecuperacionNuevo?.nombre}
                            </p>
                          )}
                        </>
                      )}

                      {/* ── Auditoría ────────────────────────── */}
                      {item.type === 'auditoria' && (
                        <>
                          <div className="timeline-card-type auditoria">
                            <Info size={10} />
                            Cambio en: <strong style={{ marginLeft: '0.2rem' }}>
                              {FIELD_LABELS[item.data.campoModificado] || item.data.campoModificado}
                            </strong>
                          </div>
                          <div className="timeline-card-body" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span className="timeline-arrow audit-value">
                              {resolveValue(item.data.campoModificado, item.data.valorAnterior)}
                            </span>
                            →
                            <span className="timeline-arrow audit-value audit-value-new">
                              {resolveValue(item.data.campoModificado, item.data.valorNuevo)}
                            </span>
                          </div>
                        </>
                      )}

                      {/* Usuario que realizó la acción */}
                      <div className="timeline-user">
                        <User size={11} />
                        {[
                          item.data.usuario?.empleado?.nombres,
                          item.data.usuario?.empleado?.apellidos,
                        ].filter(Boolean).join(' ') || item.data.usuario?.correo || 'Sistema'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── FOOTER ─────────────────────────────────────────── */}
        <div className="obligation-modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            <X size={15} />
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
