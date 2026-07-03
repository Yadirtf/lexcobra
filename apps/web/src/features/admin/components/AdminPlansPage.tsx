import { useState } from 'react';
import { Plus, X, Save, Pencil, Ban, CheckCircle } from 'lucide-react';
import { usePlans, useCreatePlan, useUpdatePlan, useTogglePlanStatus, Plan } from '../api/plans.js';

export function AdminPlansPage() {
  const { data: plans, isLoading } = usePlans();
  const { mutateAsync: createPlan, isPending: isCreating } = useCreatePlan();
  const { mutateAsync: updatePlan, isPending: isUpdating } = useUpdatePlan();
  const { mutateAsync: toggleStatus, isPending: isToggling } = useTogglePlanStatus();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    duracionMeses: '1',
    limitUsuarios: '5'
  });

  const openCreateModal = () => {
    setEditingPlanId(null);
    setFormData({ nombre: '', descripcion: '', precio: '', duracionMeses: '1', limitUsuarios: '5' });
    setIsModalOpen(true);
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlanId(plan.id);
    setFormData({
      nombre: plan.nombre,
      descripcion: plan.descripcion || '',
      precio: plan.precio.toString(),
      duracionMeses: plan.duracionMeses.toString(),
      limitUsuarios: plan.limitUsuarios.toString()
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (plan: Plan) => {
    if (!window.confirm(`¿Estás seguro de que deseas ${plan.activo ? 'suspender' : 'activar'} el plan "${plan.nombre}"?`)) return;
    try {
      await toggleStatus({ id: plan.id, activo: !plan.activo });
    } catch (err: any) {
      alert('Error al cambiar el estado: ' + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlanId) {
        await updatePlan({
          id: editingPlanId,
          data: {
            nombre: formData.nombre,
            descripcion: formData.descripcion,
            precio: parseFloat(formData.precio),
            duracionMeses: parseInt(formData.duracionMeses),
            limitUsuarios: parseInt(formData.limitUsuarios)
          }
        });
      } else {
        await createPlan({
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          precio: parseFloat(formData.precio),
          duracionMeses: parseInt(formData.duracionMeses),
          limitUsuarios: parseInt(formData.limitUsuarios)
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      alert('Error al procesar la operación');
    }
  };

  return (
    <div className="portfolios-container">
      <div className="portfolios-header">
        <h1 className="portfolios-title">Planes & Facturación</h1>
        <button className="btn-primary" onClick={openCreateModal}>
          <Plus size={18} /> Nuevo Plan
        </button>
      </div>

      {isLoading ? (
        <p>Cargando planes...</p>
      ) : (
        <div className="table-container" style={{ marginTop: '1.5rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Precio</th>
                <th>Duración (Meses)</th>
                <th>Límite de Usuarios</th>
                <th>Estado</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {plans?.map((plan) => (
                <tr key={plan.id}>
                  <td><strong>{plan.nombre}</strong><br/><small style={{ color: 'var(--text-3)' }}>{plan.descripcion}</small></td>
                  <td>${Number(plan.precio).toLocaleString()}</td>
                  <td>{plan.duracionMeses}</td>
                  <td>{plan.limitUsuarios}</td>
                  <td>
                    <span className={`status-badge ${plan.activo ? 'status-active' : 'status-inactive'}`}>
                      {plan.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button className="icon-btn" onClick={() => openEditModal(plan)} title="Editar Plan">
                        <Pencil size={18} color="var(--accent)" />
                      </button>
                      <button 
                        className="icon-btn" 
                        onClick={() => handleToggleStatus(plan)} 
                        title={plan.activo ? 'Suspender' : 'Reactivar'}
                        disabled={isToggling}
                      >
                        {plan.activo ? <Ban size={18} color="var(--danger)" /> : <CheckCircle size={18} color="var(--success)" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {plans?.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>No hay planes registrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Crear/Editar Plan */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingPlanId ? 'Editar Plan' : 'Crear Nuevo Plan'}</h2>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre del Plan *</label>
                  <input type="text" className="form-input" required
                    value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                </div>
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Descripción</label>
                  <textarea className="form-input" rows={2}
                    value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})}></textarea>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Precio *</label>
                    <input type="number" step="0.01" className="form-input" required
                      value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duración (Meses) *</label>
                    <input type="number" className="form-input" required min="1"
                      value={formData.duracionMeses} onChange={e => setFormData({...formData, duracionMeses: e.target.value})} />
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Límite de Usuarios *</label>
                  <input type="number" className="form-input" required min="1"
                    value={formData.limitUsuarios} onChange={e => setFormData({...formData, limitUsuarios: e.target.value})} />
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isCreating || isUpdating}>
                  {isCreating || isUpdating ? 'Guardando...' : <><Save size={16}/> {editingPlanId ? 'Guardar Cambios' : 'Guardar Plan'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
