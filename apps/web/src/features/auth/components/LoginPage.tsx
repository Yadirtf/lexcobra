// ═══════════════════════════════════════════════════════════════
//  LexCobra — Login Page Component
//  Diseño: Panel izquierdo (branding) + Panel derecho (formulario)
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import './LoginPage.css';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginPageProps {
  onLogin: (data: LoginFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function LoginPage({ onLogin, isLoading = false, error }: LoginPageProps) {
  const [formData, setFormData] = useState<LoginFormData>({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<LoginFormData>>({});

  const validate = (): boolean => {
    const errors: Partial<LoginFormData> = {};
    if (!formData.email) {
      errors.email = 'El correo es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Ingrese un correo válido';
    }
    if (!formData.password) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      errors.password = 'Mínimo 6 caracteres';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onLogin(formData);
  };

  const handleChange = (field: keyof LoginFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="login-root">
      {/* ── Panel izquierdo: Branding ── */}
      <div className="login-left">
        {/* Logo */}
        <div className="login-brand">
          <div className="login-brand-icon">LC</div>
          <div className="login-brand-text">
            <div className="name">LexCobra</div>
            <div className="tagline">Gestión Jurídica · Cobranza</div>
          </div>
        </div>

        {/* Hero */}
        <div className="login-hero">
          <div className="login-hero-eyebrow">
            <svg viewBox="0 0 24 24" fill="none" style={{ width: 12, height: 12 }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Plataforma SaaS · Multi-tenant
          </div>
          <h1>
            Gestión jurídica<br />
            de <span>cobranza precisa</span>
          </h1>
          <p>
            Administre carteras, obligaciones y procesos judiciales con
            la precisión y confianza que su entidad merece.
          </p>
        </div>

        {/* Features */}
        <div className="login-features">
          {FEATURES.map((f) => (
            <div key={f.label} className="login-feature-item">
              <div className="login-feature-icon">{f.icon}</div>
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Panel derecho: Formulario ── */}
      <div className="login-right">
        <div className="login-form-container">
          <div className="login-form-header">
            <h2 className="login-form-title">Iniciar sesión</h2>
            <p className="login-form-subtitle">
              Ingrese sus credenciales para acceder al sistema
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            {/* Error global */}
            {error && (
              <div className="login-error" role="alert">
                <svg viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16, flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                  <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  <circle cx="12" cy="16" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                {error}
              </div>
            )}

            {/* Email */}
            <div className="form-group">
              <label htmlFor="login-email">Correo electrónico</label>
              <div className="login-input-wrap">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                    stroke="currentColor" strokeWidth="1.8"/>
                  <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                <input
                  id="login-email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  placeholder="usuario@empresa.lexcobra.app"
                  autoComplete="email"
                  className={fieldErrors.email ? 'error' : ''}
                  disabled={isLoading}
                />
              </div>
              {fieldErrors.email && (
                <span className="field-error">
                  <svg viewBox="0 0 24 24" fill="none" style={{ width: 12, height: 12 }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  {fieldErrors.email}
                </span>
              )}
            </div>

            {/* Contraseña */}
            <div className="form-group">
              <label htmlFor="login-password">Contraseña</label>
              <div className="login-input-wrap">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange('password')}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={fieldErrors.password ? 'error' : ''}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="toggle-pwd"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {fieldErrors.password && (
                <span className="field-error">
                  <svg viewBox="0 0 24 24" fill="none" style={{ width: 12, height: 12 }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  {fieldErrors.password}
                </span>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="login-submit"
              disabled={isLoading}
              id="btn-login-submit"
            >
              {isLoading ? (
                <>
                  <span className="spinner" />
                  Verificando…
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16 }}>
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Ingresar al sistema
                </>
              )}
            </button>
          </form>

          <div className="login-form-footer">
            ¿Problemas para acceder?{' '}
            <a href="mailto:soporte@lexcobra.app">Contacte soporte</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Features list ──────────────────────────────────────────────
const FEATURES = [
  { icon: '📁', label: 'Gestión completa de carteras y obligaciones' },
  { icon: '⚖️', label: 'Seguimiento del proceso jurídico en tiempo real' },
  { icon: '📊', label: 'Reportes exportables en Excel y PDF' },
  { icon: '🔗', label: 'Compartir reportes con enlace seguro' },
  { icon: '🔒', label: 'Acceso por roles: Legal, Empleado, Visualizador' },
];

// ── Icons ──────────────────────────────────────────────────────
function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}
