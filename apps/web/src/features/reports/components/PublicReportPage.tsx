import { useState, useEffect } from 'react';
import { useParams } from '@tanstack/react-router';
import { usePublicReport } from '../api/reports.js';
import {
  AlertCircle, Printer, TrendingUp, TrendingDown,
  FileText, DollarSign, CheckCircle2, BarChart3, Activity,
  Building2, Calendar, Shield, Sun, Moon
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

// ─── Theme token factory ───────────────────────────────────────────────────────
const makeTokens = (isDark: boolean) => ({
  bg:          isDark ? '#080e1a'  : '#f1f5f9',
  bgApp:       isDark ? '#0a0f1e'  : '#f8fafc',
  surface:     isDark ? '#0d1526'  : '#ffffff',
  surface2:    isDark ? '#111d33'  : '#f8fafc',
  surface3:    isDark ? '#172240'  : '#f1f5f9',
  border:      isDark ? '#1e3050'  : '#e2e8f0',
  border2:     isDark ? '#243760'  : '#cbd5e1',
  text:        isDark ? '#e2e8f0'  : '#0f172a',
  text2:       isDark ? '#94a3b8'  : '#334155',
  text3:       isDark ? '#64748b'  : '#475569',
  text4:       isDark ? '#3f526b'  : '#64748b',
  // Header stays dark-navy in both modes for brand consistency
  headerBg:    'linear-gradient(135deg, #0f1f44 0%, #0a1628 40%, #0f172a 100%)',
  headerBorder:'#1e3a5f',
  // Tooltip: always dark for legibility regardless of theme
  tooltipBg:   '#1e293b',
  tooltipBorder:'#334155',
  tooltipText: '#f8fafc',
  // Chart grid
  chartGrid:   isDark ? '#1e293b'  : '#e2e8f0',
  // Card hover glow
  cardShadow:  isDark
    ? '0 8px 32px rgba(0,0,0,0.5)'
    : '0 8px 32px rgba(15,23,42,0.1)',
  // Timeline node border
  nodeBorder:  isDark ? '#0f172a'  : '#ffffff',
  // Spinner in hero (stays on dark header)
  spinnerBorder: '#3b82f630',
  spinnerTop:    '#3b82f6',
});

// Accessible chart colors that look good on both dark and light surfaces
const CHART_COLORS = [
  '#2563eb', '#16a34a', '#d97706', '#dc2626',
  '#7c3aed', '#0284c7', '#db2777', '#65a30d', '#ea580c'
];

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmtCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

const fmtShortCOP = (n: number): string => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(0)}K`;
  return fmtCOP(n);
};

// ─── Summary computation ──────────────────────────────────────────────────────
function computeSummary(obligations: any[]) {
  const totalCapital = obligations.reduce(
    (s, o) => s + Number(o.saldoCapitalDemandado || 0), 0
  );
  const totalRecaudos = obligations.reduce(
    (s, o) => s + (o.recaudos || []).reduce((rs: number, r: any) => rs + Number(r.monto || 0), 0), 0
  );
  const pct = totalCapital > 0 ? (totalRecaudos / totalCapital) * 100 : 0;

  const obligacionesConActividad = obligations.filter(o =>
    (o.bitacora?.length || 0) + (o.recaudos?.length || 0) +
    (o.notificaciones?.length || 0) + (o.historialEstados?.length || 0) > 0
  ).length;

  const estadosMap: Record<string, { count: number; color: string }> = {};
  obligations.forEach(o => {
    const nombre = o.estadoObligacion?.nombre || 'Sin Estado';
    const color  = o.estadoObligacion?.color  || '#64748b';
    if (!estadosMap[nombre]) estadosMap[nombre] = { count: 0, color };
    estadosMap[nombre].count++;
  });
  const estadosData = Object.entries(estadosMap)
    .map(([name, d], i) => ({ name, value: d.count, color: d.color || CHART_COLORS[i % CHART_COLORS.length] }))
    .sort((a, b) => b.value - a.value);

  const nivelesMap: Record<string, number> = {};
  obligations.forEach(o => {
    const n = o.nivelRecuperacion?.nombre || 'Sin Nivel';
    nivelesMap[n] = (nivelesMap[n] || 0) + 1;
  });
  const nivelesData = Object.entries(nivelesMap)
    .map(([name, value], i) => ({ name, value, color: CHART_COLORS[i % CHART_COLORS.length] }))
    .sort((a, b) => b.value - a.value);

  const remaining = Math.max(totalCapital - totalRecaudos, 0);
  const donutData = [
    { name: 'Recaudado en Período', value: totalRecaudos, color: '#16a34a' },
    { name: 'Capital Pendiente',    value: remaining,     color: '#94a3b8' },
  ];

  return { totalCapital, totalRecaudos, pct, obligacionesConActividad, estadosData, nivelesData, donutData };
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  icon, label, value, sub, color, T
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
  T: ReturnType<typeof makeTokens>;
}) {
  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: '16px',
      padding: '1.25rem 1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: T.cardShadow,
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}>
      {/* Color top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '16px 16px 0 0' }} />
      <div style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 40, height: 40, borderRadius: '10px',
        background: `${color}18`, color,
      }}>
        {icon}
      </div>
      <div>
        <span style={{ display: 'block', fontSize: '0.7rem', color: T.text3, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <strong style={{ display: 'block', fontSize: '1.5rem', color: T.text, fontWeight: 800, marginTop: '0.1rem', lineHeight: 1.2 }}>
          {value}
        </strong>
        {sub && (
          <span style={{ display: 'block', fontSize: '0.73rem', color, marginTop: '0.25rem', fontWeight: 600 }}>
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Chart Panel ──────────────────────────────────────────────────────────────
function ChartPanel({ title, children, T }: { title: string; children: React.ReactNode; T: ReturnType<typeof makeTokens> }) {
  return (
    <div style={{
      background: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: '16px',
      padding: '1.5rem',
      boxShadow: T.cardShadow,
    }}>
      <h3 style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

// ─── Horizontal stat bar ──────────────────────────────────────────────────────
function StatBar({ label, value, max, color, T }: { label: string; value: number; max: number; color: string; T: ReturnType<typeof makeTokens> }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ marginBottom: '0.85rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
        <span style={{ fontSize: '0.8rem', color: T.text2, maxWidth: '68%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </span>
        <span style={{
          fontSize: '0.78rem', color, fontWeight: 700,
          background: `${color}15`, padding: '0.1rem 0.5rem',
          borderRadius: '999px', border: `1px solid ${color}30`,
        }}>
          {value}
        </span>
      </div>
      <div style={{ height: 7, background: T.border, borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 999,
          background: `linear-gradient(90deg, ${color}, ${color}bb)`,
          transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  );
}

// ─── Recharts custom tooltip ──────────────────────────────────────────────────
// Always rendered in dark for maximum legibility on both themes
const ChartTooltip = ({ active, payload, label, formatter }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1e293b', border: '1px solid #334155',
      borderRadius: 10, padding: '0.6rem 0.9rem', fontSize: '0.82rem',
      color: '#f8fafc', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      pointerEvents: 'none',
    }}>
      {label && <p style={{ color: '#94a3b8', marginBottom: '0.3rem', fontSize: '0.75rem' }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: p.color || p.fill }} />
          <span style={{ color: '#cbd5e1' }}>{p.name}:</span>
          <strong style={{ color: '#f8fafc' }}>{formatter ? formatter(p.value) : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const THEME_KEY = 'lexcobra-report-theme';

export function PublicReportPage() {
  const { token } = useParams({ strict: false }) as { token: string };
  const { data: report, isLoading, error } = usePublicReport(token);

  // Independent theme for public page — defaults to 'light'
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark';
    } catch {
      return false;
    }
  });

  const [isDownloading, setIsDownloading] = useState(false);

  const toggleTheme = () => {
    setIsDark(prev => {
      const next = !prev;
      try { localStorage.setItem(THEME_KEY, next ? 'dark' : 'light'); } catch { /* noop */ }
      return next;
    });
  };

  // Apply data-theme so the body + CSS vars follow the report page theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    return () => {
      // Restore when leaving the page
      try {
        const appTheme = localStorage.getItem('lexcobra-theme');
        if (appTheme) {
          const parsed = JSON.parse(appTheme);
          document.documentElement.setAttribute('data-theme', parsed?.state?.theme ?? 'dark');
        }
      } catch { /* noop */ }
    };
  }, [isDark]);

  const downloadPdf = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const BASE_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:3001/api';
      const response = await fetch(`${BASE_URL}/reports/public/${token}/pdf`, { method: 'GET' });
      if (!response.ok) throw new Error('No se pudo generar el PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_cartera.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Error al descargar el PDF: ' + (err.message ?? 'Error desconocido'));
    } finally {
      setIsDownloading(false);
    }
  };

  const T = makeTokens(isDark);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: T.bgApp, color: T.text, gap: '1rem', transition: 'background 0.3s' }}>
        <div style={{ width: 44, height: 44, border: `3px solid ${T.border}`, borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: T.text3, fontSize: '0.9rem' }}>Cargando reporte de cartera…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: T.bgApp, color: T.text, padding: '2rem', textAlign: 'center' }}>
        <AlertCircle size={52} color="#dc2626" style={{ marginBottom: '1rem' }} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Reporte No Disponible</h1>
        <p style={{ color: T.text3, maxWidth: '400px' }}>
          El enlace de este reporte es inválido, ha expirado o fue desactivado por la entidad emisora.
        </p>
      </div>
    );
  }

  const s = computeSummary(report.obligations);
  const periodLabel = `${new Date(report.startDate + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })} — ${new Date(report.endDate + 'T12:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}`;

  return (
    <div style={{ minHeight: '100vh', background: T.bgApp, color: T.text, fontFamily: 'Inter, system-ui, sans-serif', transition: 'background 0.3s, color 0.3s' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .rpt-kpi:hover { transform: translateY(-3px) !important; }
        .rpt-obs:hover { border-color: #2563eb60 !important; }
        @media print { .no-print { display: none !important; } }
      `}</style>

      {/* ── HERO HEADER (always dark navy) ──────────────────────────────────── */}
      <header style={{
        background: T.headerBg,
        borderBottom: `1px solid ${T.headerBorder}`,
        padding: '2rem 2rem 1.75rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -60, right: -40, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>

            {/* LEFT: Titles */}
            <div style={{ animation: 'fadeUp 0.45s ease both' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.35)', borderRadius: '999px', padding: '0.3rem 0.9rem', marginBottom: '0.9rem' }}>
                <Building2 size={13} color="#93c5fd" />
                <span style={{ fontSize: '0.73rem', color: '#93c5fd', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {report.clientName}
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(1.4rem, 4vw, 2.2rem)', fontWeight: 900, color: '#f8fafc', margin: 0, lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                {report.portfolioName}
              </h1>
              <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '0.4rem', fontWeight: 500 }}>
                {report.title}
                {report.nit && <span style={{ color: '#475569' }}> · NIT: {report.nit}</span>}
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '999px', padding: '0.3rem 0.85rem', marginTop: '0.85rem' }}>
                <Calendar size={13} color="#94a3b8" />
                <span style={{ fontSize: '0.77rem', color: '#94a3b8', fontWeight: 500 }}>{periodLabel}</span>
              </div>
            </div>

            {/* RIGHT: Actions */}
            <div className="no-print" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem', animation: 'fadeUp 0.45s 0.1s ease both', opacity: 0 }}>
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                  background: 'rgba(255,255,255,0.08)', color: '#e2e8f0',
                  border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px',
                  padding: '0.5rem 0.9rem', fontSize: '0.8rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'background 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.14)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
              >
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
                {isDark ? 'Modo Claro' : 'Modo Oscuro'}
              </button>

              {/* Download PDF */}
              <button
                onClick={downloadPdf}
                disabled={isDownloading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: isDownloading ? 'rgba(37,99,235,0.2)' : '#2563eb',
                  color: '#fff',
                  border: 'none', borderRadius: '10px',
                  padding: '0.55rem 1.1rem', fontSize: '0.85rem', fontWeight: 700,
                  cursor: isDownloading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s', opacity: isDownloading ? 0.75 : 1,
                  boxShadow: isDownloading ? 'none' : '0 4px 12px rgba(37,99,235,0.4)',
                }}
                onMouseEnter={e => { if (!isDownloading) (e.currentTarget as HTMLButtonElement).style.background = '#1d4ed8'; }}
                onMouseLeave={e => { if (!isDownloading) (e.currentTarget as HTMLButtonElement).style.background = '#2563eb'; }}
              >
                {isDownloading
                  ? <><span style={{ width: 15, height: 15, border: '2px solid #93c5fd', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Generando…</>
                  : <><Printer size={15} /> Descargar PDF</>}
              </button>

              {/* Verified badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.3)', borderRadius: '999px', padding: '0.22rem 0.7rem' }}>
                <Shield size={12} color="#4ade80" />
                <span style={{ fontSize: '0.68rem', color: '#4ade80', fontWeight: 600 }}>Reporte Verificado</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 2rem' }}>

        {/* Section label */}
        <div style={{ marginBottom: '1.5rem', animation: 'fadeUp 0.45s 0.12s ease both', opacity: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 4, height: 22, background: 'linear-gradient(180deg, #2563eb, #16a34a)', borderRadius: 2 }} />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: T.text, margin: 0 }}>Resumen Ejecutivo</h2>
          </div>
          <p style={{ color: T.text3, fontSize: '0.8rem', marginTop: '0.35rem', marginLeft: '1.2rem' }}>
            Métricas consolidadas · Período: {periodLabel}
          </p>
        </div>

        {/* ── KPI CARDS ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.75rem', animation: 'fadeUp 0.45s 0.18s ease both', opacity: 0 }}>
          {[
            {
              icon: <FileText size={19} />,
              label: 'Total Obligaciones',
              value: String(report.obligations.length),
              sub: `${s.obligacionesConActividad} con actividad en período`,
              color: '#2563eb',
            },
            {
              icon: <DollarSign size={19} />,
              label: 'Capital Total Demandado',
              value: fmtShortCOP(s.totalCapital),
              sub: fmtCOP(s.totalCapital),
              color: '#7c3aed',
            },
            {
              icon: <CheckCircle2 size={19} />,
              label: 'Recaudado en Período',
              value: fmtShortCOP(s.totalRecaudos),
              sub: fmtCOP(s.totalRecaudos),
              color: '#16a34a',
            },
            {
              icon: s.pct >= 20 ? <TrendingUp size={19} /> : <TrendingDown size={19} />,
              label: '% Recuperación Período',
              value: `${s.pct.toFixed(1)}%`,
              sub: s.pct >= 20 ? 'Recuperación saludable' : 'Meta: incrementar recaudo',
              color: s.pct >= 20 ? '#16a34a' : '#d97706',
            },
          ].map((kpi) => (
            <div key={kpi.label} className="rpt-kpi" style={{ transition: 'transform 0.2s' }}>
              <KpiCard {...kpi} T={T} />
            </div>
          ))}
        </div>

        {/* ── CHARTS ────────────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginBottom: '2.25rem', animation: 'fadeUp 0.45s 0.25s ease both', opacity: 0 }}>

          {/* Donut — Capital vs Recaudado */}
          <ChartPanel title="Capital vs Recaudado en Período" T={T}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ width: 170, height: 170, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={s.donutData}
                      cx="50%" cy="50%"
                      innerRadius={54} outerRadius={78}
                      paddingAngle={3} dataKey="value"
                      startAngle={90} endAngle={-270}
                    >
                      {s.donutData.map((e, i) => <Cell key={i} fill={e.color} stroke="transparent" />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip formatter={fmtCOP} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, minWidth: 140 }}>
                {s.donutData.map((item, i) => (
                  <div key={i} style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.77rem', color: T.text3 }}>{item.name}</span>
                    </div>
                    <span style={{ fontSize: '0.98rem', fontWeight: 800, color: T.text, marginLeft: '1.1rem' }}>
                      {fmtShortCOP(item.value)}
                    </span>
                  </div>
                ))}
                <div style={{ height: 1, background: T.border, margin: '0.75rem 0' }} />
                <span style={{ fontSize: '0.75rem', color: T.text3 }}>
                  Tasa de recuperación:{' '}
                  <strong style={{ color: s.pct >= 20 ? '#16a34a' : '#d97706' }}>{s.pct.toFixed(2)}%</strong>
                </span>
              </div>
            </div>
          </ChartPanel>

          {/* Bar chart — Estados */}
          <ChartPanel title="Distribución por Estado de Obligación" T={T}>
            {s.estadosData.length > 0 ? (
              <div>
                {s.estadosData.map(item => (
                  <StatBar
                    key={item.name}
                    label={item.name}
                    value={item.value}
                    max={s.estadosData[0].value}
                    color={item.color}
                    T={T}
                  />
                ))}
              </div>
            ) : (
              <p style={{ color: T.text3, fontSize: '0.85rem', fontStyle: 'italic' }}>Sin datos de estado</p>
            )}
          </ChartPanel>

          {/* Recharts bar — Niveles de recuperación */}
          {s.nivelesData.length > 0 && (
            <ChartPanel title="Distribución por Nivel de Recuperación" T={T}>
              <div style={{ height: 190 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={s.nivelesData} layout="vertical" margin={{ left: 0, right: 28, top: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.chartGrid} horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fill: T.text3, fontSize: 11 }}
                      axisLine={false} tickLine={false} allowDecimals={false}
                    />
                    <YAxis
                      type="category" dataKey="name"
                      tick={{ fill: T.text2, fontSize: 10 }}
                      axisLine={false} tickLine={false} width={88}
                    />
                    <Tooltip
                      content={<ChartTooltip />}
                      cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
                    />
                    <Bar dataKey="value" name="Obligaciones" radius={[0, 5, 5, 0]}>
                      {s.nivelesData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartPanel>
          )}
        </div>

        {/* ── OBLIGATIONS HEADER ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', animation: 'fadeUp 0.45s 0.3s ease both', opacity: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 4, height: 22, background: 'linear-gradient(180deg, #d97706, #dc2626)', borderRadius: 2 }} />
            <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: T.text, margin: 0 }}>Detalle de Procesos y Seguimientos</h2>
          </div>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${T.border}, transparent)` }} />
          <span style={{ fontSize: '0.77rem', color: T.text3, whiteSpace: 'nowrap' }}>
            {report.obligations.length} proceso{report.obligations.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── OBLIGATIONS LIST ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {report.obligations.map((obs: any, idx: number) => {
            const debtor = obs.actores?.find((a: any) => a.rolActor?.nombreRol === 'Deudor Principal')?.persona;
            const codeudores = obs.actores
              ?.filter((a: any) => a.rolActor?.nombreRol === 'Codeudor' || a.rolActor?.nombreRol === 'Deudor Solidario')
              ?.map((a: any) => `${a.persona.nombreCompleto} (CC: ${a.persona.numeroIdentificacion})`)
              ?.join(', ') || 'Ninguno';
            const lawsuitDate = obs.fechaPresentacionDemanda
              ? new Date(obs.fechaPresentacionDemanda).toLocaleDateString('es-CO') : 'N/A';
            const paymentOrderDate = obs.mandamientoPagoFecha
              ? new Date(obs.mandamientoPagoFecha).toLocaleDateString('es-CO') : 'N/A';
            const obsRecaudos = (obs.recaudos || []).reduce((s: number, r: any) => s + Number(r.monto || 0), 0);

            return (
              <div
                key={obs.id}
                className="rpt-obs"
                style={{
                  background: T.surface,
                  borderRadius: '14px',
                  border: `1px solid ${T.border}`,
                  overflow: 'hidden',
                  boxShadow: T.cardShadow,
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  animation: `fadeUp 0.45s ${0.32 + idx * 0.04}s ease both`,
                  opacity: 0,
                }}
              >
                {/* Card Header */}
                <div style={{
                  padding: '1.1rem 1.5rem',
                  background: isDark ? 'rgba(255,255,255,0.025)' : '#f8fafc',
                  borderBottom: `1px solid ${T.border}`,
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '9px',
                      background: 'linear-gradient(135deg, #1d4ed8, #6366f1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.72rem', fontWeight: 800, color: '#fff', flexShrink: 0,
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.67rem', color: '#d97706', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.1rem' }}>
                        Proceso #{idx + 1}
                      </span>
                      <strong style={{ fontSize: '0.97rem', color: T.text }}>
                        {debtor?.nombreCompleto || 'Sin Deudor Principal'}
                      </strong>
                      <span style={{ color: T.text3, fontSize: '0.78rem', marginLeft: '0.5rem' }}>
                        CC: {debtor?.numeroIdentificacion || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                    <span style={{ background: isDark ? 'rgba(37,99,235,0.12)' : '#eff6ff', color: '#2563eb', border: '1px solid rgba(37,99,235,0.25)', fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: 600 }}>
                      Crédito: {obs.numeroCredito}
                    </span>
                    {obs.estadoObligacion && (
                      <span style={{
                        background: `${obs.estadoObligacion.color || T.border}20`,
                        color: obs.estadoObligacion.color || T.text3,
                        border: `1px solid ${obs.estadoObligacion.color || T.border}40`,
                        fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: 600,
                      }}>
                        {obs.estadoObligacion.nombre}
                      </span>
                    )}
                  </div>
                </div>

                {/* Financial row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ padding: '0.9rem 1.5rem', borderRight: `1px solid ${T.border}` }}>
                    <span style={{ display: 'block', fontSize: '0.67rem', color: T.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.15rem' }}>Capital Demandado</span>
                    <strong style={{ fontSize: '1.05rem', color: '#7c3aed', fontWeight: 800 }}>{fmtCOP(obs.saldoCapitalDemandado)}</strong>
                  </div>
                  <div style={{ padding: '0.9rem 1.5rem' }}>
                    <span style={{ display: 'block', fontSize: '0.67rem', color: T.text3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.15rem' }}>Recaudado en Período</span>
                    <strong style={{ fontSize: '1.05rem', color: '#16a34a', fontWeight: 800 }}>{fmtCOP(obsRecaudos)}</strong>
                  </div>
                </div>

                {/* Metadata */}
                <div style={{ padding: '1.1rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', borderBottom: `1px solid ${T.border}` }}>
                  {[
                    { label: 'Pagaré',                value: obs.numeroPagare || 'N/A' },
                    { label: 'Nivel Recuperación',    value: obs.nivelRecuperacion?.nombre || 'N/A' },
                    { label: 'Ubicación',             value: `${obs.departamento?.nombre || obs.municipio?.departamento?.nombre || 'N/A'} / ${obs.municipio?.nombre || 'N/A'}` },
                    { label: 'Juzgado',               value: obs.juzgado?.nombre || 'N/A' },
                    { label: 'Radicado / Expediente', value: obs.radicado || 'N/A' },
                    { label: 'Medida Cautelar',       value: obs.medidaCautelar?.nombre || 'N/A' },
                    { label: 'Fecha Demanda',         value: lawsuitDate },
                    { label: 'Mandamiento de Pago',   value: paymentOrderDate },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <span style={{ display: 'block', fontSize: '0.65rem', color: T.text4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.18rem' }}>{label}</span>
                      <span style={{ fontSize: '0.85rem', color: T.text2, lineHeight: 1.4 }}>{value}</span>
                    </div>
                  ))}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ display: 'block', fontSize: '0.65rem', color: T.text4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.18rem' }}>Codeudores</span>
                    <span style={{ fontSize: '0.85rem', color: T.text2, lineHeight: 1.5 }}>{codeudores}</span>
                  </div>
                </div>

                {/* Timeline */}
                <div style={{ padding: '1.1rem 1.5rem', background: isDark ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.02)' }}>
                  <h4 style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: '#d97706', marginBottom: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', letterSpacing: '0.08em' }}>
                    <Activity size={13} /> Historial de Gestión y Bitácora (Período)
                  </h4>
                  {!obs.timelineEvents || obs.timelineEvents.length === 0 ? (
                    <p style={{ fontSize: '0.82rem', color: T.text4, fontStyle: 'italic', margin: 0 }}>
                      No hay seguimientos registrados en el período seleccionado.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', borderLeft: `2px solid ${T.border}`, paddingLeft: '1.2rem', marginLeft: '0.4rem' }}>
                      {obs.timelineEvents.map((item: any, i: number) => {
                        const isToday = item.dateStr === new Date().toLocaleDateString('es-CO');
                        return (
                          <div key={i} style={{ position: 'relative' }}>
                            <div style={{
                              position: 'absolute', width: 9, height: 9, borderRadius: '50%',
                              background: item.color, left: -24, top: 5,
                              border: `2px solid ${T.nodeBorder}`,
                              boxShadow: `0 0 0 2px ${item.color}40`,
                            }} />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.15rem' }}>
                              <span style={{ fontSize: '0.7rem', color: T.text3, fontWeight: 600 }}>[{item.dateStr}]</span>
                              <span style={{ fontSize: '0.77rem', fontWeight: 700, color: item.color }}>{item.title}</span>
                            </div>
                            <p style={{ fontSize: '0.82rem', color: T.text2, margin: 0, lineHeight: 1.5 }}>{item.text}</p>
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

        {/* ── FOOTER ───────────────────────────────────────────────────────── */}
        <footer style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: T.text3, fontWeight: 600 }}>
              {report.clientName} · Sistema LexCobra
            </span>
            <span style={{ display: 'block', fontSize: '0.68rem', color: T.text4, marginTop: '0.15rem' }}>
              Generado el {new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.5 }}>
            <BarChart3 size={13} color={T.text4} />
            <span style={{ fontSize: '0.68rem', color: T.text4 }}>Reporte Confidencial · Uso Exclusivo del Cliente</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
