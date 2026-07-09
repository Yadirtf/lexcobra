import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Calcula la posición del dropdown usando las coordenadas absolutas del trigger
  const updateDropdownPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const dropdownHeight = 280;

    // Si no hay espacio abajo, abre hacia arriba
    if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
      setDropdownStyle({
        position: 'fixed',
        top: rect.top - dropdownHeight - 4,
        left: rect.left,
        width: rect.width,
        zIndex: 99999,
      });
    } else {
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 99999,
      });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
    }
  }, [isOpen, updateDropdownPosition]);

  // Cierra si se hace click fuera del trigger o del dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current && !triggerRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    // Repositiona si el usuario hace scroll
    function handleScroll() {
      if (isOpen) updateDropdownPosition();
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen, updateDropdownPosition]);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exactMatch = options.some(
    (opt) => opt.label.toLowerCase() === searchTerm.toLowerCase().trim()
  );

  const dropdown = isOpen && !disabled && (
    <div
      ref={dropdownRef}
      style={{
        ...dropdownStyle,
        background: 'var(--surface)',
        border: '1px solid var(--border-2)',
        borderRadius: '10px',
        boxShadow: '0 16px 48px rgba(0, 0, 0, 0.35), 0 4px 16px rgba(0, 0, 0, 0.25)',
        maxHeight: '280px',
        display: 'flex',
        flexDirection: 'column',
        animation: 'fadeIn 0.15s ease',
        overflow: 'hidden',
      }}
    >
      {/* Buscador */}
      <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)', flexShrink: 0 }}>
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

      {/* Lista de opciones */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.25rem 0', background: 'var(--surface)' }}>
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
              background: value === opt.value ? 'var(--accent-xs)' : 'transparent',
              color: value === opt.value ? 'var(--accent)' : 'var(--text-2)',
              fontWeight: value === opt.value ? '600' : 'normal',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (value !== opt.value) e.currentTarget.style.background = 'var(--surface-2)';
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
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
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
  );

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={triggerRef}>
      {/* Trigger button */}
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

      {/* Dropdown renderizado en el body via Portal */}
      {typeof document !== 'undefined' && createPortal(dropdown, document.body)}
    </div>
  );
}
