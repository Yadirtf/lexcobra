// ═══════════════════════════════════════════════════════════════
//  LexCobra — AdminLocationsPage
//  Gestión de Departamentos y Municipios base de Colombia
// ═══════════════════════════════════════════════════════════════

import { useState, useMemo } from 'react';
import { Map, DownloadCloud, Search, ChevronDown, ChevronUp, MapPin, X } from 'lucide-react';
import { useAdminLocations, useSyncLocations } from '../api/locations.js';

export function AdminLocationsPage() {
  const { data: departamentos, isLoading } = useAdminLocations();
  const { mutateAsync: syncLocations, isPending: isSyncing } = useSyncLocations();

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDeptId, setExpandedDeptId] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filtrado de departamentos y municipios
  const filteredDepartamentos = useMemo(() => {
    if (!departamentos) return [];
    const term = searchTerm.toLowerCase().trim();
    if (!term) return departamentos;

    return departamentos.map(depto => {
      // Si el departamento coincide, mostrar todos sus municipios
      if (depto.nombre.toLowerCase().includes(term)) {
        return depto;
      }
      // Si no, filtrar solo los municipios que coinciden
      const matchingMunicipios = depto.municipios.filter(m => m.nombre.toLowerCase().includes(term));
      if (matchingMunicipios.length > 0) {
        return { ...depto, municipios: matchingMunicipios };
      }
      return null;
    }).filter(Boolean) as typeof departamentos;
  }, [departamentos, searchTerm]);

  const handleSync = async () => {
    setSyncMessage(null);
    if (!window.confirm('¿Deseas sincronizar los datos geográficos base desde el archivo interno de Colombia? Esto no borrará datos existentes, solo agregará los faltantes.')) {
      return;
    }
    
    try {
      const result = await syncLocations();
      setSyncMessage({
        type: 'success',
        text: `${result.message}. Departamentos insertados/actualizados: ${result.deptCount}, Municipios nuevos: ${result.munCount}.`
      });
    } catch (err: any) {
      setSyncMessage({
        type: 'error',
        text: err.message || 'Ocurrió un error durante la sincronización.'
      });
    }
  };

  const toggleDept = (id: string) => {
    setExpandedDeptId(prev => (prev === id ? null : id));
  };

  return (
    <div className="portfolios-container">
      {/* Header */}
      <div className="portfolios-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="portfolios-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Map size={24} color="var(--accent)" /> Ubicaciones Base (Colombia)
          </h1>
          <p style={{ color: 'var(--text-4)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Base de datos general de departamentos y municipios disponibles para todas las casas de cobranza.
          </p>
        </div>
        <button 
          className="btn-primary" 
          onClick={handleSync} 
          disabled={isSyncing}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {isSyncing ? (
            'Sincronizando...'
          ) : (
            <><DownloadCloud size={18} /> Sincronizar Datos Base</>
          )}
        </button>
      </div>

      {syncMessage && (
        <div style={{
          background: syncMessage.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${syncMessage.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
          color: syncMessage.type === 'success' ? 'var(--success)' : 'var(--danger)',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{syncMessage.text}</span>
          <button onClick={() => setSyncMessage(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Stats Summary */}
      {!isLoading && departamentos && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <div className="stat-card" style={{ padding: '1rem 1.5rem', flex: 1 }}>
            <div className="stat-label">Total Departamentos</div>
            <div className="stat-value">{departamentos.length}</div>
          </div>
          <div className="stat-card" style={{ padding: '1rem 1.5rem', flex: 1 }}>
            <div className="stat-label">Total Municipios</div>
            <div className="stat-value">{departamentos.reduce((acc, d) => acc + d.municipios.length, 0)}</div>
          </div>
        </div>
      )}

      {/* Buscador */}
      <div style={{ position: 'relative', marginBottom: '1.5rem', maxWidth: '500px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
        <input
          type="text"
          className="form-input"
          style={{ paddingLeft: '2.5rem' }}
          placeholder="Buscar departamento o municipio..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '2px' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Lista de Departamentos */}
      {isLoading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-4)' }}>
          <Map size={32} opacity={0.3} style={{ margin: '0 auto 1rem' }} />
          <p>Cargando ubicaciones...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredDepartamentos.map(depto => {
            const isExpanded = expandedDeptId === depto.id || searchTerm !== '';
            
            return (
              <div key={depto.id} style={{ 
                background: 'var(--bg-surface)', 
                border: '1px solid var(--border)', 
                borderRadius: '8px', 
                overflow: 'hidden' 
              }}>
                {/* Header (Clickable) */}
                <div 
                  onClick={() => toggleDept(depto.id)}
                  style={{ 
                    padding: '1rem 1.25rem', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    cursor: 'pointer',
                    background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <MapPin size={18} color="var(--accent)" />
                    <strong style={{ fontSize: '1rem' }}>{depto.nombre}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-3)', background: 'var(--bg)', padding: '0.2rem 0.5rem', borderRadius: '10px' }}>
                      {depto.municipios.length} municipios
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp size={18} color="var(--text-3)" /> : <ChevronDown size={18} color="var(--text-3)" />}
                </div>

                {/* Body (Municipios) */}
                {isExpanded && (
                  <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', background: 'var(--bg)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                    {depto.municipios.map(mun => (
                      <div key={mun.id} style={{ fontSize: '0.85rem', color: 'var(--text-2)', padding: '0.4rem 0.6rem', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                        {mun.nombre}
                      </div>
                    ))}
                    {depto.municipios.length === 0 && (
                      <div style={{ color: 'var(--text-4)', fontSize: '0.85rem', gridColumn: '1 / -1' }}>No hay municipios registrados para este departamento.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {filteredDepartamentos.length === 0 && (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-4)', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <Map size={36} opacity={0.2} style={{ margin: '0 auto 1rem' }} />
              <p style={{ fontWeight: 600, marginBottom: '0.3rem' }}>No hay resultados</p>
              <p style={{ fontSize: '0.85rem' }}>No se encontraron departamentos o municipios con "{searchTerm}".</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
