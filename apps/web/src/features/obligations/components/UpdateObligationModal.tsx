import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, LayoutList, Scale, Users, Save, Info, User, MessageSquare, Search, DollarSign, Bell } from 'lucide-react';
import { Obligation, useFullUpdateObligation, useAddBitacora, useAddRecaudo, useObligationRecaudos, useObligationNotifications, useCreateObligationNotification } from '../api/obligations.js';
import { useCatalogs } from '../../../shared/api/catalogs.js';
import { useJuzgados } from '../api/catalogs.js';
import './Obligations.css';

interface UpdateObligationModalProps {
  obligation: Obligation | null;
  isOpen: boolean;
  onClose: () => void;
}

type ActiveTab = 'general' | 'juridico' | 'actores' | 'recaudos' | 'nota' | 'notificaciones';

export function UpdateObligationModal({ obligation, isOpen, onClose }: UpdateObligationModalProps) {
  const { estadosObligacion, nivelesRecuperacion, tiposContacto, medidasCautelares, isLoading: loadingCatalogs } = useCatalogs();
  const { data: juzgados, isLoading: loadingJuzgados } = useJuzgados();
  const { mutateAsync: updateObligation, isPending } = useFullUpdateObligation();
  const { mutateAsync: addBitacora, isPending: isSavingNota } = useAddBitacora();
  const { mutateAsync: addRecaudo, isPending: isSavingRecaudo } = useAddRecaudo();
  const { data: recaudos, isLoading: loadingRecaudos } = useObligationRecaudos(
    obligation?.id || '',
    isOpen && !!obligation
  );
  const { data: notificaciones, isLoading: loadingNotificaciones } = useObligationNotifications(
    obligation?.id || '',
    isOpen && !!obligation
  );
  const { mutateAsync: createNotification, isPending: isSavingNotification } = useCreateObligationNotification();

  const [formData, setFormData] = useState<any>({});
  const [activeTab, setActiveTab] = useState<ActiveTab>('general');
  const [nota, setNota] = useState('');
  const [juzgadoSearch, setJuzgadoSearch] = useState('');
  const [juzgadoDropdownOpen, setJuzgadoDropdownOpen] = useState(false);

  // States for new recaudo
  const [recaudoMonto, setRecaudoMonto] = useState<string>('');
  const [recaudoFecha, setRecaudoFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [recaudoObservacion, setRecaudoObservacion] = useState<string>('');

  // States for new notification
  const [notifDestinatarioId, setNotifDestinatarioId] = useState<string>('');
  const [notifFecha, setNotifFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notifObservacion, setNotifObservacion] = useState<string>('');

  useEffect(() => {
    if (obligation) {
      setFormData({
        creditNumber:    obligation.numeroCredito || '',
        capitalBalance:  obligation.saldoCapitalDemandado || 0,
        statusId:        obligation.estadoObligacionId || '',
        recoveryLevelId: obligation.nivelRecuperacionId || '',
        docketNumber:    obligation.radicado || '',
        courtId:         obligation.juzgadoId || '',
        precautionaryMeasureId: obligation.medidaCautelarId || '',
        intakeDate: toInputDateFormat(obligation.fechaReparto),
        lawsuitDate: toInputDateFormat(obligation.fechaPresentacionDemanda),
        paymentOrderDate: toInputDateFormat(obligation.mandamientoPagoFecha),
        proceedExecutionDate: toInputDateFormat(obligation.autoSeguirEjecucionFecha),
        creditLiquidationDate: toInputDateFormat(obligation.liquidacionCreditoAprobadaFecha),
        debtors: obligation.actores
          .filter((a) => a.rolActor?.nombreRol === 'Deudor Principal')
          .map((a) => ({
            documentId:          a.persona.numeroIdentificacion,
            fullName:            a.persona.nombreCompleto,
            tipoIdentificacionId: a.persona.tipoIdentificacionId || undefined,
            contacts: a.persona.contactos?.map(c => ({
              tipoContactoId: (c as any).tipoContactoId || '',
              valor: c.valor,
              esPrincipal: c.esPrincipal
            })) || [],
          })),
        coDebtors: obligation.actores
          .filter((a) => a.rolActor?.nombreRol === 'Codeudor')
          .map((a) => ({
            documentId:          a.persona.numeroIdentificacion,
            fullName:            a.persona.nombreCompleto,
            tipoIdentificacionId: a.persona.tipoIdentificacionId || undefined,
            contacts: a.persona.contactos?.map(c => ({
              tipoContactoId: (c as any).tipoContactoId || '',
              valor: c.valor,
              esPrincipal: c.esPrincipal
            })) || [],
          })),
      });
      setActiveTab('general');
      setNota('');
      setJuzgadoSearch('');
      setRecaudoMonto('');
      setRecaudoFecha(new Date().toISOString().split('T')[0]);
      setRecaudoObservacion('');
    }
  }, [obligation?.id]);

  if (!isOpen || !obligation) return null;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const cleanDate = dateStr.split('T')[0];
      const [year, month, day] = cleanDate.split('-');
      const d = new Date(Number(year), Number(month) - 1, Number(day));
      return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const toInputDateFormat = (dateStr?: string | Date | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateObligation({
        id:   obligation.id,
        data: {
          creditNumber:    formData.creditNumber,
          capitalBalance:  Number(formData.capitalBalance),
          statusId:        formData.statusId       || undefined,
          recoveryLevelId: formData.recoveryLevelId || undefined,
          docketNumber:    formData.docketNumber   || undefined,
          courtId:         formData.courtId        || undefined,
          precautionaryMeasureId: formData.precautionaryMeasureId || undefined,
          intakeDate:      formData.intakeDate ? new Date(formData.intakeDate).toISOString() : '',
          lawsuitDate:     formData.lawsuitDate ? new Date(formData.lawsuitDate).toISOString() : '',
          paymentOrderDate: formData.paymentOrderDate ? new Date(formData.paymentOrderDate).toISOString() : '',
          proceedExecutionDate: formData.proceedExecutionDate ? new Date(formData.proceedExecutionDate).toISOString() : '',
          creditLiquidationDate: formData.creditLiquidationDate ? new Date(formData.creditLiquidationDate).toISOString() : '',
          debtors:         formData.debtors,
          coDebtors:       formData.coDebtors,
        },
      });
      // Registrar abono si se especificó un monto
      if (recaudoMonto && Number(recaudoMonto) > 0) {
        await addRecaudo({
          id: obligation.id,
          data: {
            monto: Number(recaudoMonto),
            fechaAbonada: recaudoFecha,
            observacion: recaudoObservacion.trim() || undefined
          }
        });
      }
      // Si hay nota, guardarla como bitácora después de actualizar
      if (nota.trim()) {
        await addBitacora({ id: obligation.id, data: { observacion: nota.trim() } });
      }
      // Registrar notificación si se ingresaron datos
      if (notifFecha && (notifDestinatarioId || notifObservacion.trim())) {
        await createNotification({
          id: obligation.id,
          data: {
            destinatarioPersonaId: notifDestinatarioId || null,
            fechaNotificacion: notifFecha,
            observacion: notifObservacion.trim() || null,
          }
        });
      }
      onClose();
    } catch {
      alert('Error al actualizar obligación');
    }
  };

  const handleDebtorContactAdd = (debtorIdx: number) => {
    const newDebtors = [...formData.debtors];
    if (!newDebtors[debtorIdx].contacts) newDebtors[debtorIdx].contacts = [];
    newDebtors[debtorIdx].contacts.push({
      tipoContactoId: tiposContacto?.[0]?.id || '',
      valor:          '',
      esPrincipal:    false,
    });
    setFormData({ ...formData, debtors: newDebtors });
  };

  const handleDebtorContactChange = (debtorIdx: number, contactIdx: number, field: string, value: any) => {
    const newDebtors = [...formData.debtors];
    newDebtors[debtorIdx].contacts[contactIdx][field] = value;
    setFormData({ ...formData, debtors: newDebtors });
  };

  const handleDebtorContactRemove = (debtorIdx: number, contactIdx: number) => {
    const newDebtors = [...formData.debtors];
    newDebtors[debtorIdx].contacts.splice(contactIdx, 1);
    setFormData({ ...formData, debtors: newDebtors });
  };

  const handleCoDebtorContactAdd = (coDebtorIdx: number) => {
    const newCoDebtors = [...(formData.coDebtors || [])];
    if (!newCoDebtors[coDebtorIdx].contacts) newCoDebtors[coDebtorIdx].contacts = [];
    newCoDebtors[coDebtorIdx].contacts.push({
      tipoContactoId: tiposContacto?.[0]?.id || '',
      valor:          '',
      esPrincipal:    false,
    });
    setFormData({ ...formData, coDebtors: newCoDebtors });
  };

  const handleCoDebtorContactChange = (coDebtorIdx: number, contactIdx: number, field: string, value: any) => {
    const newCoDebtors = [...(formData.coDebtors || [])];
    newCoDebtors[coDebtorIdx].contacts[contactIdx][field] = value;
    setFormData({ ...formData, coDebtors: newCoDebtors });
  };

  const handleCoDebtorContactRemove = (coDebtorIdx: number, contactIdx: number) => {
    const newCoDebtors = [...(formData.coDebtors || [])];
    newCoDebtors[coDebtorIdx].contacts.splice(contactIdx, 1);
    setFormData({ ...formData, coDebtors: newCoDebtors });
  };

  // Juzgado seleccionado
  const selectedJuzgado = juzgados?.find((j: any) => j.id === formData.courtId);

  // Juzgados filtrados por búsqueda
  const filteredJuzgados = juzgados?.filter((j: any) =>
    !juzgadoSearch || (j.nombre ?? '').toLowerCase().includes(juzgadoSearch.toLowerCase())
  ) ?? [];

  const tabs: { key: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { key: 'general',  label: 'Generales',       icon: <LayoutList size={14} /> },
    { key: 'juridico', label: 'Jurídico',         icon: <Scale size={14} /> },
    { key: 'actores',  label: 'Deudores',         icon: <Users size={14} /> },
    { key: 'recaudos', label: 'Recaudos',         icon: <DollarSign size={14} />, badge: recaudos && recaudos.length > 0 ? String(recaudos.length) : undefined },
    { key: 'notificaciones', label: 'Notificaciones', icon: <Bell size={14} />, badge: notificaciones && notificaciones.length > 0 ? String(notificaciones.length) : undefined },
    { key: 'nota',     label: 'Nota de Gestión',  icon: <MessageSquare size={14} />, badge: nota.trim() ? '✓' : undefined },
  ];

  const isSubmitting = isPending || isSavingNota || isSavingRecaudo || isSavingNotification;

  return (
    <div
      className="obligation-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}
    >
      <div
        className="obligation-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Actualizar obligación ${obligation.numeroCredito}`}
      >
        {/* ── HEADER ─────────────────────────────────────────── */}
        <div className="obligation-modal-header">
          <div className="obligation-modal-header-left">
            <div className="obligation-modal-icon">
              <Save />
            </div>
            <div>
              <h2 className="obligation-modal-title">Actualizar Obligación</h2>
              <p className="obligation-modal-subtitle">
                #{obligation.numeroCredito}
                {obligation.actores.find((a) => a.rolActor?.nombreRol === 'Deudor Principal')
                  ? ` · ${obligation.actores.find((a) => a.rolActor?.nombreRol === 'Deudor Principal')?.persona.nombreCompleto}`
                  : ''}
              </p>
            </div>
          </div>
          <button
            className="obligation-modal-close"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Cerrar modal"
            title="Cerrar"
          >
            <X />
          </button>
        </div>

        {loadingCatalogs ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-3)', flex: 1 }}>
            <div className="timeline-loading" style={{ maxWidth: 320, margin: '0 auto' }}>
              {[70, 50, 80, 60].map((w, i) => (
                <div key={i} className="skeleton-line" style={{ width: `${w}%` }} />
              ))}
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.84rem' }}>Cargando catálogos...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

            {/* ── TABS ─────────────────────────────────────────── */}
            <div style={{ padding: '0 1.75rem', flexShrink: 0 }}>
              <div className="obl-tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    className={`obl-tab-btn${activeTab === tab.key ? ' active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.icon}
                    {tab.label}
                    {tab.badge && (
                      <span style={{
                        background: 'var(--success)',
                        color: '#fff',
                        fontSize: '0.6rem',
                        borderRadius: '99px',
                        padding: '0.05rem 0.3rem',
                        fontWeight: 700,
                      }}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── BODY ─────────────────────────────────────────── */}
            <div className="update-modal-form-body">

              {/* ── Tab: Generales ─────────────────────────────── */}
              {activeTab === 'general' && (
                <div className="update-form-grid">
                  <div className="form-field">
                    <label htmlFor="upd-credit-number">Número de Crédito *</label>
                    <input
                      id="upd-credit-number"
                      type="text"
                      value={formData.creditNumber}
                      onChange={(e) => setFormData({ ...formData, creditNumber: e.target.value })}
                      required
                      placeholder="Ej: CRE-2024-001"
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="upd-capital">Saldo Capital (COP) *</label>
                    <input
                      id="upd-capital"
                      type="number"
                      step="1"
                      min="0"
                      value={formData.capitalBalance}
                      onChange={(e) => setFormData({ ...formData, capitalBalance: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="upd-status">Estado de la Obligación</label>
                    <select
                      id="upd-status"
                      value={formData.statusId}
                      onChange={(e) => setFormData({ ...formData, statusId: e.target.value })}
                    >
                      <option value="">— Sin estado —</option>
                      {estadosObligacion?.map((e: any) => (
                        <option key={e.id} value={e.id}>{e.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-field">
                    <label htmlFor="upd-recovery">Nivel de Recuperación</label>
                    <select
                      id="upd-recovery"
                      value={formData.recoveryLevelId}
                      onChange={(e) => setFormData({ ...formData, recoveryLevelId: e.target.value })}
                    >
                      <option value="">— Sin nivel —</option>
                      {nivelesRecuperacion?.map((n: any) => (
                        <option key={n.id} value={n.id}>{n.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* ── Tab: Jurídico ───────────────────────────────── */}
              {activeTab === 'juridico' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="update-form-grid">
                    <div className="form-field">
                      <label htmlFor="upd-radicado">Número de Radicado</label>
                      <input
                        id="upd-radicado"
                        type="text"
                        value={formData.docketNumber}
                        onChange={(e) => setFormData({ ...formData, docketNumber: e.target.value })}
                        placeholder="Ej: 11001400300120240001"
                      />
                    </div>
                  </div>

                  {/* Selector de Juzgado (Combobox) */}
                  <div className="form-field" style={{ position: 'relative' }}>
                    <label>Seleccionar Juzgado</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Search
                          size={14}
                          style={{
                            position: 'absolute', left: '0.75rem', color: 'var(--text-4)', pointerEvents: 'none',
                          }}
                        />
                        <input
                          type="text"
                          value={juzgadoDropdownOpen ? juzgadoSearch : (selectedJuzgado?.nombre || '')}
                          onChange={(e) => {
                            setJuzgadoSearch(e.target.value);
                            if (!juzgadoDropdownOpen) setJuzgadoDropdownOpen(true);
                            if (!e.target.value) setFormData({ ...formData, courtId: '' });
                          }}
                          onFocus={() => {
                            setJuzgadoDropdownOpen(true);
                            setJuzgadoSearch('');
                          }}
                          onBlur={() => {
                            setTimeout(() => setJuzgadoDropdownOpen(false), 200);
                          }}
                          placeholder="Buscar juzgado por nombre..."
                          style={{ paddingLeft: '2.2rem', paddingRight: '2.2rem', width: '100%' }}
                        />
                        {formData.courtId && !juzgadoDropdownOpen && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setFormData({ ...formData, courtId: '' });
                              setJuzgadoSearch('');
                            }}
                            style={{
                              position: 'absolute', right: '0.5rem', 
                              background: 'var(--surface-2)', border: '1px solid var(--border)', 
                              color: 'var(--text-3)', borderRadius: '50%', width: '20px', height: '20px',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                            title="Quitar juzgado"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>

                      {juzgadoDropdownOpen && (
                        <div className="juzgado-list" style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          marginTop: '0.25rem',
                          zIndex: 20,
                          maxHeight: '200px',
                          overflowY: 'auto',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          border: '1px solid var(--border)',
                          background: 'var(--surface)',
                          borderRadius: 'var(--radius-s)'
                        }}>
                          {loadingJuzgados ? (
                            <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-4)', fontSize: '0.82rem' }}>
                              Cargando...
                            </div>
                          ) : filteredJuzgados.length === 0 ? (
                            <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-4)', fontSize: '0.82rem' }}>
                              No se encontraron juzgados con ese nombre
                            </div>
                          ) : (
                            filteredJuzgados.map((j: any) => (
                              <div
                                key={j.id}
                                className={`juzgado-item${formData.courtId === j.id ? ' selected' : ''}`}
                                onClick={() => {
                                  setFormData({ ...formData, courtId: j.id });
                                  setJuzgadoSearch('');
                                  setJuzgadoDropdownOpen(false);
                                }}
                              >
                                <div className="juzgado-item-name">{j.nombre}</div>
                                {(j.informacion?.municipio?.nombre || j.informacion?.departamento?.nombre) && (
                                  <div className="juzgado-item-location">
                                    {[j.informacion?.municipio?.nombre, j.informacion?.departamento?.nombre]
                                      .filter(Boolean).join(', ')}
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                  <div className="form-field" style={{ marginTop: '0.5rem' }}>
                    <label htmlFor="upd-medida-cautelar">Medida Cautelar</label>
                    <select
                      id="upd-medida-cautelar"
                      value={formData.precautionaryMeasureId}
                      onChange={(e) => setFormData({ ...formData, precautionaryMeasureId: e.target.value })}
                    >
                      <option value="">— Seleccionar Medida Cautelar —</option>
                      {medidasCautelares?.map((m: any) => (
                        <option key={m.id} value={m.id}>{m.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="section-label" style={{ marginTop: '1.25rem', marginBottom: '0.5rem' }}>Hitos del Proceso</div>
                  <div className="update-form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-field">
                      <label htmlFor="upd-intake">Fecha Asignación (Reparto)</label>
                      <input
                        id="upd-intake"
                        type="date"
                        value={formData.intakeDate || ''}
                        onChange={(e) => setFormData({ ...formData, intakeDate: e.target.value })}
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="upd-lawsuit">Presentación Demanda</label>
                      <input
                        id="upd-lawsuit"
                        type="date"
                        value={formData.lawsuitDate || ''}
                        onChange={(e) => setFormData({ ...formData, lawsuitDate: e.target.value })}
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="upd-payment-order">Mandamiento de Pago</label>
                      <input
                        id="upd-payment-order"
                        type="date"
                        value={formData.paymentOrderDate || ''}
                        onChange={(e) => setFormData({ ...formData, paymentOrderDate: e.target.value })}
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor="upd-proceed-execution">Auto Seguir Adelante Ejecución</label>
                      <input
                        id="upd-proceed-execution"
                        type="date"
                        value={formData.proceedExecutionDate || ''}
                        onChange={(e) => setFormData({ ...formData, proceedExecutionDate: e.target.value })}
                      />
                    </div>
                    <div className="form-field" style={{ gridColumn: 'span 2' }}>
                      <label htmlFor="upd-credit-liquidation">Liquidación Crédito Aprobada</label>
                      <input
                        id="upd-credit-liquidation"
                        type="date"
                        value={formData.creditLiquidationDate || ''}
                        onChange={(e) => setFormData({ ...formData, creditLiquidationDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab: Actores / Deudores ─────────────────────── */}
              {activeTab === 'actores' && (
                <div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginBottom: '1.25rem' }}>
                    Edita los medios de contacto de cada deudor. Los datos de identidad se actualizan desde el módulo de personas.
                  </p>

                  {formData.debtors?.map((debtor: any, dIdx: number) => {
                    const initials = debtor.fullName
                      ? debtor.fullName.split(' ').map((w: string) => w[0]).slice(0, 2).join('')
                      : '??';
                    return (
                      <div className="debtor-block" key={dIdx}>
                        <div className="debtor-block-header">
                          <div className="debtor-block-title">
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: 'var(--accent-xs)', border: '1.5px solid var(--accent-s)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent-h)',
                              flexShrink: 0,
                            }}>
                              {initials}
                            </div>
                            <div>
                              <span style={{ display: 'block', fontWeight: 700, fontSize: '0.84rem', color: 'var(--text)' }}>
                                {debtor.fullName || 'Sin nombre'}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>
                                {debtor.documentId}
                              </span>
                            </div>
                          </div>
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem',
                            borderRadius: '99px', textTransform: 'uppercase' as const,
                            background: 'var(--accent-xs)', color: 'var(--accent-h)',
                            border: '1px solid var(--accent-s)',
                          }}>
                            Deudor Principal
                          </span>
                        </div>

                        <div className="update-form-grid" style={{ marginBottom: '1.25rem' }}>
                          <div className="form-field">
                            <label>Documento de Identidad</label>
                            <input
                              type="text"
                              value={debtor.documentId}
                              onChange={(e) => {
                                const d = [...formData.debtors];
                                d[dIdx].documentId = e.target.value;
                                setFormData({ ...formData, debtors: d });
                              }}
                              required
                            />
                          </div>
                          <div className="form-field">
                            <label>Nombre Completo</label>
                            <input
                              type="text"
                              value={debtor.fullName}
                              onChange={(e) => {
                                const d = [...formData.debtors];
                                d[dIdx].fullName = e.target.value;
                                setFormData({ ...formData, debtors: d });
                              }}
                              required
                            />
                          </div>
                        </div>

                        <div className="section-label">
                          <User size={11} />
                          Medios de Contacto
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.75rem' }}>
                          {debtor.contacts?.length === 0 && (
                            <p className="contact-empty-hint">No hay contactos añadidos.</p>
                          )}
                          {debtor.contacts?.map((contact: any, cIdx: number) => (
                            <div className="contact-row" key={cIdx}>
                              <select
                                className="contact-type-select"
                                value={contact.tipoContactoId}
                                onChange={(e) => handleDebtorContactChange(dIdx, cIdx, 'tipoContactoId', e.target.value)}
                              >
                                {tiposContacto?.map((t: any) => (
                                  <option key={t.id} value={t.id}>{t.nombre}</option>
                                ))}
                              </select>
                              <input
                                className="contact-value-input"
                                type="text"
                                value={contact.valor}
                                onChange={(e) => handleDebtorContactChange(dIdx, cIdx, 'valor', e.target.value)}
                                placeholder="Teléfono / Correo / Dirección"
                                required
                              />
                              <label className="contact-principal-label">
                                <input
                                  type="checkbox"
                                  checked={contact.esPrincipal}
                                  onChange={(e) => handleDebtorContactChange(dIdx, cIdx, 'esPrincipal', e.target.checked)}
                                />
                                Principal
                              </label>
                              <button
                                type="button"
                                className="contact-remove-btn"
                                onClick={() => handleDebtorContactRemove(dIdx, cIdx)}
                                title="Eliminar contacto"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          className="btn-add-contact"
                          onClick={() => handleDebtorContactAdd(dIdx)}
                        >
                          <Plus size={12} />
                          Añadir Contacto
                        </button>
                      </div>
                    );
                  })}

                  {formData.coDebtors?.length > 0 && formData.coDebtors.map((coDebtor: any, cIdx: number) => {
                    const initials = coDebtor.fullName
                      ? coDebtor.fullName.split(' ').map((w: string) => w[0]).slice(0, 2).join('')
                      : '??';
                    return (
                      <div className="debtor-block" key={`co-${cIdx}`}>
                        <div className="debtor-block-header">
                          <div className="debtor-block-title">
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: 'var(--surface-3)', border: '1.5px solid var(--border-2)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-2)',
                              flexShrink: 0,
                            }}>
                              {initials}
                            </div>
                            <div>
                              <span style={{ display: 'block', fontWeight: 700, fontSize: '0.84rem', color: 'var(--text)' }}>
                                {coDebtor.fullName || 'Sin nombre'}
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>
                                {coDebtor.documentId}
                              </span>
                            </div>
                          </div>
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem',
                            borderRadius: '99px', textTransform: 'uppercase' as const,
                            background: 'var(--surface-3)', color: 'var(--text-3)',
                            border: '1px solid var(--border)',
                          }}>
                            Codeudor
                          </span>
                        </div>

                        <div className="update-form-grid" style={{ marginBottom: '1.25rem' }}>
                          <div className="form-field">
                            <label>Documento de Identidad</label>
                            <input
                              type="text"
                              value={coDebtor.documentId}
                              onChange={(e) => {
                                const c = [...formData.coDebtors];
                                c[cIdx].documentId = e.target.value;
                                setFormData({ ...formData, coDebtors: c });
                              }}
                              required
                            />
                          </div>
                          <div className="form-field">
                            <label>Nombre Completo</label>
                            <input
                              type="text"
                              value={coDebtor.fullName}
                              onChange={(e) => {
                                const c = [...formData.coDebtors];
                                c[cIdx].fullName = e.target.value;
                                setFormData({ ...formData, coDebtors: c });
                              }}
                              required
                            />
                          </div>
                        </div>

                        <div className="section-label">
                          <User size={11} />
                          Medios de Contacto
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginBottom: '0.75rem' }}>
                          {coDebtor.contacts?.length === 0 && (
                            <p className="contact-empty-hint">No hay contactos añadidos.</p>
                          )}
                          {coDebtor.contacts?.map((contact: any, contactIdx: number) => (
                            <div className="contact-row" key={contactIdx}>
                              <select
                                className="contact-type-select"
                                value={contact.tipoContactoId}
                                onChange={(e) => handleCoDebtorContactChange(cIdx, contactIdx, 'tipoContactoId', e.target.value)}
                              >
                                {tiposContacto?.map((t: any) => (
                                  <option key={t.id} value={t.id}>{t.nombre}</option>
                                ))}
                              </select>
                              <input
                                className="contact-value-input"
                                type="text"
                                value={contact.valor}
                                onChange={(e) => handleCoDebtorContactChange(cIdx, contactIdx, 'valor', e.target.value)}
                                placeholder="Teléfono / Correo / Dirección"
                                required
                              />
                              <label className="contact-principal-label">
                                <input
                                  type="checkbox"
                                  checked={contact.esPrincipal}
                                  onChange={(e) => handleCoDebtorContactChange(cIdx, contactIdx, 'esPrincipal', e.target.checked)}
                                />
                                Principal
                              </label>
                              <button
                                type="button"
                                className="contact-remove-btn"
                                onClick={() => handleCoDebtorContactRemove(cIdx, contactIdx)}
                                title="Eliminar contacto"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          className="btn-add-contact"
                          onClick={() => handleCoDebtorContactAdd(cIdx)}
                        >
                          <Plus size={12} />
                          Añadir Contacto
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── Tab: Recaudos ───────────────────────────────── */}
              {activeTab === 'recaudos' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Resumen Financiero */}
                  {(() => {
                    const totalAbonado = recaudos ? recaudos.reduce((sum: number, r: any) => sum + r.monto, 0) : 0;
                    const saldoPendiente = Math.max(0, Number(formData.capitalBalance || 0) - totalAbonado);
                    return (
                      <div className="recaudo-summary-grid">
                        <div className="recaudo-metric-card">
                          <span className="recaudo-metric-card-label">Capital Demandado</span>
                          <span className="recaudo-metric-card-value">{formatCurrency(Number(formData.capitalBalance || 0))}</span>
                        </div>
                        <div className="recaudo-metric-card success">
                          <span className="recaudo-metric-card-label">Total Abonado</span>
                          <span className="recaudo-metric-card-value">{formatCurrency(totalAbonado)}</span>
                        </div>
                        <div className="recaudo-metric-card danger">
                          <span className="recaudo-metric-card-label">Saldo Pendiente</span>
                          <span className="recaudo-metric-card-value">{formatCurrency(saldoPendiente)}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Registrar Abono Form */}
                  <div className="recaudo-form-section">
                    <h3 className="recaudo-form-title">
                      <Plus size={14} />
                      Registrar Nuevo Abono
                    </h3>
                    <div className="recaudo-form-grid">
                      <div className="form-field">
                        <label htmlFor="rec-monto">Monto (COP) *</label>
                        <input
                          id="rec-monto"
                          type="number"
                          step="1"
                          min="1"
                          placeholder="Ej: 500000"
                          value={recaudoMonto}
                          onChange={(e) => setRecaudoMonto(e.target.value)}
                        />
                      </div>
                      <div className="form-field">
                        <label htmlFor="rec-fecha">Fecha de Abono *</label>
                        <input
                          id="rec-fecha"
                          type="date"
                          value={recaudoFecha}
                          onChange={(e) => setRecaudoFecha(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="form-field" style={{ marginBottom: '1rem' }}>
                      <label htmlFor="rec-observacion">Observación / Nota del abono (opcional)</label>
                      <textarea
                        id="rec-observacion"
                        rows={2}
                        placeholder="Consignación, transferencia, etc..."
                        value={recaudoObservacion}
                        onChange={(e) => setRecaudoObservacion(e.target.value)}
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                    {recaudoMonto && Number(recaudoMonto) > 0 && (
                      <div style={{
                        marginTop: '0.75rem',
                        fontSize: '0.78rem',
                        color: 'var(--text-2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'rgba(5,150,105,.05)',
                        border: '1px solid rgba(5,150,105,.2)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-xs)'
                      }}>
                        <Info size={14} style={{ color: '#059669', flexShrink: 0 }} />
                        <span>Este abono por <strong>{formatCurrency(Number(recaudoMonto))}</strong> se registrará en el historial de bitácora y abonos al hacer clic en <strong>Guardar Cambios</strong>.</span>
                      </div>
                    )}
                  </div>

                  {/* Listado Histórico */}
                  <div className="recaudo-list-section">
                    <h3 className="recaudo-list-title">
                      <LayoutList size={14} />
                      Historial de Abonos
                    </h3>
                    {loadingRecaudos ? (
                      <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-3)' }}>
                        Cargando abonos...
                      </div>
                    ) : !recaudos || recaudos.length === 0 ? (
                      <div className="recaudo-empty">
                        No hay abonos registrados para esta obligación.
                      </div>
                    ) : (
                      <div className="recaudo-list">
                        {recaudos.map((rec: any) => (
                          <div className="recaudo-item" key={rec.id}>
                            <div className="recaudo-item-header">
                              <span className="recaudo-item-amount">{formatCurrency(rec.monto)}</span>
                              <span className="recaudo-item-date">{formatDateString(rec.fechaAbonada)}</span>
                            </div>
                            <div className="recaudo-item-user">
                              <User size={12} />
                              {rec.usuario?.empleado
                                ? `${rec.usuario.empleado.nombres} ${rec.usuario.empleado.apellidos}`
                                : rec.usuario?.correo || 'Sistema'}
                            </div>
                            {rec.observacion && (
                              <div className="recaudo-item-comment">{rec.observacion}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Tab: Notificaciones ────────────────────────── */}
              {activeTab === 'notificaciones' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '0.65rem',
                      padding: '0.875rem 1rem',
                      background: 'var(--accent-xs)',
                      border: '1px solid var(--accent-s)',
                      borderRadius: 'var(--radius-s)',
                      fontSize: '0.8rem', color: 'var(--text-2)',
                    }}
                  >
                    <Bell size={15} style={{ color: 'var(--accent-h)', flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <strong style={{ display: 'block', marginBottom: '0.2rem', color: 'var(--text)' }}>
                        Control de Notificaciones Procesales
                      </strong>
                      Registra las notificaciones físicas, correos o requerimientos formales enviados a los deudores o codeudores.
                    </div>
                  </div>

                  <div className="update-form-grid" style={{ gap: '1rem' }}>
                    <div className="form-field">
                      <label htmlFor="notif-destinatario">Destinatario / Persona Notificada</label>
                      <select
                        id="notif-destinatario"
                        value={notifDestinatarioId}
                        onChange={(e) => setNotifDestinatarioId(e.target.value)}
                      >
                        <option value="">— Seleccionar Destinatario —</option>
                        {obligation.actores.map((actor: any) => {
                          const mainContact = actor.persona.contactos?.find((c: any) => c.esPrincipal) || actor.persona.contactos?.[0];
                          const contactText = mainContact ? ` (${mainContact.valor})` : '';
                          const roleLabel = actor.rolActor?.nombreRol === 'Deudor Principal' ? 'Deudor Principal' : 'Codeudor';
                          return (
                            <option key={actor.persona.id} value={actor.persona.id}>
                              {actor.persona.nombreCompleto} - {roleLabel}{contactText}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="form-field">
                      <label htmlFor="notif-fecha">Fecha de Notificación</label>
                      <input
                        id="notif-fecha"
                        type="date"
                        value={notifFecha}
                        onChange={(e) => setNotifFecha(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="notif-observacion">Observación / Detalle del Envío</label>
                    <textarea
                      id="notif-observacion"
                      value={notifObservacion}
                      onChange={(e) => setNotifObservacion(e.target.value)}
                      rows={3}
                      placeholder="Ej: Se envió requerimiento de cobro prejudicial vía correo certificado..."
                      style={{ resize: 'vertical' }}
                    />
                  </div>

                  {notifFecha && (notifDestinatarioId || notifObservacion.trim()) && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: 'rgba(139,92,246,.05)',
                      border: '1px solid rgba(139,92,246,.2)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '0.8rem',
                      color: '#8b5cf6'
                    }}>
                      <Info size={14} style={{ color: '#8b5cf6', flexShrink: 0 }} />
                      <span>Esta notificación se registrará al hacer clic en <strong>Guardar Cambios</strong>.</span>
                    </div>
                  )}

                  {/* Listado Histórico */}
                  <div className="recaudo-list-section" style={{ marginTop: '0.5rem' }}>
                    <h3 className="recaudo-list-title">
                      <LayoutList size={14} />
                      Notificaciones Enviadas
                    </h3>
                    {loadingNotificaciones ? (
                      <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-3)' }}>
                        Cargando notificaciones...
                      </div>
                    ) : !notificaciones || notificaciones.length === 0 ? (
                      <div className="recaudo-empty">
                        No se han registrado notificaciones para esta obligación.
                      </div>
                    ) : (
                      <div className="recaudo-list">
                        {notificaciones.map((not: any) => (
                          <div className="recaudo-item" key={not.id} style={{ borderLeft: '3px solid var(--accent)' }}>
                            <div className="recaudo-item-header">
                              <span className="recaudo-item-amount" style={{ fontSize: '0.82rem', color: 'var(--text)' }}>
                                {not.destinatarioPersona ? not.destinatarioPersona.nombreCompleto : 'Destinatario no especificado'}
                              </span>
                              <span className="recaudo-item-date">{formatDateString(not.fechaNotificacion)}</span>
                            </div>
                            {not.destinatarioPersona?.numeroIdentificacion && (
                              <div className="recaudo-item-user" style={{ fontSize: '0.72rem', color: 'var(--text-4)' }}>
                                Documento: {not.destinatarioPersona.numeroIdentificacion}
                              </div>
                            )}
                            {not.observacion && (
                              <div className="recaudo-item-comment" style={{ marginTop: '0.25rem' }}>{not.observacion}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── Tab: Nota de Gestión ────────────────────────── */}
              {activeTab === 'nota' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '0.65rem',
                      padding: '0.875rem 1rem',
                      background: 'rgba(2,132,199,.07)',
                      border: '1px solid rgba(2,132,199,.2)',
                      borderRadius: 'var(--radius-s)',
                      fontSize: '0.8rem', color: 'var(--text-2)',
                    }}
                  >
                    <MessageSquare size={15} style={{ color: '#0284c7', flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <strong style={{ display: 'block', marginBottom: '0.2rem', color: 'var(--text)' }}>
                        Nota de Gestión (Bitácora)
                      </strong>
                      Si escribes una nota, se guardará como registro de gestión en el historial
                      de esta obligación junto con los cambios realizados. La nota es opcional.
                    </div>
                  </div>

                  <div className="form-field">
                    <label htmlFor="upd-nota">
                      Observación / Nota
                      <span style={{ color: 'var(--text-4)', fontWeight: 400, marginLeft: '0.35rem' }}>
                        (opcional)
                      </span>
                    </label>
                    <textarea
                      id="upd-nota"
                      value={nota}
                      onChange={(e) => setNota(e.target.value)}
                      rows={6}
                      placeholder="Describe las acciones realizadas, acuerdos, observaciones de la gestión..."
                      style={{ resize: 'vertical', minHeight: '120px' }}
                    />
                    <span style={{ fontSize: '0.72rem', color: nota.length > 800 ? 'var(--danger)' : 'var(--text-4)', marginTop: '0.25rem' }}>
                      {nota.length} / 1000 caracteres
                    </span>
                  </div>

                  {nota.trim() && (
                    <div style={{
                      padding: '0.875rem 1rem',
                      background: 'rgba(5,150,105,.08)',
                      border: '1px solid rgba(5,150,105,.2)',
                      borderRadius: 'var(--radius-s)',
                      fontSize: '0.82rem', color: 'var(--text-2)',
                    }}>
                      <strong style={{ color: '#059669', display: 'block', marginBottom: '0.35rem', fontSize: '0.75rem' }}>
                        VISTA PREVIA DE LA NOTA:
                      </strong>
                      <p style={{ lineHeight: 1.6 }}>{nota}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── FOOTER ─────────────────────────────────────────── */}
            <div className="update-modal-footer">
              <div className="update-modal-footer-info">
                <Info size={13} />
                Los cambios quedan registrados en el historial de auditoría.
              </div>
              <div className="update-modal-footer-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  <X size={14} />
                  Cancelar
                </button>
                <button type="submit" className="btn-save" disabled={isSubmitting}>
                  <Save size={15} />
                  {isSubmitting 
                    ? 'Guardando…' 
                    : (recaudoMonto && Number(recaudoMonto) > 0)
                      ? 'Guardar + Abono' 
                      : (notifFecha && (notifDestinatarioId || notifObservacion.trim()))
                        ? 'Guardar + Notif.'
                        : nota.trim() 
                          ? 'Guardar + Nota' 
                          : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
