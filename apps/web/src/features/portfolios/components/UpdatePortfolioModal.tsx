import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useUpdatePortfolio, Portfolio } from '../api/portfolios.js';

interface UpdatePortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolio: Portfolio | null;
}

export function UpdatePortfolioModal({ isOpen, onClose, portfolio }: UpdatePortfolioModalProps) {
  const { mutateAsync: updatePortfolio, isPending } = useUpdatePortfolio();
  
  const [formData, setFormData] = useState({
    nombreEntidad: '',
    nit: '',
    representante: '',
    telefono: '',
    correo: '',
    logoUrl: '',
    observaciones: '',
    activo: true,
  });

  useEffect(() => {
    if (portfolio) {
      setFormData({
        nombreEntidad: portfolio.nombreEntidad || '',
        nit: portfolio.nit || '',
        representante: portfolio.representante || '',
        telefono: portfolio.telefono || '',
        correo: portfolio.correo || '',
        logoUrl: portfolio.logoUrl || '',
        observaciones: portfolio.observaciones || '',
        activo: portfolio.activo,
      });
    }
  }, [portfolio]);

  if (!isOpen || !portfolio) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePortfolio({
        id: portfolio.id,
        data: {
          ...formData,
          correo: formData.correo || undefined,
          nit: formData.nit || undefined,
          telefono: formData.telefono || undefined,
          representante: formData.representante || undefined,
          logoUrl: formData.logoUrl || undefined,
          observaciones: formData.observaciones || undefined,
        }
      });
      onClose();
    } catch (error) {
      alert('Error al actualizar cartera');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Editar Cartera</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Nombre de la Entidad / Cartera *</label>
            <input 
              type="text" 
              className="form-input" 
              required
              value={formData.nombreEntidad}
              onChange={(e) => setFormData({...formData, nombreEntidad: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label className="form-label">NIT / Documento</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.nit}
              onChange={(e) => setFormData({...formData, nit: e.target.value})}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Representante Legal</label>
            <input 
              type="text" 
              className="form-input"
              value={formData.representante}
              onChange={(e) => setFormData({...formData, representante: e.target.value})} 
            />
          </div>

          <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Teléfono</label>
              <input 
                type="text" 
                className="form-input"
                value={formData.telefono}
                onChange={(e) => setFormData({...formData, telefono: e.target.value})} 
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">Correo Electrónico</label>
              <input 
                type="email" 
                className="form-input"
                value={formData.correo}
                onChange={(e) => setFormData({...formData, correo: e.target.value})} 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">URL del Logo (Opcional)</label>
            <input 
              type="url" 
              className="form-input" 
              value={formData.logoUrl}
              onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
              placeholder="https://ejemplo.com/logo.png"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Observaciones</label>
            <textarea 
              className="form-input" 
              value={formData.observaciones}
              onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
              rows={3}
            />
          </div>

          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={isPending || !formData.nombreEntidad}>
              {isPending ? 'Guardando...' : <><Save size={16} /> Guardar Cambios</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
