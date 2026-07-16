import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useCreatePortfolio } from '../api/portfolios.js';

interface CreatePortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePortfolioModal({ isOpen, onClose }: CreatePortfolioModalProps) {
  const { mutateAsync: createPortfolio, isPending } = useCreatePortfolio();
  
  const [formData, setFormData] = useState({
    nombreEntidad: '',
    nit: '',
    representante: '',
    telefono: '',
    correo: '',
    logoUrl: '',
    observaciones: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPortfolio({
        ...formData
      });
      onClose();
      setFormData({ nombreEntidad: '', nit: '', representante: '', telefono: '', correo: '', logoUrl: '', observaciones: '' });
    } catch (error) {
      alert('Error al crear cartera');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Nueva Cartera</h2>
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
              {isPending ? 'Guardando...' : <><Save size={16} /> Crear Cartera</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
