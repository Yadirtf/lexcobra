import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { Briefcase, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import './Dashboard.css';

const barData = [
  { name: 'Ene', proyectado: 4000, real: 2400 },
  { name: 'Feb', proyectado: 3000, real: 1398 },
  { name: 'Mar', proyectado: 2000, real: 9800 },
  { name: 'Abr', proyectado: 2780, real: 3908 },
  { name: 'May', proyectado: 1890, real: 4800 },
  { name: 'Jun', proyectado: 2390, real: 3800 },
];

export function DashboardPage() {
  return (
    <div className="dashboard-grid">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Resumen General</h1>
        <p className="dashboard-subtitle">Métricas y estado de recuperación de cartera</p>
      </div>

      {/* KPIs */}
      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">Procesos Activos</span>
          <div className="kpi-icon blue"><Briefcase size={20} /></div>
        </div>
        <div className="kpi-value">1,248</div>
        <div className="kpi-trend up">
          <TrendingUp size={16} />
          <span>+12.5%</span>
          <span className="kpi-trend-text">vs mes anterior</span>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">Capital Recuperado</span>
          <div className="kpi-icon green"><CheckCircle2 size={20} /></div>
        </div>
        <div className="kpi-value">$428M</div>
        <div className="kpi-trend up">
          <TrendingUp size={16} />
          <span>+8.2%</span>
          <span className="kpi-trend-text">vs mes anterior</span>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">Obligaciones en Mora</span>
          <div className="kpi-icon orange"><AlertCircle size={20} /></div>
        </div>
        <div className="kpi-value">342</div>
        <div className="kpi-trend down">
          <TrendingUp size={16} style={{ transform: 'rotate(180deg)' }} />
          <span>-4.1%</span>
          <span className="kpi-trend-text">vs mes anterior</span>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-header">
          <span className="kpi-title">Efectividad Total</span>
          <div className="kpi-icon purple"><TrendingUp size={20} /></div>
        </div>
        <div className="kpi-value">68.4%</div>
        <div className="kpi-trend up">
          <TrendingUp size={16} />
          <span>+2.4%</span>
          <span className="kpi-trend-text">vs mes anterior</span>
        </div>
      </div>

      {/* Charts */}
      <div className="chart-card">
        <h3 className="card-title">Recaudo: Proyectado vs Real (Millones)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis dataKey="name" stroke="var(--text-4)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--text-4)" fontSize={12} tickLine={false} axisLine={false} />
            <RechartsTooltip 
              contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}
              itemStyle={{ color: 'var(--text)' }}
            />
            <Bar dataKey="proyectado" fill="var(--bg)" stroke="var(--border)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="real" fill="var(--accent-h)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="activity-card">
        <h3 className="card-title">Actividad Reciente</h3>
        <div className="activity-list">
          {[
            { id: 1, action: 'Cambio de estado', detail: 'Obligación #4829 a PERSUASIVO', time: 'Hace 2 horas', color: '#0ea5e9' },
            { id: 2, action: 'Nuevo abono', detail: '$2.5M en proceso #1992', time: 'Hace 4 horas', color: '#22c55e' },
            { id: 3, action: 'Medida Cautelar', detail: 'Aprobado secuestro en #3011', time: 'Hace 5 horas', color: '#a855f7' },
            { id: 4, action: 'Demanda radicada', detail: 'Proceso #5921 radicado en Juzgado 3', time: 'Ayer', color: '#f97316' },
            { id: 5, action: 'Reporte generado', detail: 'Cartera FOGADE - Q2', time: 'Ayer', color: 'var(--text-3)' },
          ].map(activity => (
            <div key={activity.id} className="activity-item">
              <div className="activity-bullet" style={{ backgroundColor: activity.color }}></div>
              <div className="activity-content">
                <span className="activity-text">
                  <strong>{activity.action}:</strong> {activity.detail}
                </span>
                <span className="activity-time">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
