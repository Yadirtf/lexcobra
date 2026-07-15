import { useParams } from '@tanstack/react-router';
import { usePublicReport } from '../api/reports.js';
import { FileText, Calendar, DollarSign, Activity, AlertCircle, Printer } from 'lucide-react';

export function PublicReportPage() {
  const { token } = useParams({ strict: false }) as { token: string };
  const { data: report, isLoading, error } = usePublicReport(token);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-app, #0f172a)', color: '#fff', gap: '1rem' }}>
        <div style={{ width: 40, height: 40, border: '4px solid var(--accent, #e2e8f0)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p>Cargando reporte de cartera...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-app, #0f172a)', color: '#fff', padding: '2rem', textAlign: 'center' }}>
        <AlertCircle size={48} color="var(--danger, #ef4444)" style={{ marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Reporte No Disponible</h1>
        <p style={{ color: 'var(--text-3, #94a3b8)', maxWidth: '400px', marginBottom: '1.5rem' }}>
          El enlace de este reporte es inválido, ha expirado o fue desactivado por la entidad emisora.
        </p>
      </div>
    );
  }

  const totalCapital = report.obligations.reduce((sum, o) => sum + Number(o.saldoCapitalDemandado), 0);
  const totalPayments = report.obligations.reduce((sum, o) => sum + o.recaudos.reduce((s: number, r: any) => s + Number(r.monto), 0), 0);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-app, #0f172a)', color: 'var(--text-1, #f8fafc)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* STANDALONE ELEGANT HEADER */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', borderBottom: '1px solid var(--border, #334155)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ background: 'var(--gold, #d97706)', color: '#000', fontWeight: 'bold', fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                CLIENTE EXTERNO
              </span>
              <span style={{ color: 'var(--text-3, #94a3b8)', fontSize: '0.85rem' }}>
                {report.clientName}
              </span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              {report.portfolioName}
            </h1>
            <p style={{ color: 'var(--text-3, #94a3b8)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
              {report.title} | NIT: {report.nit || 'N/A'}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', textAlign: 'right' }}>
            <button
              onClick={() => window.print()}
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', cursor: 'pointer', background: 'var(--accent, #e2e8f0)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold' }}
            >
              <Printer size={16} /> Imprimir / PDF
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-3, #94a3b8)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              <Calendar size={14} />
              <span>Período: {new Date(report.startDate).toLocaleDateString()} al {new Date(report.endDate).toLocaleDateString()}</span>
            </div>
          </div>
        </header>

        {/* METRICS ROW */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ background: 'var(--surface-1, #1e293b)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border, #334155)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(217,119,6,0.1)', borderRadius: '10px', color: 'var(--gold, #d97706)' }}>
              <FileText size={24} />
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-3, #94a3b8)', fontWeight: 500 }}>OBLIGACIONES ACTIVAS</span>
              <strong style={{ fontSize: '1.5rem', color: '#fff' }}>{report.obligations.length}</strong>
            </div>
          </div>

          <div style={{ background: 'var(--surface-1, #1e293b)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border, #334155)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(96,165,250,0.1)', borderRadius: '10px', color: '#60a5fa' }}>
              <DollarSign size={24} />
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-3, #94a3b8)', fontWeight: 500 }}>CAPITAL TOTAL DEMANDADO</span>
              <strong style={{ fontSize: '1.5rem', color: '#fff' }}>{formatCurrency(totalCapital)}</strong>
            </div>
          </div>

          <div style={{ background: 'var(--surface-1, #1e293b)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border, #334155)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(34,197,94,0.1)', borderRadius: '10px', color: '#22c55e' }}>
              <Activity size={24} />
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-3, #94a3b8)', fontWeight: 500 }}>RECAUDADO EN PERÍODO</span>
              <strong style={{ fontSize: '1.5rem', color: '#fff' }}>{formatCurrency(totalPayments)}</strong>
            </div>
          </div>
        </section>

        {/* OBLIGATIONS & DETAILS */}
        <section>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#fff' }}>
            Detalle de Procesos y Seguimientos
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {report.obligations.map((obs, idx) => {
              const debtor = obs.actores?.find((a: any) => a.rolActor?.nombreRol === 'Deudor Principal')?.persona;
              
              // Codeudores
              const codeudores = obs.actores
                ?.filter((a: any) => a.rolActor?.nombreRol === 'Codeudor' || a.rolActor?.nombreRol === 'Deudor Solidario')
                ?.map((a: any) => `${a.persona.nombreCompleto} (CC: ${a.persona.numeroIdentificacion})`)
                ?.join(', ') || 'Ninguno';

              // Dates
              const lawsuitDate = obs.fechaPresentacionDemanda 
                ? new Date(obs.fechaPresentacionDemanda).toLocaleDateString('es-CO')
                : 'N/A';
              const paymentOrderDate = obs.mandamientoPagoFecha 
                ? new Date(obs.mandamientoPagoFecha).toLocaleDateString('es-CO')
                : 'N/A';

              return (
                <div
                  key={obs.id}
                  style={{
                    background: 'var(--surface-1, #1e293b)',
                    borderRadius: '12px',
                    border: '1px solid var(--border, #334155)',
                    overflow: 'hidden',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                >
                  {/* Card Title Header */}
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      borderBottom: '1px solid var(--border, #334155)',
                      padding: '1rem 1.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--gold, #d97706)', fontWeight: 700, fontSize: '0.85rem', display: 'block', marginBottom: '0.2rem' }}>
                        PROCESO #{idx + 1}
                      </span>
                      <strong style={{ fontSize: '1.1rem', color: '#fff' }}>
                        {debtor?.nombreCompleto || 'Sin Deudor Principal'}
                      </strong>
                      <span style={{ color: 'var(--text-3, #94a3b8)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                        (CC: {debtor?.numeroIdentificacion || 'N/A'})
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span style={{ background: 'var(--accent-xs, rgba(96,165,250,0.1))', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)', fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '6px', fontWeight: 600 }}>
                        Crédito: {obs.numeroCredito}
                      </span>
                      {obs.estadoObligacion && (
                        <span style={{ background: obs.estadoObligacion.color ? `${obs.estadoObligacion.color}15` : '#334155', color: obs.estadoObligacion.color || '#94a3b8', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '6px', fontWeight: 600 }}>
                          {obs.estadoObligacion.nombre}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', borderBottom: '1px solid var(--border, #334155)' }}>
                    <div>
                      <span style={{ color: 'var(--text-3, #94a3b8)', fontSize: '0.75rem', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Capital Demandado</span>
                      <strong style={{ fontSize: '1.1rem', color: '#fff', display: 'block', marginTop: '0.25rem' }}>{formatCurrency(obs.saldoCapitalDemandado)}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-3, #94a3b8)', fontSize: '0.75rem', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Pagaré</span>
                      <span style={{ fontSize: '0.95rem', display: 'block', marginTop: '0.25rem', color: '#fff' }}>{obs.numeroPagare || 'N/A'}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-3, #94a3b8)', fontSize: '0.75rem', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Nivel Recuperación</span>
                      <span style={{ fontSize: '0.95rem', display: 'block', marginTop: '0.25rem', color: '#fff' }}>{obs.nivelRecuperacion?.nombre || 'N/A'}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-3, #94a3b8)', fontSize: '0.75rem', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Ubicación</span>
                      <span style={{ fontSize: '0.9rem', display: 'block', marginTop: '0.25rem', color: '#fff' }}>
                        {obs.departamento?.nombre || obs.municipio?.departamento?.nombre || 'N/A'} / {obs.municipio?.nombre || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-3, #94a3b8)', fontSize: '0.75rem', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Juzgado</span>
                      <span style={{ fontSize: '0.9rem', display: 'block', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#fff' }} title={obs.juzgado?.nombre}>
                        {obs.juzgado?.nombre || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-3, #94a3b8)', fontSize: '0.75rem', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Radicado / Expediente</span>
                      <span style={{ fontSize: '0.95rem', display: 'block', marginTop: '0.25rem', color: '#fff' }}>{obs.radicado || 'N/A'}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-3, #94a3b8)', fontSize: '0.75rem', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Medida Cautelar</span>
                      <span style={{ fontSize: '0.95rem', display: 'block', marginTop: '0.25rem', color: '#fff' }}>{obs.medidaCautelar?.nombre || 'N/A'}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-3, #94a3b8)', fontSize: '0.75rem', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Fechas de Proceso</span>
                      <span style={{ fontSize: '0.82rem', display: 'block', marginTop: '0.25rem', color: '#fff', lineHeight: '1.4' }}>
                        <strong>Demanda:</strong> {lawsuitDate} <br/>
                        <strong>Mandamiento:</strong> {paymentOrderDate}
                      </span>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: 'var(--text-3, #94a3b8)', fontSize: '0.75rem', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Codeudores</span>
                      <span style={{ fontSize: '0.9rem', display: 'block', marginTop: '0.25rem', color: '#fff', lineHeight: '1.4' }}>
                        {codeudores}
                      </span>
                    </div>
                  </div>

                  {/* Followups Section */}
                  <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.08)' }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gold, #d97706)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Activity size={16} /> Historial de Gestión y Bitácora (Período)
                    </h4>
                    
                    {!obs.timelineEvents || obs.timelineEvents.length === 0 ? (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-4, #64748b)', fontStyle: 'italic', margin: 0 }}>
                        No hay seguimientos registrados en el período seleccionado.
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderLeft: '2px solid var(--border, #334155)', paddingLeft: '1.25rem', marginLeft: '0.5rem' }}>
                        {obs.timelineEvents.map((item: any, itemIdx: number) => {
                          const todayStr = new Date().toLocaleDateString('es-CO');
                          const isToday = item.dateStr === todayStr;

                          return (
                            <div key={itemIdx} style={{ position: 'relative' }}>
                              {/* Colored timeline node */}
                              <div style={{ position: 'absolute', width: 10, height: 10, borderRadius: '50%', background: item.color, left: -25, top: 4, border: '2px solid var(--surface-1, #1e293b)' }} />
                              
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                {isToday ? (
                                  <span style={{ background: '#2563eb', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                    HOY
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.75rem', color: 'var(--text-3, #94a3b8)', fontWeight: 700 }}>
                                    [{item.dateStr}]
                                  </span>
                                )}
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: item.color }}>
                                  {item.title}
                                </span>
                              </div>
                              
                              <p style={{ fontSize: '0.85rem', color: '#e2e8f0', margin: 0, lineHeight: '1.4' }}>
                                {item.text}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
