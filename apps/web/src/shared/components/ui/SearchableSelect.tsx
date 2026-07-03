import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, Plus } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  allowCreate?: boolean;
  onCreate?: (value: string) => void;
  isCreating?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Buscar...',
  disabled = false,
  allowCreate = false,
  onCreate,
  isCreating = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exactMatch = options.some(
    (opt) => opt.label.toLowerCase() === searchTerm.toLowerCase().trim()
  );

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={wrapperRef}>
      <div
        className="form-input"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          borderColor: isOpen ? 'var(--accent-h)' : 'var(--border)',
          transition: 'all 0.2s ease',
          userSelect: 'none'
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span style={{ 
          color: selectedOption ? 'var(--text)' : 'var(--text-3)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          paddingRight: '0.5rem',
          fontSize: '0.9rem'
        }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          style={{ 
            color: 'var(--text-3)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0
          }} 
        />
      </div>

      {isOpen && !disabled && (
        <div 
          style={{
            position: 'absolute',
            zIndex: 50,
            width: '100%',
            marginTop: '4px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
            maxHeight: '280px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.01)' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
              <input
                type="text"
                className="form-input"
                style={{ 
                  padding: '0.5rem 0.5rem 0.5rem 2.2rem', 
                  fontSize: '0.85rem',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
                placeholder="Escribe para buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          
          <div style={{ overflowY: 'auto', padding: '0.25rem 0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {filteredOptions.map((opt) => (
              <div
                key={opt.value}
                style={{
                  padding: '0.6rem 1rem',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: value === opt.value ? 'rgba(255,255,255,0.06)' : 'transparent',
                  color: value === opt.value ? 'var(--text)' : 'var(--text-2)',
                  fontWeight: value === opt.value ? '600' : 'normal',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (value !== opt.value) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }}
                onMouseLeave={(e) => {
                  if (value !== opt.value) e.currentTarget.style.background = 'transparent';
                }}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
              >
                {opt.label}
                {value === opt.value && <Check size={16} color="var(--accent)" />}
              </div>
            ))}

            {allowCreate && searchTerm.trim() !== '' && !exactMatch && (
              <div
                style={{
                  padding: '0.6rem 1rem',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'var(--accent)',
                  borderTop: filteredOptions.length > 0 ? '1px solid var(--border)' : 'none',
                  marginTop: filteredOptions.length > 0 ? '4px' : '0',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={() => {
                  if (onCreate && !isCreating) {
                    onCreate(searchTerm.trim());
                    setIsOpen(false);
                    setSearchTerm('');
                  }
                }}
              >
                <Plus size={16} />
                {isCreating ? 'Creando...' : <span>Crear <strong style={{ color: 'var(--text)', fontWeight: '600' }}>"{searchTerm.trim()}"</strong></span>}
              </div>
            )}

            {filteredOptions.length === 0 && (!allowCreate || searchTerm.trim() === '') && (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-4)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <Search size={24} opacity={0.3} />
                <span>No se encontraron resultados</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
