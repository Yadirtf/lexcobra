// ═══════════════════════════════════════════════════════════════
//  LexCobra — CourtsPage
//  Gestión de Juzgados del Tenant: CRUD completo con ubicación
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo } from "react";
import { Scale, Plus, X, Save, Pencil, Trash2, Search, MapPin, AlertTriangle } from "lucide-react";
import {
  useJuzgados,
  useCreateJuzgado,
  useUpdateJuzgado,
  useDeleteJuzgado,
  useDepartamentos,
  useMunicipalities,
  type Juzgado,
} from "../../obligations/api/catalogs.js";
import { SearchableSelect } from "../../../shared/components/ui/SearchableSelect.js";

// ── Modal de Crear / Editar ──────────────────────────────────────────────────

interface JuzgadoFormData {
  nombre: string;
  departamentoId: string;
  municipioId: string;
}

interface JuzgadoModalProps {
  editingJuzgado: Juzgado | null;
  onClose: () => void;
}

function JuzgadoModal({ editingJuzgado, onClose }: JuzgadoModalProps) {
  const { data: departamentos } = useDepartamentos();
  const { data: municipalities } = useMunicipalities();

  const [form, setForm] = useState<JuzgadoFormData>({
    nombre: editingJuzgado?.nombre ?? "",
    departamentoId: editingJuzgado?.informacion?.departamentoId ?? "",
    municipioId: editingJuzgado?.informacion?.municipioId ?? "",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { mutateAsync: createJuzgado, isPending: isCreating } = useCreateJuzgado();
  const { mutateAsync: updateJuzgado, isPending: isUpdating } = useUpdateJuzgado();
  const isPending = isCreating || isUpdating;

  const filteredMunicipios = useMemo(
    () =>
      form.departamentoId
        ? (municipalities ?? []).filter((m) => m.departamentoId === form.departamentoId)
        : (municipalities ?? []),
    [municipalities, form.departamentoId],
  );

  const handleDepartamentoChange = (value: string) => {
    setForm((f) => ({ ...f, departamentoId: value, municipioId: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.nombre.trim()) {
      setFormError("El nombre del juzgado es requerido");
      return;
    }
    try {
      const payload = {
        nombre: form.nombre,
        departamentoId: form.departamentoId || undefined,
        municipioId: form.municipioId || undefined,
      };
      if (editingJuzgado) {
        await updateJuzgado({ id: editingJuzgado.id, data: payload });
      } else {
        await createJuzgado(payload);
      }
      onClose();
    } catch (err: any) {
      setFormError(err.message ?? "Error al guardar el juzgado");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: "520px" }}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Scale size={18} />
            {editingJuzgado ? "Editar Juzgado" : "Registrar Juzgado"}
          </h2>
          <button className="icon-btn" onClick={onClose} disabled={isPending}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Nombre */}
            <div className="form-group">
              <label className="form-label">Nombre del Juzgado *</label>
              <input
                type="text"
                className="form-input"
                required
                placeholder="ej. JUZGADO PRIMERO CIVIL DEL CIRCUITO"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value.toUpperCase() }))}
                disabled={isPending}
                autoFocus
              />
              <p style={{ fontSize: "0.78rem", color: "var(--text-4)", marginTop: "0.25rem" }}>
                Se guardará en mayúsculas automáticamente.
              </p>
            </div>

            {/* Ubicación */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1rem", marginTop: "0.5rem" }}>
              <p style={{ fontSize: "0.85rem", color: "var(--text-3)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <MapPin size={14} /> Ubicación del Juzgado
                <span style={{ fontSize: "0.75rem", color: "var(--text-4)" }}>(opcional)</span>
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Departamento</label>
                  <SearchableSelect
                    options={(departamentos ?? []).map((d) => ({ value: d.id, label: d.nombre }))}
                    value={form.departamentoId}
                    onChange={handleDepartamentoChange}
                    placeholder="Buscar departamento..."
                    disabled={isPending}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Municipio</label>
                  <SearchableSelect
                    options={filteredMunicipios.map((m) => ({ value: m.id, label: m.nombre }))}
                    value={form.municipioId}
                    onChange={(value) => setForm((f) => ({ ...f, municipioId: value }))}
                    placeholder={form.departamentoId ? "Buscar municipio..." : "Seleccione depto."}
                    disabled={isPending || !form.departamentoId}
                  />
                </div>
              </div>
            </div>

            {formError && (
              <div style={{
                background: "rgba(220,38,38,0.08)", border: "1px solid var(--danger)",
                borderRadius: "8px", padding: "0.75rem 1rem", color: "var(--danger)",
                fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem",
              }}>
                <AlertTriangle size={15} /> {formError}
              </div>
            )}
          </div>

          <div className="modal-footer" style={{ marginTop: 0 }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isPending}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={isPending}>
              {isPending ? "Guardando..." : <><Save size={15} /> {editingJuzgado ? "Guardar Cambios" : "Registrar Juzgado"}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────────────

export function CourtsPage() {
  const { data: juzgados, isLoading } = useJuzgados();
  const { mutateAsync: deleteJuzgado, isPending: isDeleting } = useDeleteJuzgado();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJuzgado, setEditingJuzgado] = useState<Juzgado | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteError, setDeleteError] = useState<{ id: string; message: string } | null>(null);

  const filtered = useMemo(() => {
    if (!juzgados) return [];
    const term = searchTerm.toLowerCase().trim();
    if (!term) return juzgados;
    return juzgados.filter(
      (j) =>
        j.nombre?.toLowerCase().includes(term) ||
        j.informacion?.departamento?.nombre?.toLowerCase().includes(term) ||
        j.informacion?.municipio?.nombre?.toLowerCase().includes(term),
    );
  }, [juzgados, searchTerm]);

  const openCreate = () => { setEditingJuzgado(null); setDeleteError(null); setIsModalOpen(true); };
  const openEdit = (j: Juzgado) => { setEditingJuzgado(j); setDeleteError(null); setIsModalOpen(true); };

  const handleDelete = async (j: Juzgado) => {
    setDeleteError(null);
    if (!window.confirm(`¿Eliminar el juzgado "${j.nombre}"?\nEsta acción no se puede deshacer.`)) return;
    try {
      await deleteJuzgado(j.id);
    } catch (err: any) {
      setDeleteError({ id: j.id, message: err.message });
    }
  };

  return (
    <div className="portfolios-container">
      {/* Header */}
      <div className="portfolios-header">
        <div>
          <h1 className="portfolios-title" style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <Scale size={22} color="var(--accent)" /> Gestión de Juzgados
          </h1>
          <p style={{ color: "var(--text-4)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            {juzgados?.length ?? 0} juzgado{(juzgados?.length ?? 0) !== 1 ? "s" : ""} registrado{(juzgados?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={18} /> Nuevo Juzgado
        </button>
      </div>

      {/* Buscador */}
      <div style={{ position: "relative", marginTop: "1.5rem", marginBottom: "1rem", maxWidth: "440px" }}>
        <Search size={15} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", pointerEvents: "none" }} />
        <input
          type="text"
          className="form-input"
          style={{ paddingLeft: "2.5rem" }}
          placeholder="Buscar por nombre, departamento o municipio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm("")} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-3)", cursor: "pointer" }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-4)" }}>
          <Scale size={32} opacity={0.3} style={{ margin: "0 auto 1rem" }} />
          <p>Cargando juzgados...</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre del Juzgado</th>
                <th>Departamento</th>
                <th>Municipio</th>
                <th style={{ width: "110px", textAlign: "center" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((juzgado) => (
                <>
                  <tr key={juzgado.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Scale size={14} color="var(--accent)" style={{ flexShrink: 0 }} />
                        <strong style={{ fontSize: "0.875rem" }}>{juzgado.nombre}</strong>
                      </div>
                    </td>
                    <td>
                      {juzgado.informacion?.departamento?.nombre ? (
                        <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--text-2)", fontSize: "0.875rem" }}>
                          <MapPin size={12} color="var(--text-4)" />
                          {juzgado.informacion.departamento.nombre}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-4)", fontSize: "0.8rem", fontStyle: "italic" }}>Sin asignar</span>
                      )}
                    </td>
                    <td style={{ color: "var(--text-2)", fontSize: "0.875rem" }}>
                      {juzgado.informacion?.municipio?.nombre ?? (
                        <span style={{ color: "var(--text-4)", fontSize: "0.8rem", fontStyle: "italic" }}>Sin asignar</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center" }}>
                        <button className="icon-btn" title="Editar juzgado" onClick={() => openEdit(juzgado)}>
                          <Pencil size={16} color="var(--accent)" />
                        </button>
                        <button className="icon-btn" title="Eliminar juzgado" onClick={() => handleDelete(juzgado)} disabled={isDeleting}>
                          <Trash2 size={16} color="var(--danger)" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {deleteError?.id === juzgado.id && (
                    <tr key={`${juzgado.id}-err`}>
                      <td colSpan={4} style={{ padding: "0.4rem 1rem 0.75rem" }}>
                        <div style={{
                          background: "rgba(220,38,38,0.07)", border: "1px solid var(--danger)",
                          borderRadius: "8px", padding: "0.6rem 1rem", color: "var(--danger)",
                          fontSize: "0.82rem", display: "flex", alignItems: "center", gap: "0.5rem",
                        }}>
                          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                          {deleteError.message}
                          <button onClick={() => setDeleteError(null)} style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--danger)", cursor: "pointer" }}>
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--text-4)" }}>
                      <Scale size={36} opacity={0.2} style={{ margin: "0 auto 1rem" }} />
                      {searchTerm ? (
                        <><p style={{ fontWeight: 600, marginBottom: "0.3rem" }}>Sin resultados para "{searchTerm}"</p><p style={{ fontSize: "0.85rem" }}>Intente con otro término.</p></>
                      ) : (
                        <><p style={{ fontWeight: 600, marginBottom: "0.3rem" }}>No hay juzgados registrados</p><p style={{ fontSize: "0.85rem" }}>Cree el primero con "Nuevo Juzgado".</p></>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <JuzgadoModal editingJuzgado={editingJuzgado} onClose={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}
