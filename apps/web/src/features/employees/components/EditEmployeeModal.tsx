import { useState, useEffect } from 'react';
import { X, Save, Mail, AlertCircle } from 'lucide-react';
import { useUpdateEmployee, useUpdateEmployeeEmail, type Employee } from '../api/employees.js';
import { useCargos } from '../../../shared/api/catalogs.js';

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

export function EditEmployeeModal({ isOpen, onClose, employee }: EditEmployeeModalProps) {
  const { mutateAsync: updateEmployee, isPending: isUpdating } = useUpdateEmployee();
  const { mutateAsync: updateEmail, isPending: isUpdatingEmail } = useUpdateEmployeeEmail();
  const { data: cargos } = useCargos();

  const [activeTab, setActiveTab] = useState<'profile' | 'email'>('profile');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profileData, setProfileData] = useState({
    nombres: '',
    apellidos: '',
    telefono: '',
    cargoId: '',
  });

  const [emailData, setEmailData] = useState({ correo: '' });

  // Pre-cargar datos cuando se abre el modal
  useEffect(() => {
    if (employee && isOpen) {
      setProfileData({
        nombres: employee.nombres,
        apellidos: employee.apellidos,
        telefono: employee.telefono ?? '',
        cargoId: employee.cargo?.id ?? '',
      });
      setEmailData({ correo: employee.usuario?.correo ?? '' });
      setError(null);
      setSuccess(null);
      setActiveTab('profile');
    }
  }, [employee, isOpen]);

  if (!isOpen || !employee) return null;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await updateEmployee({
        id: employee.id,
        data: {
          nombres: profileData.nombres.trim(),
          apellidos: profileData.apellidos.trim(),
          telefono: profileData.telefono.trim() || null,
          cargoId: profileData.cargoId || null,
        },
      });
      setSuccess('Datos del asesor actualizados correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el asesor');
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      await updateEmail({
        id: employee.id,
        data: { correo: emailData.correo.trim() },
      });
      setSuccess('Correo del asesor actualizado correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el correo');
    }
  };

  const isPending = isUpdating || isUpdatingEmail;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Editar Asesor</h2>
            <p className="modal-subtitle">
              {employee.nombres} {employee.apellidos}
            </p>
          </div>
          <button className="icon-btn" onClick={onClose} title="Cerrar">
            <X size={20} />
          </button>
        </div>

        {/* Pestañas */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 1.75rem' }}>
          {(['profile', 'email'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setError(null); setSuccess(null); }}
              style={{
                padding: '0.75rem 1.25rem',
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${activeTab === tab ? 'var(--accent-h)' : 'transparent'}`,
                color: activeTab === tab ? 'var(--accent-h)' : 'var(--text-3)',
                fontWeight: activeTab === tab ? 600 : 400,
                cursor: 'pointer',
                fontSize: '0.875rem',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginBottom: '-1px',
              }}
            >
              {tab === 'profile' ? 'Datos personales' : (
                <><Mail size={14} /> Correo de acceso</>
              )}
            </button>
          ))}
        </div>

        {/* Feedback de error/éxito */}
        {(error || success) && (
          <div style={{ padding: '0.75rem 1.75rem 0' }}>
            <div
              className="security-alert"
              style={success ? {
                background: 'rgba(16,185,129,0.08)',
                borderColor: 'rgba(16,185,129,0.25)',
              } : {
                background: 'rgba(239,68,68,0.08)',
                borderColor: 'rgba(239,68,68,0.25)',
              }}
            >
              <AlertCircle size={16} style={{ color: success ? '#34d399' : '#f87171', flexShrink: 0 }} />
              <p style={{ color: success ? '#6ee7b7' : '#fca5a5' }}>{success || error}</p>
            </div>
          </div>
        )}

        {/* ═══ Pestaña: Datos personales ═══ */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit}>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nombres *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    maxLength={100}
                    value={profileData.nombres}
                    onChange={(e) => setProfileData((p) => ({ ...p, nombres: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Apellidos *</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    maxLength={100}
                    value={profileData.apellidos}
                    onChange={(e) => setProfileData((p) => ({ ...p, apellidos: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input
                    type="tel"
                    className="form-input"
                    maxLength={20}
                    value={profileData.telefono}
                    onChange={(e) => setProfileData((p) => ({ ...p, telefono: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Cargo</label>
                  <select
                    className="form-input"
                    value={profileData.cargoId}
                    onChange={(e) => setProfileData((p) => ({ ...p, cargoId: e.target.value }))}
                  >
                    <option value="">— Sin cargo —</option>
                    {cargos?.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombreCargo}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={isPending}>
                {isUpdating ? 'Guardando...' : <><Save size={16} /> Guardar Cambios</>}
              </button>
            </div>
          </form>
        )}

        {/* ═══ Pestaña: Correo de acceso ═══ */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailSubmit}>
            <div className="modal-body">
              <div className="security-alert">
                <AlertCircle size={16} style={{ color: '#fcd34d', flexShrink: 0, marginTop: '1px' }} />
                <p>
                  Actualiza el correo cuando el asesor no pueda ingresar con el correo actual.
                  El nuevo correo se usará para el próximo inicio de sesión.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Correo actual</label>
                <input
                  type="text"
                  className="form-input"
                  value={employee.usuario?.correo ?? '—'}
                  disabled
                  style={{ opacity: 0.5 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nuevo correo electrónico *</label>
                <input
                  type="email"
                  className="form-input"
                  required
                  maxLength={100}
                  placeholder="nuevo@empresa.com"
                  value={emailData.correo}
                  onChange={(e) => setEmailData({ correo: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isPending || !emailData.correo || emailData.correo === employee.usuario?.correo}
              >
                {isUpdatingEmail ? 'Actualizando...' : <><Mail size={16} /> Actualizar Correo</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
