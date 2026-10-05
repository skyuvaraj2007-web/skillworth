import React, { useState, useEffect, useRef } from 'react';
import { Search, Building2, MapPin, Check, X, ChevronDown } from 'lucide-react';
import { searchColleges, getCollegeById, TN_COLLEGES } from '../services/collegeDirectory';

/**
 * CollegeAutocomplete
 * Reusable accessible autocomplete selector for Tamil Nadu College Directory.
 *
 * Props:
 * - value: string (collegeId of selected college, or collegeName)
 * - onSelect: (collegeObj | null) => void
 * - placeholder?: string
 * - label?: string
 * - required?: boolean
 * - disabled?: boolean
 */
export default function CollegeAutocomplete({
  value,
  onSelect,
  placeholder = 'Search your college or institution in Tamil Nadu...',
  label = 'INSTITUTION / COLLEGE *',
  required = false,
  disabled = false,
  error = ''
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedCollege, setSelectedCollege] = useState(null);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Sync with incoming value (could be a collegeId or college object)
  useEffect(() => {
    if (value) {
      const found = getCollegeById(value) || TN_COLLEGES.find(c => c.collegeName.toLowerCase() === String(value).toLowerCase());
      if (found) {
        setSelectedCollege(found);
        setSearchTerm(found.collegeName);
      } else if (typeof value === 'string') {
        setSearchTerm(value);
      }
    } else if (!value && selectedCollege) {
      setSelectedCollege(null);
      setSearchTerm('');
    }
  }, [value]);

  // Handle typing & fetching suggestions
  useEffect(() => {
    if (!isOpen) return;

    if (!searchTerm.trim()) {
      // Show popular/top colleges initially when empty and focused
      setSuggestions(TN_COLLEGES.slice(0, 7));
      setHighlightedIndex(-1);
      return;
    }

    const matches = searchColleges(searchTerm, 8);
    setSuggestions(matches);
    setHighlightedIndex(-1);
  }, [searchTerm, isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        // If user left with incomplete query and no selection, restore previous selected name
        if (selectedCollege) {
          setSearchTerm(selectedCollege.collegeName);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedCollege]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex]);
        } else if (suggestions.length === 1) {
          handleSelect(suggestions[0]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        if (selectedCollege) {
          setSearchTerm(selectedCollege.collegeName);
        }
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const handleSelect = (college) => {
    setSelectedCollege(college);
    setSearchTerm(college.collegeName);
    setIsOpen(false);
    if (onSelect) {
      onSelect(college);
    }
  };

  const handleClear = () => {
    setSelectedCollege(null);
    setSearchTerm('');
    setIsOpen(false);
    if (onSelect) {
      onSelect(null);
    }
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <label style={{
            display: 'block',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)'
          }}>
            {label}
          </label>
          {selectedCollege && (
            <span style={{
              fontSize: '10px',
              color: 'var(--cyber-emerald)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontFamily: 'var(--font-mono)'
            }}>
              <Check size={11} /> VERIFIED DIRECTORY INSTITUTION ({selectedCollege.collegeId})
            </span>
          )}
        </div>
      )}

      {/* Input container */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-input)',
        border: error ? '1px solid var(--cyber-rose)' : selectedCollege ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-subtle)',
        borderRadius: '8px',
        transition: 'all 0.2s ease',
        boxShadow: isOpen ? '0 0 12px rgba(0, 242, 254, 0.15)' : 'none'
      }}>
        <div style={{ paddingLeft: '12px', color: selectedCollege ? 'var(--cyber-cyan)' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
          {selectedCollege ? <Building2 size={16} /> : <Search size={16} />}
        </div>

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          required={required && !selectedCollege}
          disabled={disabled}
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (selectedCollege && e.target.value !== selectedCollege.collegeName) {
              setSelectedCollege(null);
              if (onSelect) onSelect(null);
            }
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            padding: '9px 10px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            lineHeight: 1.4
          }}
        />

        {searchTerm && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear college selection"
            style={{
              background: 'none',
              border: 'none',
              padding: '6px 8px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={14} />
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle suggestions dropdown"
          style={{
            background: 'none',
            border: 'none',
            paddingRight: '12px',
            paddingLeft: '4px',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
      </div>

      {error && (
        <div style={{ fontSize: '11px', color: 'var(--cyber-rose)', marginTop: '4px' }}>
          {error}
        </div>
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div
          ref={listRef}
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            background: '#0a101f',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            borderRadius: '10px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 242, 254, 0.1)',
            maxHeight: '260px',
            overflowY: 'auto',
            padding: '6px'
          }}
        >
          {suggestions.length > 0 ? (
            <div>
              <div style={{
                padding: '6px 10px',
                fontSize: '10px',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: '4px'
              }}>
                {searchTerm ? `Matching Colleges (${suggestions.length})` : 'Popular Tamil Nadu Colleges'}
              </div>

              {suggestions.map((col, idx) => {
                const isSelected = selectedCollege?.collegeId === col.collegeId;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={col.collegeId}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(col)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      background: isHighlighted ? 'rgba(0, 242, 254, 0.12)' : isSelected ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                      border: isHighlighted ? '1px solid rgba(0, 242, 254, 0.3)' : '1px solid transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '12.5px',
                        fontWeight: 600,
                        color: isSelected ? 'var(--cyber-cyan)' : 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {col.collegeName}
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '4px',
                        fontSize: '10.5px',
                        color: 'var(--text-muted)',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-secondary)' }}>
                          <MapPin size={10} /> {col.city || col.district}
                        </span>
                        <span>•</span>
                        <span>{col.institutionType}</span>
                        <span>•</span>
                        <span style={{
                          fontSize: '9.5px',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          background: col.tier === 'SKILLNEXUS Tier 1' ? 'rgba(0, 242, 254, 0.15)'
                            : col.tier === 'SKILLNEXUS Tier 2' ? 'rgba(168, 85, 247, 0.15)'
                            : col.tier === 'SKILLNEXUS Tier 3' ? 'rgba(59, 130, 246, 0.15)'
                            : 'rgba(255, 255, 255, 0.06)',
                          color: col.tier === 'SKILLNEXUS Tier 1' ? 'var(--cyber-cyan)'
                            : col.tier === 'SKILLNEXUS Tier 2' ? 'var(--cyber-purple)'
                            : col.tier === 'SKILLNEXUS Tier 3' ? '#60A5FA'
                            : 'var(--text-muted)',
                          border: col.tier === 'SKILLNEXUS Tier 1' ? '1px solid rgba(0, 242, 254, 0.3)'
                            : col.tier === 'SKILLNEXUS Tier 2' ? '1px solid rgba(168, 85, 247, 0.3)'
                            : '1px solid var(--border-subtle)'
                        }}>
                          {col.tier}
                        </span>
                        {col.universityAffiliation && (
                          <>
                            <span>•</span>
                            <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                              {col.universityAffiliation}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '9.5px' }}>
                        {col.collegeId}
                      </span>
                      {isSelected && (
                        <Check size={14} style={{ color: 'var(--cyber-emerald)', flexShrink: 0 }} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              padding: '16px 12px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '12px'
            }}>
              <Building2 size={24} style={{ margin: '0 auto 6px', opacity: 0.5 }} />
              <div>No Tamil Nadu college found matching "{searchTerm}"</div>
              <div style={{ fontSize: '10.5px', marginTop: '4px', color: 'var(--cyber-cyan)' }}>
                Try searching by city (e.g. Chennai, Coimbatore) or institution keyword (e.g. SRM, Anna, PSG)
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
