import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, LayoutList, Scale, Users, Save, Info, User, MessageSquare, Search } from 'lucide-react';
import { Obligation, useFullUpdateObligation, useAddBitacora } from '../api/obligations.js';
import { useCatalogs } from '../../../shared/api/catalogs.js';
import { useJuzgados } from '../api/catalogs.js';
import './Obligations.css';

interface UpdateObligationModalProps {
  obligation: Obligation | null;
  isOpen: boolean;
  onClose: () => void;
}

type ActiveTab = 'general' | 'juridico' | 'actores' | 'nota';

export function UpdateObligationModal({ obligation, isOpen, onClose }: UpdateObligationModalProps) {
  const { estadosObligacion, nivelesRecuperacion, tiposContacto, isLoading: loadingCatalogs } = useCatalogs();
  const { data: juzgados, isLoading: loadingJuzgados } = useJuzgados();
  const { mutateAsync: updateObligation, isPending } = useFullUpdateObligation();
  const { mutateAsync: addBitacora, isPending: isSavingNota } = useAddBitacora();

  const [formData, setFormData] = useState<any>({});
  const [activeTab, setActiveTab] = useState<ActiveTab>('general');
  const [nota, setNota] = useState('');
  const [juzgadoSearch, setJuzgadoSearch] = useState('');

  useEffect(() => {
    if (obligation) {
      setFormData({
        creditNumber:    obligation.numeroCredito || '',
        capitalBalance:  obligation.saldoCapitalDemandado || 0,
        statusId:        obligation.estadoObligacionId || '',
        recoveryLevelId: obligation.nivelRecuperacionId || '',
        docketNumber:    obligation.radicado || '',
        courtId:         obligation.juzgadoId || '',
        debtors: obligation.actores
          .filter((a) => a.rolActor?.nombreRol === 'Deudor Principal')
          .map((a) => ({
            documentId:          a.persona.numeroIdentificacion,
            fullName:            a.persona.nombreCompleto,
            tipoIdentificacionId: a.persona.tipoIdentificacionId || undefined,
            contacts: [],
          })),
      });
      setActiveTab('general');
      setNota('');
      setJuzgadoSearch('');
    }
  }, [obligation]);

  if (!isOpen || !obligation) return null;

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
          debtors:         formData.debtors,
        },
      });
      // Si hay nota, guardarla como bitácora después de actualizar
      if (nota.trim()) {
        await addBitacora({ id: obligation.id, data: { observacion: nota.trim() } });
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
    { key: 'nota',     label: 'Nota de Gestión',  icon: <MessageSquare size={14} />, badge: nota.trim() ? '✓' : undefined },
  ];

  const isSubmitting = isPending || isSavingNota;

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
                    <div className="form-field">
                      <label>Juzgado seleccionado</label>
                      <div style={{
                        padding: '0.6rem 0.875rem',
                        background: 'var(--surface-2)',
                        border: '1.5px solid var(--border)',
                        borderRadius: 'var(--radius-s)',
                        fontSize: '0.84rem',
                        color: selectedJuzgado ? 'var(--text)' : 'var(--text-4)',
                        fontStyle: selectedJuzgado ? 'normal' : 'italic',
                        minHeight: '38px',
                        display: 'flex',
                        alignItems: 'center',
                      }}>
                        {selectedJuzgado?.nombre ?? 'Ninguno seleccionado'}
                      </div>
                    </div>
                  </div>

                  {/* Selector de juzgados con búsqueda */}
                  <div className="form-field">
                    <label>Seleccionar Juzgado</label>
                    <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                      <Search
                        size={14}
                        style={{
                          position: 'absolute', left: '0.75rem', top: '50%',
                          transform: 'translateY(-50%)', color: 'var(--text-4)', pointerEvents: 'none',
                        }}
                      />
                      <input
                        type="text"
                        value={juzgadoSearch}
                        onChange={(e) => setJuzgadoSearch(e.target.value)}
                        placeholder="Buscar juzgado por nombre..."
                        style={{ paddingLeft: '2.2rem' }}
                      />
                    </div>

                    {loadingJuzgados ? (
                      <div className="timeline-loading" style={{ padding: '0.5rem 0' }}>
                        {[90, 70, 80].map((w, i) => (
                          <div key={i} className="skeleton-line" style={{ width: `${w}%` }} />
                        ))}
                      </div>
                    ) : (
                      <div className="juzgado-list">
                        {/* Opción: limpiar selección */}
                        <div
                          className={`juzgado-item${!formData.courtId ? ' selected' : ''}`}
                          onClick={() => setFormData({ ...formData, courtId: '' })}
                        >
                          <span style={{ fontStyle: 'italic', color: 'var(--text-4)' }}>
                            Sin juzgado asignado
                          </span>
                        </div>

                        {filteredJuzgados.length === 0 && (
                          <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-4)', fontSize: '0.82rem' }}>
                            No se encontraron juzgados con ese nombre
                          </div>
                        )}

                        {filteredJuzgados.map((j: any) => (
                          <div
                            key={j.id}
                            className={`juzgado-item${formData.courtId === j.id ? ' selected' : ''}`}
                            onClick={() => setFormData({ ...formData, courtId: j.id })}
                          >
                            <div className="juzgado-item-name">{j.nombre}</div>
                            {(j.informacion?.municipio?.nombre || j.informacion?.departamento?.nombre) && (
                              <div className="juzgado-item-location">
                                {[j.informacion?.municipio?.nombre, j.informacion?.departamento?.nombre]
                                  .filter(Boolean).join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
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
                  {isSubmitting ? 'Guardando…' : nota.trim() ? 'Guardar + Nota' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
