import { useState, useCallback } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  KeyRound,
  PowerOff,
  Power,
  Shield,
} from 'lucide-react';
import { useEmployees, useToggleEmployeeStatus, type Employee } from '../api/employees.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { CreateEmployeeModal } from './CreateEmployeeModal.js';
import { EditEmployeeModal } from './EditEmployeeModal.js';
import { ResetPasswordModal } from './ResetPasswordModal.js';
import './Employees.css';

// ── Helpers ────────────────────────────────────────────────────

/** Genera las iniciales del nombre para el avatar */
function getInitials(nombres: string, apellidos: string): string {
  const n = nombres.trim().charAt(0).toUpperCase();
  const a = apellidos.trim().charAt(0).toUpperCase();
  return `${n}${a}`;
}

// ── Skeleton Loading ───────────────────────────────────────────
function SkeletonRows() {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <tr key={i} className="skeleton-row">
          <td>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <div className="skeleton-avatar" />
              <div>
                <div className="skeleton-line" style={{ width: '140px', marginBottom: '6px' }} />
                <div className="skeleton-line" style={{ width: '90px' }} />
              </div>
            </div>
          </td>
          <td><div className="skeleton-line" style={{ width: '110px' }} /></td>
          <td><div className="skeleton-line" style={{ width: '80px', borderRadius: '20px' }} /></td>
          <td><div className="skeleton-line" style={{ width: '70px', borderRadius: '20px' }} /></td>
          <td><div className="skeleton-line" style={{ width: '90px', borderRadius: '20px' }} /></td>
          <td />
        </tr>
      ))}
    </>
  );
}

// ── Componente principal ───────────────────────────────────────

export function EmployeesListPage() {
  const { isLegalRep, isSuperAdmin } = useAuth();
  const isAdmin = isLegalRep || isSuperAdmin;

  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  const soloActivos =
    filterActive === 'active' ? true : filterActive === 'inactive' ? false : undefined;

  const { data: employees, isLoading, error: loadError } = useEmployees(search, soloActivos);
  const { mutateAsync: toggleStatus } = useToggleEmployeeStatus();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [resetEmployee, setResetEmployee] = useState<Employee | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggle = useCallback(
    async (emp: Employee) => {
      if (togglingId) return;
      setTogglingId(emp.id);
      try {
        await toggleStatus({ id: emp.id, activar: !emp.activo });
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Error al cambiar el estado del asesor');
      } finally {
        setTogglingId(null);
      }
    },
    [toggleStatus, togglingId],
  );

  return (
    <div className="employees-container">
      {/* ── Encabezado ── */}
      <div className="employees-header">
        <div>
          <h1 className="employees-title">Asesores de Cobranza</h1>
          <p className="employees-subtitle">
            Gestiona el equipo de trabajo de tu empresa
          </p>
        </div>
        {isAdmin && (
          <button
            className="btn-primary"
            onClick={() => setIsCreateOpen(true)}
            id="btn-nuevo-asesor"
          >
            <Plus size={18} /> Nuevo Asesor
          </button>
        )}
      </div>

      {/* ── Barra de herramientas ── */}
      <div className="employees-toolbar">
        <div className="employees-search-wrapper">
          <Search size={15} className="employees-search-icon" />
          <input
            type="text"
            className="employees-search"
            placeholder="Buscar por nombre o identificación…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="employee-search-input"
          />
        </div>
        <select
          className="employees-filter-select"
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
          id="employee-status-filter"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Solo activos</option>
          <option value="inactive">Solo inactivos</option>
        </select>
      </div>

      {/* ── Error de carga ── */}
      {loadError && (
        <div
          className="security-alert"
          style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}
        >
          <p style={{ color: '#fca5a5' }}>Error al cargar los asesores. Intenta recargar la página.</p>
        </div>
      )}

      {/* ── Tabla ── */}
      {!loadError && (
        <div className="employees-table-wrapper">
          <table className="employees-table">
            <thead>
              <tr>
                <th>Asesor</th>
                <th>Identificación</th>
                <th>Cargo</th>
                <th>Correo</th>
                <th>Estado</th>
                {isAdmin && <th style={{ textAlign: 'right' }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonRows />
              ) : employees?.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5}>
                    <div className="employees-empty" style={{ border: 'none', background: 'transparent' }}>
                      <Users size={48} className="employees-empty-icon" />
                      <h3>
                        {search
                          ? 'Sin resultados para esta búsqueda'
                          : 'No hay asesores registrados'}
                      </h3>
                      <p>
                        {search
                          ? `No encontramos asesores con "${search}". Prueba con otro término.`
                          : isAdmin
                          ? 'Agrega el primer asesor de tu equipo usando el botón "Nuevo Asesor".'
                          : 'Aún no hay asesores registrados en el sistema.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                employees?.map((emp) => (
                  <tr key={emp.id} style={{ opacity: emp.activo ? 1 : 0.6 }}>
                    {/* Columna: Nombre */}
                    <td>
                      <div className="employee-name-cell">
                        <div
                          className={`employee-avatar ${!emp.activo ? 'inactive-avatar' : ''}`}
                        >
                          {getInitials(emp.nombres, emp.apellidos)}
                        </div>
                        <div>
                          <div className="employee-full-name">
                            {emp.nombres} {emp.apellidos}
                          </div>
                          <div className="employee-identification">
                            CC {emp.identificacion}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Columna: Identificación */}
                    <td style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>
                      {emp.identificacion}
                    </td>

                    {/* Columna: Cargo */}
                    <td>
                      {emp.cargo ? (
                        <span className="employee-cargo-badge">{emp.cargo.nombreCargo}</span>
                      ) : (
                        <span style={{ color: 'var(--text-4)', fontSize: '0.82rem' }}>—</span>
                      )}
                    </td>

                    {/* Columna: Correo */}
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>
                      {emp.usuario?.correo ?? '—'}
                    </td>

                    {/* Columna: Estado */}
                    <td>
                      <span
                        className={`employee-status-badge ${emp.activo ? 'active' : 'inactive'}`}
                      >
                        <span className="status-dot" />
                        {emp.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    {/* Columna: Acciones (solo admin) */}
                    {isAdmin && (
                      <td>
                        <div className="employee-actions">
                          {/* Editar datos */}
                          <button
                            className="employee-action-btn btn-edit"
                            onClick={() => setEditEmployee(emp)}
                            title="Editar datos del asesor"
                            id={`btn-edit-${emp.id}`}
                          >
                            <Edit2 size={15} />
                          </button>

                          {/* Restablecer contraseña */}
                          {emp.activo && (
                            <button
                              className="employee-action-btn btn-password"
                              onClick={() => setResetEmployee(emp)}
                              title="Restablecer contraseña"
                              id={`btn-reset-${emp.id}`}
                            >
                              <KeyRound size={15} />
                            </button>
                          )}

                          {/* Activar / Desactivar */}
                          <button
                            className={`employee-action-btn ${emp.activo ? 'btn-deactivate' : 'btn-activate'}`}
                            onClick={() => handleToggle(emp)}
                            disabled={togglingId === emp.id}
                            title={emp.activo ? 'Desactivar asesor' : 'Activar asesor'}
                            id={`btn-toggle-${emp.id}`}
                          >
                            {emp.activo ? <PowerOff size={15} /> : <Power size={15} />}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pie de tabla con conteo */}
          {!isLoading && employees && employees.length > 0 && (
            <div className="employees-count">
              {employees.length} asesor{employees.length !== 1 ? 'es' : ''} encontrado{employees.length !== 1 ? 's' : ''}
              {filterActive !== 'all' && ` · Filtro: ${filterActive === 'active' ? 'Activos' : 'Inactivos'}`}
            </div>
          )}
        </div>
      )}

      {/* ── Estado vacío sin tabla (sin asesores y sin carga) ── */}
      {!isLoading && !loadError && !employees?.length && !search && (
        <div className="employees-empty" style={{ marginTop: '1.5rem' }}>
          <Users size={56} className="employees-empty-icon" />
          <h3>Tu equipo está vacío</h3>
          <p>
            Agrega asesores de cobranza para que puedan gestionar las carteras y obligaciones
            de tu empresa.
          </p>
          {isAdmin && (
            <button
              className="btn-primary"
              style={{ marginTop: '1.5rem' }}
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus size={18} /> Agregar primer asesor
            </button>
          )}
        </div>
      )}

      {/* ── Info de seguridad para asesores (solo lectura de la tabla) ── */}
      {!isAdmin && employees && employees.length > 0 && (
        <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-4)', fontSize: '0.82rem' }}>
          <Shield size={14} />
          <span>
            Solo el Representante Legal puede crear, editar o desactivar asesores.
          </span>
        </div>
      )}

      {/* ── Nota: asesores NO ven esta pantalla (solo Admin) ── */}
      {/* La ruta /employees está protegida por rol en el router */}

      {/* ── Modales ── */}
      <CreateEmployeeModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <EditEmployeeModal
        isOpen={!!editEmployee}
        onClose={() => setEditEmployee(null)}
        employee={editEmployee}
      />

      <ResetPasswordModal
        isOpen={!!resetEmployee}
        onClose={() => setResetEmployee(null)}
        employee={resetEmployee}
      />
    </div>
  );
}
