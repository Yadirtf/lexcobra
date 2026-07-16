import { useState } from 'react';
import { User, Lock, Eye, EyeOff, Save, AlertCircle, ShieldCheck, Mail } from 'lucide-react';
import { useMyProfile, useUpdateMyProfile, useChangeMyPassword } from '../api/employees.js';
import './Employees.css';

// ── Helpers ────────────────────────────────────────────────────

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

// ── Componente principal ───────────────────────────────────────

export function MyProfilePage() {
  const { data: profile, isLoading } = useMyProfile();
  const { mutateAsync: updateProfile, isPending: isUpdatingProfile } = useUpdateMyProfile();
  const { mutateAsync: changePassword, isPending: isChangingPassword } = useChangeMyPassword();

  // ── Estado del formulario de perfil ──
  const [profileData, setProfileData] = useState({
    nombres: '',
    apellidos: '',
    telefono: '',
  });
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ── Estado del formulario de contraseña ──
  const [passwordData, setPasswordData] = useState({
    passwordActual: '',
    passwordNuevo: '',
    passwordNuevoConfirmacion: '',
  });
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPasswords, setShowPasswords] = useState({
    actual: false, nueva: false, confirmacion: false,
  });

  const passwordStrength = getPasswordStrength(passwordData.passwordNuevo);
  const passwordsMatch =
    passwordData.passwordNuevo &&
    passwordData.passwordNuevo === passwordData.passwordNuevoConfirmacion;

  // Inicializar formulario cuando llegan los datos
  const empleado = profile?.empleado;
  const initials = empleado
    ? `${empleado.nombres.charAt(0)}${empleado.apellidos.charAt(0)}`.toUpperCase()
    : (profile?.firstName?.charAt(0) ?? 'U').toUpperCase();

  // Prellenar cuando el perfil carga
  if (empleado && !profileData.nombres && !isLoading) {
    setProfileData({
      nombres: empleado.nombres,
      apellidos: empleado.apellidos,
      telefono: empleado.telefono ?? '',
    });
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      await updateProfile({
        nombres: profileData.nombres.trim(),
        apellidos: profileData.apellidos.trim(),
        telefono: profileData.telefono.trim() || null,
      });
      setProfileMsg({ type: 'success', text: 'Tu perfil fue actualizado correctamente.' });
    } catch (err) {
      setProfileMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al actualizar el perfil',
      });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (passwordData.passwordNuevo !== passwordData.passwordNuevoConfirmacion) {
      setPasswordMsg({ type: 'error', text: 'Las contraseñas nuevas no coinciden' });
      return;
    }

    try {
      await changePassword({
        passwordActual: passwordData.passwordActual,
        passwordNuevo: passwordData.passwordNuevo,
        passwordNuevoConfirmacion: passwordData.passwordNuevoConfirmacion,
      });
      setPasswordMsg({ type: 'success', text: 'Tu contraseña fue actualizada correctamente.' });
      setPasswordData({ passwordActual: '', passwordNuevo: '', passwordNuevoConfirmacion: '' });
    } catch (err) {
      setPasswordMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al cambiar la contraseña',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)' }}>
            Cargando tu perfil…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* ── Cabecera ── */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="employees-title">Mi Perfil</h1>
        <p className="employees-subtitle">
          Actualiza tus datos personales y contraseña de acceso
        </p>
      </div>

      {/* ── Avatar y datos básicos ── */}
      <div className="profile-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div className="profile-avatar-lg" style={{ margin: 0 }}>
            {initials}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text)' }}>
              {empleado
                ? `${empleado.nombres} ${empleado.apellidos}`
                : `${profile?.firstName} ${profile?.lastName}`}
            </div>
            <div style={{ color: 'var(--text-3)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Mail size={13} />
              {profile?.email}
            </div>
            {empleado?.cargo && (
              <span className="employee-cargo-badge" style={{ marginTop: '0.4rem', display: 'inline-block' }}>
                {empleado.cargo.nombreCargo}
              </span>
            )}
          </div>
        </div>

        {/* Nota sobre el correo */}
        <div style={{
          background: 'rgba(59,130,246,0.07)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: '8px',
          padding: '0.65rem 0.9rem',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          marginBottom: '0.5rem',
        }}>
          <Mail size={14} style={{ color: '#93c5fd', flexShrink: 0 }} />
          <p style={{ fontSize: '0.82rem', color: '#93c5fd' }}>
            Tu correo de acceso ({profile?.email}) solo puede ser cambiado por el Representante Legal.
          </p>
        </div>
      </div>

      {/* ── Formulario: Datos personales ── */}
      {empleado && (
        <div className="profile-card">
          <h2 className="profile-card-title">
            <User size={18} style={{ color: 'var(--accent-h)' }} />
            Datos personales
          </h2>

          {profileMsg && (
            <div
              className="security-alert"
              style={
                profileMsg.type === 'success'
                  ? { background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.25)', marginBottom: '1rem' }
                  : { background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', marginBottom: '1rem' }
              }
            >
              {profileMsg.type === 'success' ? (
                <ShieldCheck size={16} style={{ color: '#34d399', flexShrink: 0 }} />
              ) : (
                <AlertCircle size={16} style={{ color: '#f87171', flexShrink: 0 }} />
              )}
              <p style={{ color: profileMsg.type === 'success' ? '#6ee7b7' : '#fca5a5' }}>
                {profileMsg.text}
              </p>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="profile-form">
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
                  id="profile-nombres"
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
                  id="profile-apellidos"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Teléfono</label>
              <input
                type="tel"
                className="form-input"
                maxLength={20}
                placeholder="3001234567"
                value={profileData.telefono}
                onChange={(e) => setProfileData((p) => ({ ...p, telefono: e.target.value }))}
                id="profile-telefono"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={isUpdatingProfile || !profileData.nombres || !profileData.apellidos}
                id="btn-save-profile"
              >
                {isUpdatingProfile ? 'Guardando…' : <><Save size={16} /> Guardar Cambios</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Formulario: Cambiar contraseña ── */}
      <div className="profile-card">
        <h2 className="profile-card-title">
          <Lock size={18} style={{ color: 'var(--accent-h)' }} />
          Cambiar contraseña
        </h2>

        {passwordMsg && (
          <div
            className="security-alert"
            style={
              passwordMsg.type === 'success'
                ? { background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.25)', marginBottom: '1rem' }
                : { background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', marginBottom: '1rem' }
            }
          >
            {passwordMsg.type === 'success' ? (
              <ShieldCheck size={16} style={{ color: '#34d399', flexShrink: 0 }} />
            ) : (
              <AlertCircle size={16} style={{ color: '#f87171', flexShrink: 0 }} />
            )}
            <p style={{ color: passwordMsg.type === 'success' ? '#6ee7b7' : '#fca5a5' }}>
              {passwordMsg.text}
            </p>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="profile-form">
          {/* Contraseña actual */}
          <div className="form-group">
            <label className="form-label">Contraseña actual *</label>
            <div className="password-input-wrapper">
              <input
                type={showPasswords.actual ? 'text' : 'password'}
                className="form-input with-toggle"
                required
                placeholder="Tu contraseña actual"
                value={passwordData.passwordActual}
                onChange={(e) => setPasswordData((p) => ({ ...p, passwordActual: e.target.value }))}
                autoComplete="current-password"
                id="password-actual"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPasswords((p) => ({ ...p, actual: !p.actual }))}
              >
                {showPasswords.actual ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Nueva contraseña */}
          <div className="form-group">
            <label className="form-label">Nueva contraseña *</label>
            <div className="password-input-wrapper">
              <input
                type={showPasswords.nueva ? 'text' : 'password'}
                className="form-input with-toggle"
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                value={passwordData.passwordNuevo}
                onChange={(e) => setPasswordData((p) => ({ ...p, passwordNuevo: e.target.value }))}
                autoComplete="new-password"
                id="password-nueva"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPasswords((p) => ({ ...p, nueva: !p.nueva }))}
              >
                {showPasswords.nueva ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordData.passwordNuevo && (
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

          {/* Confirmar nueva contraseña */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Confirmar nueva contraseña *</label>
            <div className="password-input-wrapper">
              <input
                type={showPasswords.confirmacion ? 'text' : 'password'}
                className="form-input with-toggle"
                required
                placeholder="Repite la nueva contraseña"
                style={{
                  borderColor:
                    passwordData.passwordNuevoConfirmacion && !passwordsMatch
                      ? 'rgba(239,68,68,0.5)'
                      : passwordsMatch
                      ? 'rgba(16,185,129,0.5)'
                      : undefined,
                }}
                value={passwordData.passwordNuevoConfirmacion}
                onChange={(e) => setPasswordData((p) => ({ ...p, passwordNuevoConfirmacion: e.target.value }))}
                autoComplete="new-password"
                id="password-confirmacion"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPasswords((p) => ({ ...p, confirmacion: !p.confirmacion }))}
              >
                {showPasswords.confirmacion ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordData.passwordNuevoConfirmacion && !passwordsMatch && (
              <p style={{ color: '#f87171', fontSize: '0.78rem', marginTop: '0.35rem' }}>
                Las contraseñas no coinciden
              </p>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={
                isChangingPassword ||
                !passwordData.passwordActual ||
                passwordData.passwordNuevo.length < 8 ||
                !passwordsMatch
              }
              id="btn-change-password"
            >
              {isChangingPassword ? 'Actualizando…' : <><Lock size={16} /> Cambiar Contraseña</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
