import { useState } from 'react';
import { X, Save, Eye, EyeOff, User, Lock, AlertCircle } from 'lucide-react';
import { useCreateEmployee } from '../api/employees.js';
import { useCargos } from '../../../shared/api/catalogs.js';

interface CreateEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Calcula la fortaleza de la contraseña (0-4) */
function getPasswordStrength(password: string): { score: number; label: string } {
  if (!password) return { score: 0, label: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  score = Math.min(score, 4);
  const labels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
  return { score, label: labels[score] };
}

const STRENGTH_CLASS = ['', 'filled-weak', 'filled-fair', 'filled-good', 'filled-strong'];

export function CreateEmployeeModal({ isOpen, onClose }: CreateEmployeeModalProps) {
  const { mutateAsync: createEmployee, isPending } = useCreateEmployee();
  const { data: cargos } = useCargos();

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    identificacion: '',
    nombres: '',
    apellidos: '',
    telefono: '',
    cargoId: '',
    correo: '',
    password: '',
  });

  const passwordStrength = getPasswordStrength(formData.password);

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await createEmployee({
        identificacion: formData.identificacion.trim(),
        nombres: formData.nombres.trim(),
        apellidos: formData.apellidos.trim(),
        telefono: formData.telefono.trim() || undefined,
        cargoId: formData.cargoId || undefined,
        correo: formData.correo.trim(),
        password: formData.password,
      });

      onClose();
      setFormData({
        identificacion: '', nombres: '', apellidos: '', telefono: '',
        cargoId: '', correo: '', password: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el asesor');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        {/* ── Cabecera ── */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Nuevo Asesor de Cobranza</h2>
            <p className="modal-subtitle">
              Las credenciales generadas deben compartirse manualmente con el asesor.
            </p>
          </div>
          <button className="icon-btn" onClick={onClose} title="Cerrar">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* ── Error global ── */}
            {error && (
              <div className="security-alert" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', marginBottom: '1.25rem' }}>
                <AlertCircle size={16} style={{ color: '#f87171', flexShrink: 0, marginTop: '1px' }} />
                <p style={{ color: '#fca5a5' }}>{error}</p>
              </div>
            )}

            {/* ══ Sección: Datos personales ══ */}
            <div className="form-section-divider">
              <User size={14} style={{ color: 'var(--text-3)' }} />
              <span className="form-section-label">Datos del Asesor</span>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">No. Identificación *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  maxLength={20}
                  placeholder="1234567890"
                  value={formData.identificacion}
                  onChange={handleChange('identificacion')}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Cargo</label>
                <select
                  className="form-input"
                  value={formData.cargoId}
                  onChange={handleChange('cargoId')}
                >
                  <option value="">— Sin cargo —</option>
                  {cargos?.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombreCargo}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nombres *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  maxLength={100}
                  placeholder="Juan Carlos"
                  value={formData.nombres}
                  onChange={handleChange('nombres')}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Apellidos *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  maxLength={100}
                  placeholder="García López"
                  value={formData.apellidos}
                  onChange={handleChange('apellidos')}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Teléfono</label>
              <input
                type="tel"
                className="form-input"
                maxLength={20}
                placeholder="3001234567"
                value={formData.telefono}
                onChange={handleChange('telefono')}
              />
            </div>

            {/* ══ Sección: Credenciales de acceso ══ */}
            <div className="form-section-divider" style={{ marginTop: '1.5rem' }}>
              <Lock size={14} style={{ color: 'var(--text-3)' }} />
              <span className="form-section-label">Credenciales de Acceso</span>
            </div>

            <div className="security-alert">
              <AlertCircle size={16} style={{ color: '#fcd34d', flexShrink: 0, marginTop: '1px' }} />
              <p>
                El asesor usará estas credenciales para ingresar al sistema. Compártelas de manera segura.
                El asesor puede cambiar su contraseña desde su perfil.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Correo Electrónico *</label>
              <input
                type="email"
                className="form-input"
                required
                maxLength={100}
                placeholder="asesor@empresa.com"
                value={formData.correo}
                onChange={handleChange('correo')}
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña *</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input with-toggle"
                  required
                  minLength={8}
                  maxLength={100}
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={handleChange('password')}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Indicador de fortaleza */}
              {formData.password && (
                <div className="password-strength">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`strength-bar ${i <= passwordStrength.score ? STRENGTH_CLASS[passwordStrength.score] : ''}`}
                    />
                  ))}
                  <span className="strength-label">{passwordStrength.label}</span>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={
                isPending ||
                !formData.identificacion ||
                !formData.nombres ||
                !formData.apellidos ||
                !formData.correo ||
                formData.password.length < 8
              }
            >
              {isPending ? (
                'Creando...'
              ) : (
                <>
                  <Save size={16} /> Crear Asesor
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
