import { useState, useEffect } from 'react';
import { X, Download, Link as LinkIcon, Copy, Check } from 'lucide-react';
import { useCreateReportLink } from '../api/reports.js';
import { apiClient } from '../../../shared/api/client.js';

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioId: string;
  portfolioName: string;
}

type ReportFormat = 'excel' | 'pdf' | 'link';
type PeriodType = 'mes_actual' | 'mensual' | 'bimestral' | 'trimestral' | 'custom';

export function GenerateReportModal({ isOpen, onClose, portfolioId, portfolioName }: GenerateReportModalProps) {
  const createLinkMutation = useCreateReportLink();
  const [format, setFormat] = useState<ReportFormat>('excel');
  const [period, setPeriod] = useState<PeriodType>('mensual');
  
  // Dates
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [title, setTitle] = useState('Reporte de Seguimiento');
  
  // Link generation result
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-calculate dates based on period selection
  useEffect(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    if (period === 'mes_actual') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      // Adjust timezone offset
      const firstDayStr = new Date(firstDay.getTime() - firstDay.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      setStartDate(firstDayStr);
      setEndDate(todayStr);
    } else if (period === 'mensual') {
      const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const pastStr = new Date(past.getTime() - past.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      setStartDate(pastStr);
      setEndDate(todayStr);
    } else if (period === 'bimestral') {
      const past = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const pastStr = new Date(past.getTime() - past.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      setStartDate(pastStr);
      setEndDate(todayStr);
    } else if (period === 'trimestral') {
      const past = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const pastStr = new Date(past.getTime() - past.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      setStartDate(pastStr);
      setEndDate(todayStr);
    }
  }, [period]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsProcessing(true);
    try {
      const queryParams = new URLSearchParams({
        startDate,
        endDate,
        title
      }).toString();
      
      const endpoint = `/reports/portfolios/${portfolioId}/${format}?${queryParams}`;
      const blob = await apiClient.getBlob(endpoint);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${format === 'excel' ? 'cartera.xlsx' : 'cartera.pdf'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      onClose();
    } catch (error: any) {
      alert('Error al descargar el reporte: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateLink = async () => {
    setIsProcessing(true);
    try {
      const res = await createLinkMutation.mutateAsync({
        portfolioId,
        data: {
          startDate,
          endDate,
          title,
          expiresInDays: 30
        }
      });
      const link = `${window.location.origin}/public/reports/${res.token}`;
      setGeneratedLink(link);
    } catch (error: any) {
      alert('Error al generar enlace: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = async () => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('No se pudo copiar el enlace');
    }
  };

  const resetState = () => {
    setGeneratedLink(null);
    setFormat('excel');
    setPeriod('mensual');
    setTitle('Reporte de Seguimiento');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Generar Reporte de Cartera</h2>
          <button className="icon-btn" onClick={resetState} disabled={isProcessing}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-3)', marginBottom: '1.25rem' }}>
            Genera un reporte detallado con las obligaciones y el seguimiento completo de bitácora de la cartera <strong>{portfolioName}</strong>.
          </p>

          {/* Formato */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Formato del Reporte *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                className={`form-input ${format === 'excel' ? 'btn-primary' : ''}`}
                style={{ padding: '0.5rem', textAlign: 'center', cursor: 'pointer', background: format === 'excel' ? 'var(--accent)' : 'transparent', color: format === 'excel' ? '#000' : 'var(--text)' }}
                onClick={() => { setFormat('excel'); setGeneratedLink(null); }}
              >
                📊 Excel
              </button>
              <button
                type="button"
                className={`form-input ${format === 'pdf' ? 'btn-primary' : ''}`}
                style={{ padding: '0.5rem', textAlign: 'center', cursor: 'pointer', background: format === 'pdf' ? 'var(--accent)' : 'transparent', color: format === 'pdf' ? '#000' : 'var(--text)' }}
                onClick={() => { setFormat('pdf'); setGeneratedLink(null); }}
              >
                📄 PDF
              </button>
              <button
                type="button"
                className={`form-input ${format === 'link' ? 'btn-primary' : ''}`}
                style={{ padding: '0.5rem', textAlign: 'center', cursor: 'pointer', background: format === 'link' ? 'var(--accent)' : 'transparent', color: format === 'link' ? '#000' : 'var(--text)' }}
                onClick={() => { setFormat('link'); setGeneratedLink(null); }}
              >
                🔗 Compartir Link
              </button>
            </div>
          </div>

          {/* Rango de Fechas / Período */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Período de Información *</label>
            <select
              className="form-input"
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodType)}
            >
              <option value="mes_actual">Mes Actual</option>
              <option value="mensual">Últimos 30 días</option>
              <option value="bimestral">Bimestral (Últimos 60 días)</option>
              <option value="trimestral">Trimestral (Últimos 90 días)</option>
              <option value="custom">Personalizado (Rango específico)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Fecha Inicio *</label>
              <input
                type="date"
                className="form-input"
                required
                disabled={period !== 'custom'}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha Fin *</label>
              <input
                type="date"
                className="form-input"
                required
                disabled={period !== 'custom'}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Título del Reporte</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Reporte Mensual"
            />
          </div>

          {/* Generación de Link Resultado */}
          {format === 'link' && generatedLink && (
            <div
              style={{
                background: 'var(--surface-2, rgba(255,255,255,0.04))',
                border: '1px dashed var(--accent)',
                borderRadius: '8px',
                padding: '1rem',
                marginTop: '1rem'
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                ¡Enlace generado! (Expirará en 30 días)
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  readOnly
                  value={generatedLink}
                  style={{ flex: 1, fontSize: '0.8rem' }}
                />
                <button
                  type="button"
                  className="btn-primary"
                  onClick={copyToClipboard}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', height: '38px' }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-4)', marginTop: '0.5rem', lineHeight: '1.4' }}>
                ⚠️ Cualquier persona con este enlace podrá ver los seguimientos y obligaciones correspondientes al período seleccionado, de manera segura y sin iniciar sesión.
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={resetState} disabled={isProcessing}>
            Cancelar
          </button>
          
          {format === 'link' ? (
            !generatedLink && (
              <button
                type="button"
                className="btn-primary"
                onClick={handleCreateLink}
                disabled={isProcessing || !startDate || !endDate}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <LinkIcon size={16} />
                {isProcessing ? 'Generando...' : 'Generar Enlace'}
              </button>
            )
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={handleDownload}
              disabled={isProcessing || !startDate || !endDate}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Download size={16} />
              {isProcessing ? 'Procesando...' : `Descargar ${format.toUpperCase()}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
