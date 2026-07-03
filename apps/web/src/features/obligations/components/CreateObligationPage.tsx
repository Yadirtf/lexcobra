import { useState } from 'react';
import { useParams, useNavigate, Link } from '@tanstack/react-router';
import { ChevronLeft, ChevronDown, ChevronUp, Plus, Save, Trash2 } from 'lucide-react';
import { useCreateObligation } from '../api/obligations.js';
import { usePortfolios } from '../../portfolios/api/portfolios.js';
import { 
  useMunicipalities,
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

  const addContact = (type: 'debtors' | 'codebtors', personIndex: number) => {
    const list = type === 'debtors' ? [...debtors] : [...coDebtors];
    list[personIndex].contacts.push({ tipoContactoId: '', valor: '' });
    type === 'debtors' ? setDebtors(list) : setCoDebtors(list);
  };

  const handleContactChange = (type: 'debtors' | 'codebtors', personIndex: number, contactIndex: number, field: keyof ContactEntry, value: string) => {
    const list = type === 'debtors' ? [...debtors] : [...coDebtors];
    list[personIndex].contacts[contactIndex] = { ...list[personIndex].contacts[contactIndex], [field]: value };
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
          contacts: d.contacts.filter(c => c.tipoContactoId && c.valor).map(c => ({ ...c, esPrincipal: false }))
        })),
        coDebtors: coDebtors.filter(d => d.documentId && d.fullName).map(d => ({
          ...d,
          tipoIdentificacionId: d.tipoIdentificacionId || undefined,
          contacts: d.contacts.filter(c => c.tipoContactoId && c.valor).map(c => ({ ...c, esPrincipal: false }))
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
                <div key={cIndex} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <select 
                    className="form-input" style={{ width: '150px' }}
                    value={contact.tipoContactoId} 
                    onChange={e => handleContactChange(type, index, cIndex, 'tipoContactoId', e.target.value)}
                  >
                    <option value="">Tipo...</option>
                    {tiposContacto?.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </select>
                  <input 
                    type="text" className="form-input" style={{ flex: 1 }} placeholder="ej. 3001234567 o email@..."
                    value={contact.valor} 
                    onChange={e => handleContactChange(type, index, cIndex, 'valor', e.target.value)}
                  />
                  <button type="button" onClick={() => removeContact(type, index, cIndex)} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '0.25rem' }}>
                    <Trash2 size={16} />
                  </button>
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
    <div className="create-obligation-page" style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '4rem' }}>
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
        <div className="form-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '1.5rem', overflow: 'hidden' }}>
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
        <div className="form-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '1.5rem', overflow: 'hidden' }}>
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
        <div className="form-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '1.5rem', overflow: 'hidden' }}>
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
                <div className="form-group">
                  <label className="form-label">Municipio *</label>
                  <select 
                    className="form-input" 
                    required
                    value={formData.municipalityId} 
                    onChange={e => setFormData({...formData, municipalityId: e.target.value})}
                  >
                    <option value="">Seleccione un municipio</option>
                    {municipalities?.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECCIÓN 4: PROCESO JURÍDICO */}
        <div className="form-card" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '2.5rem', overflow: 'hidden' }}>
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
                    onCreate={async (nombre) => {
                      try {
                        const newJuzgado = await createJuzgado(nombre);
                        setFormData({...formData, courtId: newJuzgado.id});
                      } catch (error) {
                        console.error('Error al crear juzgado', error);
                      }
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
          <button type="submit" className="btn-primary" disabled={isPending || !formData.creditNumber || !formData.capitalBalance || !formData.municipalityId || !debtors[0]?.documentId}>
            {isPending ? 'Guardando...' : <><Save size={16} /> Crear Obligación</>}
          </button>
        </div>
      </form>
    </div>
  );
}
