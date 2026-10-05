import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

/**
 * CyberSelect
 * Reusable, ultra-premium cyber dropdown component.
 * Replaces native HTML <select> with a modern, glassmorphic dropdown list:
 * - 100% immune to OS white-on-white dropdown bugs
 * - In-menu quick search for long lists (e.g. all 38 districts)
 * - Custom glowing cyber scrollbars
 * - Rich option labels with counts and checkmarks
 *
 * Props:
 * - value: string | number
 * - onChange: (value: any) => void
 * - options: Array<{ value: any, label: string, count?: number, badge?: string, icon?: any }> | Array<string>
 * - placeholder?: string
 * - icon?: React.ReactNode (leading icon in trigger)
 * - searchable?: boolean (defaults to true if options > 6)
 * - searchPlaceholder?: string
 * - disabled?: boolean
 * - style?: React.CSSProperties (applied to outer container)
 * - triggerStyle?: React.CSSProperties
 * - menuStyle?: React.CSSProperties
 * - className?: string
 */
export default function CyberSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select option...',
  icon = null,
  searchable = undefined,
  searchPlaceholder = 'Type to filter options...',
  disabled = false,
  style = {},
  triggerStyle = {},
  menuStyle = {},
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Normalize options into { value, label, count } format
  const normalizedOptions = options.map(opt => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value !== undefined ? opt.value : opt.label,
        label: opt.label !== undefined ? opt.label : String(opt.value),
        count: opt.count,
        badge: opt.badge,
        icon: opt.icon
      };
    }
    return { value: opt, label: String(opt) };
  });

  // Determine if searchable
  const isSearchable = searchable !== undefined ? searchable : normalizedOptions.length > 6;

  // Filter options by search term
  const filteredOptions = normalizedOptions.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(opt.value).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Currently selected option object
  const selectedOption = normalizedOptions.find(opt => opt.value === value);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus search input when menu opens
  useEffect(() => {
    if (isOpen && isSearchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, isSearchable]);

  const handleSelect = (optValue) => {
    onChange(optValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div
      ref={containerRef}
      className={`cyber-select-wrapper ${className}`}
      style={{
        position: 'relative',
        display: 'inline-block',
        width: '100%',
        userSelect: 'none',
        ...style
      }}
    >
      {/* ── TRIGGER BUTTON ── */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          background: '#0B132B',
          backgroundColor: '#0B132B',
          border: isOpen ? '1px solid #00F2FE' : '1px solid rgba(0, 242, 254, 0.35)',
          borderRadius: '8px',
          padding: '8px 12px',
          color: '#F8FAFC',
          fontSize: '12.5px',
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          boxShadow: isOpen
            ? '0 0 16px rgba(0, 242, 254, 0.4), inset 0 1px 2px rgba(0,0,0,0.5)'
            : '0 2px 8px rgba(0, 0, 0, 0.35)',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          opacity: disabled ? 0.5 : 1,
          ...triggerStyle
        }}
        onMouseEnter={(e) => {
          if (!isOpen && !disabled) {
            e.currentTarget.style.borderColor = '#00F2FE';
            e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 242, 254, 0.25)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen && !disabled) {
            e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.35)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.35)';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {icon && <span style={{ color: '#00F2FE', display: 'flex', flexShrink: 0 }}>{icon}</span>}
          <span style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: selectedOption ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)'
          }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption && selectedOption.count !== undefined && (
            <span style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: '#38BDF8',
              background: 'rgba(0, 242, 254, 0.12)',
              padding: '1px 6px',
              borderRadius: '10px',
              flexShrink: 0
            }}>
              {selectedOption.count}
            </span>
          )}
        </div>

        <ChevronDown
          size={15}
          style={{
            color: '#00F2FE',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0
          }}
        />
      </button>

      {/* ── FLOATING DROPDOWN MENU ── */}
      {isOpen && (
        <div
          className="cyber-dropdown-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 99999,
            background: 'linear-gradient(180deg, #0B132B 0%, #060914 100%)',
            border: '1px solid rgba(0, 242, 254, 0.45)',
            borderRadius: '10px',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.85), 0 0 25px rgba(0, 242, 254, 0.18)',
            backdropFilter: 'blur(20px)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            ...menuStyle
          }}
        >
          {/* Quick Search Bar (if searchable) */}
          {isSearchable && (
            <div style={{
              padding: '8px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(15, 23, 42, 0.9)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                borderRadius: '6px',
                padding: '5px 8px'
              }}>
                <Search size={13} style={{ color: '#00F2FE', flexShrink: 0 }} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#FFFFFF',
                    fontSize: '11.5px',
                    fontFamily: 'inherit'
                  }}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.5)',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex'
                    }}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Scrollable Options List */}
          <div style={{
            maxHeight: '260px',
            overflowY: 'auto',
            padding: '4px'
          }}>
            {filteredOptions.length === 0 ? (
              <div style={{
                padding: '16px 12px',
                textAlign: 'center',
                fontSize: '11.5px',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                No matching options
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={String(opt.value)}
                    onClick={() => handleSelect(opt.value)}
                    className="cyber-dropdown-item"
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? '#00F2FE' : '#F8FAFC',
                      background: isSelected ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                      borderLeft: isSelected ? '3px solid #00F2FE' : '3px solid transparent'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      {opt.icon && <span style={{ flexShrink: 0 }}>{opt.icon}</span>}
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {opt.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      {opt.count !== undefined && (
                        <span style={{
                          fontSize: '10px',
                          fontFamily: 'var(--font-mono)',
                          color: isSelected ? '#00F2FE' : '#94A3B8',
                          background: isSelected ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                          padding: '1px 6px',
                          borderRadius: '8px'
                        }}>
                          {opt.count}
                        </span>
                      )}
                      {isSelected && <Check size={14} style={{ color: '#00F2FE' }} />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
