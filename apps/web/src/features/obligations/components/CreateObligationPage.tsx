import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from '@tanstack/react-router';
import { ChevronLeft, ChevronDown, ChevronUp, Plus, Save, Trash2, X, MapPin } from 'lucide-react';
import { useCreateObligation } from '../api/obligations.js';
import { usePortfolios } from '../../portfolios/api/portfolios.js';
import { 
  useMunicipalities,
  useDepartamentos,
  useJuzgados,
  useEstadosObligacion,
  useMedidasCautelares,
  useNivelesRecuperacion,
  useTiposContacto,
  useTiposIdentificacion,
  useCreateJuzgado
} from '../api/catalogs.js';
import { SearchableSelect } from '../../../shared/components/ui/SearchableSelect.js';

interface ContactEntry {
  tipoContactoId: string;
  valor: string;
  error?: string;
}

interface PersonEntry {
  tipoIdentificacionId: string;
  documentId: string;
  fullName: string;
  contacts: ContactEntry[];
}

export function CreateObligationPage() {
  const { portfolioId } = useParams({ strict: false }) as { portfolioId: string };
  const navigate = useNavigate();
  const { data: portfolios } = usePortfolios();
  const portfolio = portfolios?.find(p => p.id === portfolioId);
  
  // Catalogs
  const { data: departamentos } = useDepartamentos();
  const { data: municipalities } = useMunicipalities();
  const { data: juzgados } = useJuzgados();
  const { data: estados } = useEstadosObligacion();
  const { data: medidas } = useMedidasCautelares();
  const { data: niveles } = useNivelesRecuperacion();
  const { data: tiposContacto } = useTiposContacto();
  const { data: tiposId } = useTiposIdentificacion();

  const { mutateAsync: createJuzgado, isPending: isCreatingJuzgado } = useCreateJuzgado();

  const { mutateAsync: createObligation, isPending } = useCreateObligation();

  const [openSections, setOpenSections] = useState({
    debtors: true,
    codebtors: false,
    credit: true,
    process: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const [debtors, setDebtors] = useState<PersonEntry[]>([{ tipoIdentificacionId: '', documentId: '', fullName: '', contacts: [] }]);
  const [coDebtors, setCoDebtors] = useState<PersonEntry[]>([]);

  const [formData, setFormData] = useState({
    creditNumber: '',
    promissoryNoteNumber: '',
    capitalBalance: '',
    municipalityId: '',
    intakeDate: '',
    lawsuitDate: '',
    courtId: '',
    docketNumber: '',
    precautionaryMeasureId: '',
    paymentOrderDate: '',
    proceedExecutionDate: '',
    creditLiquidationDate: '',
    statusId: '',
    recoveryLevelId: '',
  });

  // Estado local para departamento de la obligación (filtra municipios)
  const [departamentoIdObligacion, setDepartamentoIdObligacion] = useState('');

  // Estado para mini-modal de creación rápida de juzgado
  const [quickJuzgadoModal, setQuickJuzgadoModal] = useState(false);
  const [quickJuzgadoNombre, setQuickJuzgadoNombre] = useState('');
  const [quickJuzgadoDepto, setQuickJuzgadoDepto] = useState('');
  const [quickJuzgadoMunicipio, setQuickJuzgadoMunicipio] = useState('');

  // Municipios filtrados por el departamento seleccionado (sección crédito)
  const filteredMunicipalities = useMemo(
    () =>
      departamentoIdObligacion
        ? (municipalities ?? []).filter((m) => m.departamentoId === departamentoIdObligacion)
        : (municipalities ?? []),
    [municipalities, departamentoIdObligacion],
  );

  // Municipios filtrados para el mini-modal del juzgado
  const quickJuzgadoMunicipios = useMemo(
    () =>
      quickJuzgadoDepto
        ? (municipalities ?? []).filter((m) => m.departamentoId === quickJuzgadoDepto)
        : [],
    [municipalities, quickJuzgadoDepto],
  );

  const handleDepartamentoObligacionChange = (value: string) => {
    setDepartamentoIdObligacion(value);
    setFormData((f) => ({ ...f, municipalityId: '' }));
  };

  const handlePersonChange = (type: 'debtors' | 'codebtors', index: number, field: keyof PersonEntry, value: string) => {
    const list = type === 'debtors' ? [...debtors] : [...coDebtors];
    list[index] = { ...list[index], [field]: value };
    type === 'debtors' ? setDebtors(list) : setCoDebtors(list);
  };

  const addPerson = (type: 'debtors' | 'codebtors') => {
    const newPerson = { tipoIdentificacionId: '', documentId: '', fullName: '', contacts: [] };
    if (type === 'debtors') setDebtors([...debtors, newPerson]);
    else setCoDebtors([...coDebtors, newPerson]);
  };

  const removePerson = (type: 'debtors' | 'codebtors', index: number) => {
    const list = type === 'debtors' ? [...debtors] : [...coDebtors];
    list.splice(index, 1);
    type === 'debtors' ? setDebtors(list) : setCoDebtors(list);
  };

  // ── Validación de contactos ─────────────────────────────────────
  const validateContactValue = (
    tipoContactoId: string,
    valor: string,
  ): string => {
    if (!valor.trim()) return '';

    const tipoNombre = tiposContacto
      ?.find((t) => t.id === tipoContactoId)
      ?.nombre?.toLowerCase() ?? '';

    if (tipoNombre.includes('celular') || tipoNombre.includes('móvil') || tipoNombre.includes('movil')) {
      // Celular colombiano: 10 dígitos, comienza con 3
      const clean = valor.replace(/\s/g, '');
      if (!/^3\d{9}$/.test(clean)) {
        return 'Celular inválido: debe tener 10 dígitos y comenzar con 3 (ej. 3001234567)';
      }
    } else if (tipoNombre.includes('tel') || tipoNombre.includes('fijo') || tipoNombre.includes('phone')) {
      // Teléfono fijo Colombia: 6 + área(2) + local(7) = 10 dígitos (ej. 6082345678)
      // O formato largo: 60 + área(3) + local(7) = 12 dígitos
      const clean = valor.replace(/[\s().\-]/g, '');
      const isLong  = /^60\d{10}$/.test(clean);   // 60 + area(3) + local(7) = 12
      const isShort = /^6\d{9}$/.test(clean);     // 6 + area(2) + local(7) = 10 (ej. 6082345678)
      if (!isLong && !isShort) {
        return 'Teléfono fijo inválido: debe tener el indicativo regional (ej. 6082345678 para Putumayo)';
      }
    } else if (tipoNombre.includes('correo') || tipoNombre.includes('email') || tipoNombre.includes('mail')) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim())) {
        return 'Correo electrónico inválido (ej. nombre@empresa.com)';
      }
    }

    return '';
  };

  const hasContactErrors = (): boolean => {
    const allPersons = [...debtors, ...coDebtors];
    return allPersons.some((p) =>
      p.contacts.some((c) => !!c.error)
    );
  };

  const addContact = (type: 'debtors' | 'codebtors', personIndex: number) => {
    const list = type === 'debtors' ? [...debtors] : [...coDebtors];
    list[personIndex].contacts.push({ tipoContactoId: '', valor: '' });
    type === 'debtors' ? setDebtors(list) : setCoDebtors(list);
  };

  const handleContactChange = (type: 'debtors' | 'codebtors', personIndex: number, contactIndex: number, field: keyof ContactEntry, value: string) => {
    const list = type === 'debtors' ? [...debtors] : [...coDebtors];
    const contact = { ...list[personIndex].contacts[contactIndex], [field]: value };

    // Validate on every change
    if (field === 'valor' || field === 'tipoContactoId') {
      const tipoId = field === 'tipoContactoId' ? value : contact.tipoContactoId;
      const val   = field === 'valor'           ? value : contact.valor;
      contact.error = validateContactValue(tipoId, val);
    }

    list[personIndex].contacts[contactIndex] = contact;
    type === 'debtors' ? setDebtors(list) : setCoDebtors(list);
  };

  const removeContact = (type: 'debtors' | 'codebtors', personIndex: number, contactIndex: number) => {
    const list = type === 'debtors' ? [...debtors] : [...coDebtors];
    list[personIndex].contacts.splice(contactIndex, 1);
    type === 'debtors' ? setDebtors(list) : setCoDebtors(list);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        portfolioId,
        creditNumber: formData.creditNumber,
        promissoryNoteNumber: formData.promissoryNoteNumber || undefined,
        capitalBalance: Number(formData.capitalBalance),
        municipalityId: formData.municipalityId || undefined,
        
        intakeDate: formData.intakeDate ? new Date(formData.intakeDate).toISOString() : undefined,
        lawsuitDate: formData.lawsuitDate ? new Date(formData.lawsuitDate).toISOString() : undefined,
        courtId: formData.courtId || undefined,
        docketNumber: formData.docketNumber || undefined,
        precautionaryMeasureId: formData.precautionaryMeasureId || undefined,
        statusId: formData.statusId || undefined,
        recoveryLevelId: formData.recoveryLevelId || undefined,
        paymentOrderDate: formData.paymentOrderDate ? new Date(formData.paymentOrderDate).toISOString() : undefined,
        proceedExecutionDate: formData.proceedExecutionDate ? new Date(formData.proceedExecutionDate).toISOString() : undefined,
        creditLiquidationDate: formData.creditLiquidationDate ? new Date(formData.creditLiquidationDate).toISOString() : undefined,

        debtors: debtors.filter(d => d.documentId && d.fullName).map(d => ({
          ...d,
          tipoIdentificacionId: d.tipoIdentificacionId || undefined,
          contacts: d.contacts.filter(c => c.tipoContactoId && c.valor).map(({ error: _e, ...c }) => ({ ...c, esPrincipal: false }))
        })),
        coDebtors: coDebtors.filter(d => d.documentId && d.fullName).map(d => ({
          ...d,
          tipoIdentificacionId: d.tipoIdentificacionId || undefined,
          contacts: d.contacts.filter(c => c.tipoContactoId && c.valor).map(({ error: _e, ...c }) => ({ ...c, esPrincipal: false }))
        })),
        notifications: [],
      };

      await createObligation(payload);
      
      // Navigate back to portfolio details
      navigate({ to: '/portfolios/$portfolioId', params: { portfolioId } });
    } catch (error: any) {
      alert(`Error al crear obligación: ${error.message}`);
    }
  };

  // Helper to render person form
  const renderPersonForm = (type: 'debtors' | 'codebtors') => {
    const persons = type === 'debtors' ? debtors : coDebtors;
    
    return (
      <div className="form-section-body" style={{ padding: '1.5rem', borderTop: '1px solid var(--border)' }}>
        {persons.map((person, index) => (
          <div key={index} style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: index < persons.length - 1 ? '1px dashed var(--border)' : 'none' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: '1rem', alignItems: 'end', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Tipo ID</label>
                <select className="form-input" value={person.tipoIdentificacionId} onChange={e => handlePersonChange(type, index, 'tipoIdentificacionId', e.target.value)}>
                  <option value="">Seleccione...</option>
                  {tiposId?.map(t => <option key={t.id} value={t.id}>{t.codigo} - {t.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Número *</label>
                <input type="text" className="form-input" required placeholder="Cédula/NIT"
                  value={person.documentId} onChange={e => handlePersonChange(type, index, 'documentId', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Nombre Completo *</label>
                <input type="text" className="form-input" required placeholder="Nombre de la persona"
                  value={person.fullName} onChange={e => handlePersonChange(type, index, 'fullName', e.target.value)} />
              </div>
              {(type === 'codebtors' || debtors.length > 1) && (
                <button type="button" onClick={() => removePerson(type, index)} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.5rem', marginBottom: '0.2rem' }}>
                  <Trash2 size={18} />
                </button>
              )}
            </div>
            
            {/* Contacts Subform */}
            <div style={{ paddingLeft: '1rem', borderLeft: '2px solid var(--border)' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-3)' }}>Contactos de {person.fullName || 'esta persona'}:</p>
              {person.contacts.map((contact, cIndex) => (
                <div key={cIndex} style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <select 
                      className="form-input" style={{ width: '150px', flexShrink: 0 }}
                      value={contact.tipoContactoId} 
                      onChange={e => handleContactChange(type, index, cIndex, 'tipoContactoId', e.target.value)}
                    >
                      <option value="">Tipo...</option>
                      {tiposContacto?.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </select>
                    <input 
                      type={(() => {
                        const n = tiposContacto?.find(t => t.id === contact.tipoContactoId)?.nombre?.toLowerCase() ?? '';
                        if (n.includes('correo') || n.includes('email') || n.includes('mail')) return 'email';
                        if (n.includes('celular') || n.includes('movil') || n.includes('móvil') || n.includes('tel') || n.includes('fijo')) return 'tel';
                        return 'text';
                      })()}
                      className={`form-input${contact.error ? ' input-error' : ''}`}
                      style={{ flex: 1, borderColor: contact.error ? 'var(--danger)' : undefined }}
                      placeholder={
                        (() => {
                          const n = tiposContacto?.find(t => t.id === contact.tipoContactoId)?.nombre?.toLowerCase() ?? '';
                          if (n.includes('celular') || n.includes('movil') || n.includes('móvil')) return 'ej. 3001234567';
                          if (n.includes('tel') || n.includes('fijo')) return 'ej. 6082345678';
                          if (n.includes('correo') || n.includes('email') || n.includes('mail')) return 'ej. nombre@empresa.com';
                          return 'Valor del contacto';
                        })()
                      }
                      value={contact.valor} 
                      onChange={e => handleContactChange(type, index, cIndex, 'valor', e.target.value)}
                    />
                    <button type="button" onClick={() => removeContact(type, index, cIndex)} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.25rem', flexShrink: 0 }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {contact.error && (
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.3rem', paddingLeft: '162px' }}>
                      <svg viewBox="0 0 24 24" fill="none" style={{ width: 12, height: 12, flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="12" cy="16" r="0.5" fill="currentColor" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                      {contact.error}
                    </p>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addContact(type, index)} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                <Plus size={14} /> Añadir contacto
              </button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => addPerson(type)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px dashed var(--border)', color: 'var(--text-3)', padding: '0.75rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', width: '100%', justifyContent: 'center' }}>
          <Plus size={16} /> Agregar {type === 'debtors' ? 'otro deudor' : 'codeudor'}
        </button>
      </div>
    );
  };

  return (
    <div className="create-obligation-page" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '20rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <Link to="/portfolios/$portfolioId" params={{ portfolioId }} style={{ color: 'var(--text-3)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <ChevronLeft size={16} /> Volver a {portfolio?.nombreEntidad || 'Cartera'}
        </Link>
      </div>

      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600 }}>Nueva Obligación</h1>
        <p style={{ color: 'var(--text-4)', fontSize: '0.9rem' }}>Llene los campos para registrar un nuevo proceso jurídico.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* SECCIÓN 1: DEUDORES */}
        <div className="form-card" style={{ position: 'relative', zIndex: 40, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <div 
            className="form-section-header" 
            onClick={() => toggleSection('debtors')}
            style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ background: 'var(--accent)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>1</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Deudor(es)</h3>
            </div>
            {openSections.debtors ? <ChevronUp size={20} color="var(--text-3)" /> : <ChevronDown size={20} color="var(--text-3)" />}
          </div>
          
          {openSections.debtors && renderPersonForm('debtors')}
        </div>

        {/* SECCIÓN 2: CODEUDORES */}
        <div className="form-card" style={{ position: 'relative', zIndex: 30, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <div 
            className="form-section-header" 
            onClick={() => toggleSection('codebtors')}
            style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ background: 'var(--text-4)', color: 'var(--bg)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>2</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Codeudor(es)</h3>
            </div>
            {openSections.codebtors ? <ChevronUp size={20} color="var(--text-3)" /> : <ChevronDown size={20} color="var(--text-3)" />}
          </div>
          
          {openSections.codebtors && renderPersonForm('codebtors')}
        </div>

        {/* SECCIÓN 3: DATOS CRÉDITO */}
        <div className="form-card" style={{ position: 'relative', zIndex: 20, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '1.5rem' }}>
          <div 
            className="form-section-header" 
            onClick={() => toggleSection('credit')}
            style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ background: 'var(--accent)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>3</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Datos del Crédito</h3>
            </div>
            {openSections.credit ? <ChevronUp size={20} color="var(--text-3)" /> : <ChevronDown size={20} color="var(--text-3)" />}
          </div>
          
          {openSections.credit && (
            <div className="form-section-body" style={{ padding: '1.5rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Departamento — filtra municipios */}
                <div className="form-group">
                  <label className="form-label">Departamento</label>
                  <SearchableSelect
                    options={(departamentos ?? []).map((d) => ({ value: d.id, label: d.nombre }))}
                    value={departamentoIdObligacion}
                    onChange={handleDepartamentoObligacionChange}
                    placeholder="Buscar departamento..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Municipio *</label>
                  <SearchableSelect
                    options={filteredMunicipalities.map((m) => ({ value: m.id, label: m.nombre }))}
                    value={formData.municipalityId}
                    onChange={(value) => setFormData({ ...formData, municipalityId: value })}
                    placeholder={departamentoIdObligacion ? 'Buscar municipio...' : 'Seleccione depto. primero'}
                    disabled={!departamentoIdObligacion}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nro. Crédito *</label>
                  <input type="text" className="form-input" required
                    value={formData.creditNumber} onChange={e => setFormData({...formData, creditNumber: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Nro. Pagaré</label>
                  <input type="text" className="form-input"
                    value={formData.promissoryNoteNumber} onChange={e => setFormData({...formData, promissoryNoteNumber: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Saldo Capital Demandado *</label>
                  <input type="number" step="0.01" className="form-input" required
                    value={formData.capitalBalance} onChange={e => setFormData({...formData, capitalBalance: e.target.value})} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECCIÓN 4: PROCESO JURÍDICO */}
        <div className="form-card" style={{ position: 'relative', zIndex: 10, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '2.5rem' }}>
          <div 
            className="form-section-header" 
            onClick={() => toggleSection('process')}
            style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ background: 'var(--accent)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>4</span>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Proceso Jurídico</h3>
            </div>
            {openSections.process ? <ChevronUp size={20} color="var(--text-3)" /> : <ChevronDown size={20} color="var(--text-3)" />}
          </div>
          
          {openSections.process && (
            <div className="form-section-body" style={{ padding: '1.5rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Estado Actual</label>
                  <select className="form-input" value={formData.statusId} onChange={e => setFormData({...formData, statusId: e.target.value})}>
                    <option value="">Seleccione un estado...</option>
                    {estados?.map(est => <option key={est.id} value={est.id}>{est.nombre}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Nivel de Recuperación</label>
                  <select className="form-input" value={formData.recoveryLevelId} onChange={e => setFormData({...formData, recoveryLevelId: e.target.value})}>
                    <option value="">Seleccione un nivel...</option>
                    {niveles?.map(niv => <option key={niv.id} value={niv.id}>{niv.nombre}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Juzgado</label>
                  <SearchableSelect 
                    options={juzgados?.map(juz => ({ value: juz.id, label: juz.nombre || '' })) || []}
                    value={formData.courtId}
                    onChange={(value: string) => setFormData({...formData, courtId: value})}
                    placeholder="Buscar juzgado..."
                    allowCreate
                    isCreating={isCreatingJuzgado}
                    onCreate={(typedValue) => {
                      // Abre el mini-modal pre-rellenando el nombre que escribió el usuario
                      setQuickJuzgadoNombre(typedValue.toUpperCase());
                      setQuickJuzgadoDepto('');
                      setQuickJuzgadoMunicipio('');
                      setQuickJuzgadoModal(true);
                    }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Medida Cautelar</label>
                  <select className="form-input" value={formData.precautionaryMeasureId} onChange={e => setFormData({...formData, precautionaryMeasureId: e.target.value})}>
                    <option value="">Seleccione una medida...</option>
                    {medidas?.map(med => <option key={med.id} value={med.id}>{med.nombre}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Radicado</label>
                  <input type="text" className="form-input" placeholder="ej. 2024-00123-00"
                    value={formData.docketNumber} onChange={e => setFormData({...formData, docketNumber: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Fecha Asignación (Reparto)</label>
                  <input type="date" className="form-input"
                    value={formData.intakeDate} onChange={e => setFormData({...formData, intakeDate: e.target.value})} />
                </div>
              </div>

              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-3)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Hitos del Proceso</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Presentación Demanda</label>
                  <input type="date" className="form-input"
                    value={formData.lawsuitDate} onChange={e => setFormData({...formData, lawsuitDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Mandamiento de Pago</label>
                  <input type="date" className="form-input"
                    value={formData.paymentOrderDate} onChange={e => setFormData({...formData, paymentOrderDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Auto Seguir Adelante Ejecución</label>
                  <input type="date" className="form-input"
                    value={formData.proceedExecutionDate} onChange={e => setFormData({...formData, proceedExecutionDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Liquidación Crédito Aprobada</label>
                  <input type="date" className="form-input"
                    value={formData.creditLiquidationDate} onChange={e => setFormData({...formData, creditLiquidationDate: e.target.value})} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="button" className="btn-secondary" onClick={() => navigate({ to: '/portfolios/$portfolioId', params: { portfolioId } })}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={isPending || hasContactErrors() || !formData.creditNumber || !formData.capitalBalance || !formData.municipalityId || !debtors[0]?.documentId}>
            {isPending ? 'Guardando...' : <><Save size={16} /> Crear Obligación</>}
          </button>
        </div>
      </form>

      {/* Mini-modal creación rápida de juzgado — fuera del form para evitar bugs de z-index */}
      {typeof document !== 'undefined' && createPortal(
        quickJuzgadoModal ? (
          <div className="modal-overlay" style={{ zIndex: 10000 }}>
            <div className="modal" style={{ maxWidth: '460px' }}>
              <div className="modal-header">
                <h3 className="modal-title">Crear nuevo juzgado</h3>
                <button className="icon-btn" onClick={() => setQuickJuzgadoModal(false)}><X size={18} /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre *</label>
                  <input
                    type="text"
                    className="form-input"
                    autoFocus
                    placeholder="ej. JUZGADO PRIMERO CIVIL DEL CIRCUITO"
                    value={quickJuzgadoNombre}
                    onChange={(e) => setQuickJuzgadoNombre(e.target.value.toUpperCase())}
                  />
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', margin: '0.25rem 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <MapPin size={13} /> Ubicación (opcional)
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Departamento</label>
                    <SearchableSelect
                      options={(departamentos ?? []).map((d) => ({ value: d.id, label: d.nombre }))}
                      value={quickJuzgadoDepto}
                      onChange={(v) => { setQuickJuzgadoDepto(v); setQuickJuzgadoMunicipio(''); }}
                      placeholder="Buscar..."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Municipio</label>
                    <SearchableSelect
                      options={quickJuzgadoMunicipios.map((m) => ({ value: m.id, label: m.nombre }))}
                      value={quickJuzgadoMunicipio}
                      onChange={(v) => setQuickJuzgadoMunicipio(v)}
                      placeholder={quickJuzgadoDepto ? 'Buscar...' : 'Seleccione depto.'}
                      disabled={!quickJuzgadoDepto}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ marginTop: 0 }}>
                <button className="btn-secondary" onClick={() => setQuickJuzgadoModal(false)}>Cancelar</button>
                <button
                  className="btn-primary"
                  disabled={!quickJuzgadoNombre.trim() || isCreatingJuzgado}
                  onClick={async () => {
                    try {
                      const newJuzgado = await createJuzgado({
                        nombre: quickJuzgadoNombre,
                        departamentoId: quickJuzgadoDepto || undefined,
                        municipioId: quickJuzgadoMunicipio || undefined,
                      });
                      setFormData((f) => ({ ...f, courtId: newJuzgado.id }));
                      setQuickJuzgadoModal(false);
                    } catch (err) {
                      console.error('Error al crear juzgado', err);
                    }
                  }}
                >
                  {isCreatingJuzgado ? 'Creando...' : <><Plus size={14} /> Crear Juzgado</>}
                </button>
              </div>
            </div>
          </div>
        ) : null,
        document.body
      )}
    </div>
  );
}
