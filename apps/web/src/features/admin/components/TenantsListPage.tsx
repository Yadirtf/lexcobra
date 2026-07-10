import { useState } from 'react';
import { Plus, X, Save, Pencil, Ban, CheckCircle, Mail } from 'lucide-react';
import { useTenants, useCreateTenant, useUpdateTenant, useToggleTenantStatus, useUpdateAdminEmail, Tenant } from '../api/clients.js';
import { usePlans } from '../api/plans.js';

export function TenantsListPage() {
  const { data: tenants, isLoading } = useTenants();
  const { data: plans } = usePlans();
  const { mutateAsync: createTenant, isPending: isCreating } = useCreateTenant();
  const { mutateAsync: updateTenant, isPending: isUpdating } = useUpdateTenant();
  const { mutateAsync: toggleStatus, isPending: isToggling } = useToggleTenantStatus();
  const { mutateAsync: updateAdminEmail, isPending: isUpdatingEmail } = useUpdateAdminEmail();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);

  // Estado del modal de cambio de correo
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailModalTenant, setEmailModalTenant] = useState<Pick<Tenant, 'id' | 'nombreComercial'> | null>(null);
  const [emailFormData, setEmailFormData] = useState({ nuevoCorreo: '', confirmarCorreo: '' });
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nit: '',
    nombreComercial: '',
    subdominio: '',
    adminEmail: '',
    adminPasswordPlana: '',
    planId: '',
    fechaInicioSuscripcion: new Date().toISOString().split('T')[0],
    fechaFinSuscripcion: ''
  });

  const openCreateModal = () => {
    setEditingTenantId(null);
    setFormData({
      nit: '', nombreComercial: '', subdominio: '', adminEmail: '',
      adminPasswordPlana: '', planId: '', 
      fechaInicioSuscripcion: new Date().toISOString().split('T')[0],
      fechaFinSuscripcion: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (tenant: Tenant) => {
    setEditingTenantId(tenant.id);
    const sub = tenant.suscripciones?.[0];
    setFormData({
      nit: tenant.nit,
      nombreComercial: tenant.nombreComercial,
      subdominio: tenant.subdominio,
      adminEmail: '', // Cannot edit admin credentials from here
      adminPasswordPlana: '',
      planId: sub?.plan.nombre ? plans?.find(p => p.nombre === sub.plan.nombre)?.id || '' : '',
      fechaInicioSuscripcion: sub ? new Date(sub.fechaInicio).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      fechaFinSuscripcion: sub ? new Date(sub.fechaFin).toISOString().split('T')[0] : ''
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (tenantId: string, currentStatus: string | undefined) => {
    if (!window.confirm(`¿Estás seguro de que deseas ${currentStatus === 'Inactivo' ? 'activar' : 'suspender'} esta entidad?`)) return;
    try {
      await toggleStatus({ id: tenantId, suspendido: currentStatus !== 'Inactivo' });
    } catch (err: any) {
      alert('Error al cambiar el estado: ' + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTenantId) {
        await updateTenant({ id: editingTenantId, data: formData });
      } else {
        await createTenant(formData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error al procesar la operación');
    }
  };

  // ── Handlers del modal de correo ──────────────────────────────────────────────────

  const openEmailModal = (tenant: Tenant) => {
    setEmailModalTenant({ id: tenant.id, nombreComercial: tenant.nombreComercial });
    setEmailFormData({ nuevoCorreo: '', confirmarCorreo: '' });
    setEmailError(null);
    setEmailSuccess(null);
    setIsEmailModalOpen(true);
  };

  const closeEmailModal = () => {
    setIsEmailModalOpen(false);
    setEmailModalTenant(null);
    setEmailError(null);
    setEmailSuccess(null);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(null);

    // Validación en frontend
    if (emailFormData.nuevoCorreo !== emailFormData.confirmarCorreo) {
      setEmailError('Los correos electrónicos no coinciden.');
      return;
    }

    if (!emailModalTenant) return;

    try {
      await updateAdminEmail({
        id: emailModalTenant.id,
        data: { nuevoCorreo: emailFormData.nuevoCorreo },
      });
      setEmailSuccess('Correo actualizado correctamente.');
      // Cerrar automáticamente después de 1.5 segundos
      setTimeout(() => closeEmailModal(), 1500);
    } catch (err: any) {
      setEmailError(err.message || 'Error al actualizar el correo. Inténtelo de nuevo.');
    }
  };

  return (
    <div className="portfolios-container">
      <div className="portfolios-header">
        <h1 className="portfolios-title">Casas de Cobranza (Inquilinos)</h1>
        <button className="btn-primary" onClick={openCreateModal}>
          <Plus size={18} /> Nueva Entidad
        </button>
      </div>

      {isLoading ? (
        <p>Cargando clientes...</p>
      ) : (
        <div className="table-container" style={{ marginTop: '1.5rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>NIT</th>
                <th>Razón Social</th>
                <th>Subdominio</th>
                <th>Suscripción Actual</th>
                <th>Estado Suscripción</th>
                <th style={{ width: '140px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tenants?.map((tenant) => {
                const sub = tenant.suscripciones[0];
                return (
                  <tr key={tenant.id}>
                    <td>{tenant.nit}</td>
                    <td><strong>{tenant.nombreComercial}</strong></td>
                    <td>{tenant.subdominio}.lexcobra.app</td>
                    <td>
                      {sub ? (
                        <>
                          {sub.plan.nombre} <br/>
                          <small style={{ color: 'var(--text-3)' }}>Hasta: {new Date(sub.fechaFin).toLocaleDateString()}</small>
                        </>
                      ) : (
                        <span style={{ color: 'var(--error)' }}>Sin suscripción</span>
                      )}
                    </td>
                    <td>
                      {(() => {
                        const isSuspended = tenant.estado?.estado === 'Inactivo';
                        const isVigente = sub && new Date(sub.fechaFin) >= new Date();
                        let badgeClass = 'status-inactive';
                        let badgeText = 'Inactivo (Suspendido)';
                        if (!isSuspended) {
                          badgeClass = isVigente ? 'status-active' : 'status-inactive';
                          badgeText = isVigente ? 'Vigente' : 'Vencida';
                        }
                        return <span className={`status-badge ${badgeClass}`}>{badgeText}</span>;
                      })()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button className="icon-btn" onClick={() => openEditModal(tenant)} title="Editar Entidad">
                          <Pencil size={18} color="var(--accent)" />
                        </button>
                        <button
                          className="icon-btn"
                          onClick={() => openEmailModal(tenant)}
                          title="Cambiar Correo del Administrador"
                        >
                          <Mail size={18} color="var(--info, #60a5fa)" />
                        </button>
                        <button 
                          className="icon-btn" 
                          onClick={() => handleToggleStatus(tenant.id, tenant.estado?.estado)} 
                          title={tenant.estado?.estado === 'Inactivo' ? 'Reactivar' : 'Suspender'}
                          disabled={isToggling}
                        >
                          {tenant.estado?.estado === 'Inactivo' ? <CheckCircle size={18} color="var(--success)" /> : <Ban size={18} color="var(--danger)" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {tenants?.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No hay Casas de Cobranza registradas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Crear / Editar Tenant */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingTenantId ? 'Editar Casa de Cobranza' : 'Registrar Casa de Cobranza'}</h2>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--gold)' }}>1. Datos de la Entidad</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">NIT *</label>
                  <input type="text" className="form-input" required
                    value={formData.nit} onChange={e => setFormData({...formData, nit: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Razón Social *</label>
                  <input type="text" className="form-input" required
                    value={formData.nombreComercial} onChange={e => setFormData({...formData, nombreComercial: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Subdominio Único (Url) *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="text" className="form-input" required placeholder="ej. mipymes" style={{ flex: 1 }}
                    value={formData.subdominio} onChange={e => setFormData({...formData, subdominio: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} />
                  <span style={{ color: 'var(--text-3)' }}>.lexcobra.app</span>
                </div>
              </div>

              {!editingTenantId && (
                <>
                  <h3 style={{ fontSize: '1rem', margin: '1.5rem 0 1rem', color: 'var(--gold)' }}>2. Cuenta del Administrador</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Correo Electrónico *</label>
                      <input type="email" className="form-input" required
                        value={formData.adminEmail} onChange={e => setFormData({...formData, adminEmail: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Contraseña Temporal *</label>
                      <input type="password" className="form-input" required minLength={6}
                        value={formData.adminPasswordPlana} onChange={e => setFormData({...formData, adminPasswordPlana: e.target.value})} />
                    </div>
                  </div>
                </>
              )}

              <h3 style={{ fontSize: '1rem', margin: '1.5rem 0 1rem', color: 'var(--gold)' }}>
                {editingTenantId ? '2. Actualizar Suscripción (Opcional)' : '3. Suscripción SaaS'}
              </h3>
              <div className="form-group">
                <label className="form-label">Plan a Contratar {editingTenantId ? '' : '*'}</label>
                <select className="form-input" required={!editingTenantId}
                  value={formData.planId} onChange={e => setFormData({...formData, planId: e.target.value})}>
                  <option value="">Seleccione un plan</option>
                  {plans?.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} - ${p.precio.toLocaleString()} / {p.duracionMeses} Meses</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Fecha Inicio {editingTenantId ? '' : '*'}</label>
                  <input type="date" className="form-input" required={!editingTenantId && !!formData.planId}
                    value={formData.fechaInicioSuscripcion} onChange={e => setFormData({...formData, fechaInicioSuscripcion: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha Vencimiento {editingTenantId ? '' : '*'}</label>
                  <input type="date" className="form-input" required={!editingTenantId && !!formData.planId}
                    value={formData.fechaFinSuscripcion} onChange={e => setFormData({...formData, fechaFinSuscripcion: e.target.value})} />
                </div>
              </div>
              </div>
              
              <div className="modal-footer" style={{ marginTop: '0' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isCreating || isUpdating || (!editingTenantId && !formData.planId)}>
                  {(isCreating || isUpdating) ? 'Guardando...' : <><Save size={16}/> {editingTenantId ? 'Guardar Cambios' : 'Registrar Casa de Cobranza'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
           Modal: Cambiar Correo del Administrador
         ─────────────────────────────────────────────────────────── */}
      {isEmailModalOpen && emailModalTenant && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                <Mail size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Cambiar Correo del Administrador
              </h2>
              <button className="icon-btn" onClick={closeEmailModal} disabled={isUpdatingEmail}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEmailSubmit}>
              <div className="modal-body">
                {/* Nombre de la entidad (solo lectura) */}
                <div
                  style={{
                    background: 'var(--surface-2, rgba(255,255,255,0.04))',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>Entidad:</span>
                  <strong style={{ color: 'var(--text-1)' }}>{emailModalTenant.nombreComercial}</strong>
                </div>

                {/* Nuevo correo */}
                <div className="form-group">
                  <label className="form-label">Nuevo Correo Electrónico *</label>
                  <input
                    type="email"
                    className="form-input"
                    required
                    placeholder="nuevo@correo.com"
                    value={emailFormData.nuevoCorreo}
                    onChange={(e) =>
                      setEmailFormData({ ...emailFormData, nuevoCorreo: e.target.value })
                    }
                    disabled={isUpdatingEmail || !!emailSuccess}
                    autoFocus
                  />
                </div>

                {/* Confirmar correo */}
                <div className="form-group">
                  <label className="form-label">Confirmar Correo *</label>
                  <input
                    type="email"
                    className="form-input"
                    required
                    placeholder="nuevo@correo.com"
                    value={emailFormData.confirmarCorreo}
                    onChange={(e) =>
                      setEmailFormData({ ...emailFormData, confirmarCorreo: e.target.value })
                    }
                    disabled={isUpdatingEmail || !!emailSuccess}
                  />
                </div>

                {/* Mensaje de error */}
                {emailError && (
                  <div
                    style={{
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid var(--danger, #ef4444)',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      color: 'var(--danger, #ef4444)',
                      fontSize: '0.875rem',
                      marginTop: '0.5rem',
                    }}
                  >
                    {emailError}
                  </div>
                )}

                {/* Mensaje de éxito */}
                {emailSuccess && (
                  <div
                    style={{
                      background: 'rgba(34,197,94,0.1)',
                      border: '1px solid var(--success, #22c55e)',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      color: 'var(--success, #22c55e)',
                      fontSize: '0.875rem',
                      marginTop: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <CheckCircle size={16} /> {emailSuccess}
                  </div>
                )}

                {/* Aviso informativo */}
                <p
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-3)',
                    marginTop: '1rem',
                    lineHeight: '1.5',
                  }}
                >
                  ⚠️ El administrador deberá utilizar el nuevo correo para iniciar sesión a partir de la próxima renovación de sesión.
                </p>
              </div>

              <div className="modal-footer" style={{ marginTop: '0' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeEmailModal}
                  disabled={isUpdatingEmail}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isUpdatingEmail || !!emailSuccess}
                >
                  {isUpdatingEmail ? (
                    'Guardando...'
                  ) : (
                    <><Mail size={15} /> Actualizar Correo</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
