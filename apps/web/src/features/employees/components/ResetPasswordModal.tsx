import { useState } from 'react';
import { X, Key, Eye, EyeOff, AlertCircle, ShieldCheck } from 'lucide-react';
import { useResetEmployeePassword, type Employee } from '../api/employees.js';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
}

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

export function ResetPasswordModal({ isOpen, onClose, employee }: ResetPasswordModalProps) {
  const { mutateAsync: resetPassword, isPending } = useResetEmployeePassword();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const [formData, setFormData] = useState({
    passwordNuevo: '',
    passwordNuevoConfirmacion: '',
  });

  const passwordStrength = getPasswordStrength(formData.passwordNuevo);
  const passwordsMatch =
    formData.passwordNuevo &&
    formData.passwordNuevo === formData.passwordNuevoConfirmacion;

  if (!isOpen || !employee) return null;

  const handleClose = () => {
    setFormData({ passwordNuevo: '', passwordNuevoConfirmacion: '' });
    setError(null);
    setDone(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.passwordNuevo !== formData.passwordNuevoConfirmacion) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      await resetPassword({
        id: employee.id,
        data: {
          passwordNuevo: formData.passwordNuevo,
          passwordNuevoConfirmacion: formData.passwordNuevoConfirmacion,
        },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al restablecer la contraseña');
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="modal">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Restablecer Contraseña</h2>
            <p className="modal-subtitle">
              {employee.nombres} {employee.apellidos}
            </p>
          </div>
          <button className="icon-btn" onClick={handleClose} title="Cerrar">
            <X size={20} />
          </button>
        </div>

        {/* ══ Estado de éxito ══ */}
        {done ? (
          <>
            <div className="modal-body" style={{ textAlign: 'center', padding: '2.5rem 1.75rem' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(16,185,129,0.12)',
                  border: '1px solid rgba(16,185,129,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}
              >
                <ShieldCheck size={32} style={{ color: '#34d399' }} />
              </div>
              <h3 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>
                Contraseña restablecida
              </h3>
              <p style={{ color: 'var(--text-3)', fontSize: '0.9rem' }}>
                La nueva contraseña ha sido asignada. Compártela de forma segura con el asesor.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={handleClose}>
                Listo
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="security-alert">
                <AlertCircle size={16} style={{ color: '#fcd34d', flexShrink: 0, marginTop: '1px' }} />
                <p>
                  Esta acción reemplazará la contraseña actual del asesor.
                  Comparte la nueva contraseña de forma segura.
                </p>
              </div>

              {error && (
                <div
                  className="security-alert"
                  style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}
                >
                  <AlertCircle size={16} style={{ color: '#f87171', flexShrink: 0 }} />
                  <p style={{ color: '#fca5a5' }}>{error}</p>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Nueva contraseña *</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input with-toggle"
                    required
                    minLength={8}
                    placeholder="Mínimo 8 caracteres"
                    value={formData.passwordNuevo}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, passwordNuevo: e.target.value }))
                    }
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {formData.passwordNuevo && (
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

              <div className="form-group">
                <label className="form-label">Confirmar contraseña *</label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className="form-input with-toggle"
                    required
                    style={{
                      borderColor:
                        formData.passwordNuevoConfirmacion && !passwordsMatch
                          ? 'rgba(239,68,68,0.5)'
                          : passwordsMatch
                          ? 'rgba(16,185,129,0.5)'
                          : undefined,
                    }}
                    placeholder="Repite la contraseña"
                    value={formData.passwordNuevoConfirmacion}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, passwordNuevoConfirmacion: e.target.value }))
                    }
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirm((v) => !v)}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {formData.passwordNuevoConfirmacion && !passwordsMatch && (
                  <p style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.35rem' }}>
                    Las contraseñas no coinciden
                  </p>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={handleClose}>
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={
                  isPending ||
                  formData.passwordNuevo.length < 8 ||
                  !passwordsMatch
                }
                style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}
              >
                {isPending ? (
                  'Restableciendo...'
                ) : (
                  <>
                    <Key size={16} /> Restablecer Contraseña
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
