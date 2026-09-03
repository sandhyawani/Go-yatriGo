import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, Check, X } from 'lucide-react';

const CustomSelect = ({
  id,
  name,
  value,
  onChange,
  options = [],
  placeholder = "Select...",
  icon = null,
  disabled = false,
  searchable = false,
  clearable = false,
  loading = false,
  error = "",
  helperText = "",
  className = "",
  dropdownClassName = "",
  optionRenderer = null,
  placement = "auto"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [direction, setDirection] = useState("down");

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listboxRef = useRef(null);
  const buttonRef = useRef(null);

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery) return options;
    return options.filter(opt => {
      if (opt.options) return true; // Keep groups, we'll filter their items below
      return String(opt.label || opt).toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [options, searchable, searchQuery]);

  const flatOptions = useMemo(() => {
    return filteredOptions.reduce((acc, opt) => {
      if (opt.options) {
        return [...acc, ...opt.options.filter(subOpt => 
          !searchQuery || String(subOpt.label || subOpt).toLowerCase().includes(searchQuery.toLowerCase())
        )];
      }
      return [...acc, opt];
    }, []).filter(opt => !opt.disabled);
  }, [filteredOptions, searchQuery]);

  const updateDropdownPosition = useCallback(() => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    const minDropdownHeight = 150;
    
    let openDirection = placement === "auto" 
      ? (spaceBelow < minDropdownHeight && spaceAbove > spaceBelow ? "up" : "down")
      : placement;
      
    setDirection(openDirection);

    const availableSpace = openDirection === "down" ? spaceBelow - 20 : spaceAbove - 20;
    const maxDropdownHeight = Math.max(availableSpace, minDropdownHeight);

    setDropdownStyle({
      position: 'fixed',
      width: `${rect.width}px`,
      left: `${rect.left}px`,
      top: openDirection === "down" ? `${rect.bottom + 6}px` : 'auto',
      bottom: openDirection === "up" ? `${window.innerHeight - rect.top + 6}px` : 'auto',
      maxHeight: `${Math.min(maxDropdownHeight, 350)}px`,
      zIndex: 99999
    });
  }, [placement]);


  useLayoutEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      
      const handleScroll = (e) => {
        if (listboxRef.current && listboxRef.current.contains(e.target)) return;
        updateDropdownPosition();
      };

      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', updateDropdownPosition);
      
      if (searchable && searchInputRef.current) {
        setTimeout(() => {
          searchInputRef.current.focus();
        }, 50);
      }
      
      const selectedIdx = flatOptions.findIndex(opt => getOptionValue(opt) === value);
      setHighlightedIndex(selectedIdx !== -1 ? selectedIdx : 0);
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', updateDropdownPosition);
      };
    } else {
      setSearchQuery("");
    }
  }, [isOpen, updateDropdownPosition, searchable, value, flatOptions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target) &&
        listboxRef.current && 
        !listboxRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        if (!isOpen) {
          e.preventDefault();
          setIsOpen(true);
        } else if (isOpen && highlightedIndex >= 0 && highlightedIndex < flatOptions.length) {
          e.preventDefault();
          handleSelect(flatOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
          buttonRef.current?.focus();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => (prev < flatOptions.length - 1 ? prev + 1 : prev));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => (prev > 0 ? prev - 1 : 0));
        }
        break;
      case 'Tab':
        if (isOpen) setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const getOptionValue = (opt) => typeof opt === 'object' && opt !== null ? (opt.value !== undefined ? opt.value : opt.label) : opt;
  const getOptionLabel = (opt) => typeof opt === 'object' && opt !== null ? (opt.label !== undefined ? opt.label : opt.value) : opt;

  const handleSelect = (opt) => {
    if (opt.disabled) return;
    onChange({ target: { id, name: name || id, value: getOptionValue(opt) } }, opt);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange({ target: { id, name: name || id, value: "" } });
    buttonRef.current?.focus();
  };

  const selectedOption = useMemo(() => {
    return flatOptions.find(opt => getOptionValue(opt) === value) || value;
  }, [value, flatOptions]);
  
  const displayLabel = value !== "" && value !== undefined && value !== null && selectedOption 
    ? getOptionLabel(selectedOption) 
    : placeholder;

  const renderOptionItem = (opt, index = -1, isGroup = false) => {
    if (isGroup) {
      return (
        <div key={`group-${opt.label}`} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-text-muted bg-slate-50/50">
          {opt.label}
        </div>
      );
    }
    
    const isSelected = getOptionValue(opt) === value;
    const isHighlighted = flatOptions.indexOf(opt) === highlightedIndex;
    
    return (
      <button
        key={getOptionValue(opt)}
        type="button"
        role="option"
        aria-selected={isSelected}
        disabled={opt.disabled}
        onMouseEnter={() => setHighlightedIndex(flatOptions.indexOf(opt))}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleSelect(opt);
        }}
        className={`w-full flex items-center justify-between text-left px-4 min-h-[44px] py-2 text-xs sm:text-sm font-medium transition-colors outline-none
          ${opt.disabled ? 'opacity-50 cursor-not-allowed text-text-muted' : 'cursor-pointer'}
          ${isSelected ? 'bg-brand/10 text-brand font-bold' : 'text-text-primary hover:bg-brand/5/80 hover:text-brand-dark'}
          ${isHighlighted && !isSelected ? 'bg-brand/5 text-brand-dark' : ''}
        `}
      >
        <span className="truncate pr-4">
          {optionRenderer ? optionRenderer(opt) : getOptionLabel(opt)}
        </span>
        {isSelected && <Check className="w-4 h-4 shrink-0 text-brand" />}
      </button>
    );
  };

  return (
    <div className={`relative min-w-0 w-full ${className}`} ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-disabled={disabled}
        aria-invalid={!!error}
        disabled={disabled || loading}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`
          w-full flex items-center justify-between text-left h-[44px] pl-4 pr-4 bg-white border rounded-xl text-xs sm:text-sm font-bold outline-none transition-all shadow-xs group focus:border-brand focus:ring-2 focus:ring-brand/20
          ${disabled || loading ? 'opacity-60 cursor-not-allowed bg-slate-50' : 'hover:border-brand-300'}
          ${isOpen ? 'border-brand ring-2 ring-brand/20 bg-white' : error ? 'border-red-300' : 'border-slate-200 bg-slate-50/70'}
        `}
      >
        <div className="flex items-center gap-3 min-w-0 truncate">
          {icon && (
            <div className={`shrink-0 transition-colors ${isOpen ? 'text-brand' : (value !== "" && value !== undefined && value !== null) ? 'text-text-primary' : 'text-text-muted'}`}>
              {icon}
            </div>
          )}
          <span className={`truncate ${(value !== "" && value !== undefined && value !== null) ? 'text-text-primary' : 'text-text-muted font-semibold'}`}>
            {loading ? 'Loading...' : displayLabel}
          </span>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {clearable && (value !== "" && value !== undefined && value !== null) && !disabled && (
            <div 
              role="button"
              tabIndex={0}
              className="p-1 text-text-muted hover:text-text-secondary rounded-full hover:bg-background transition-colors"
              onClick={handleClear}
              onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') handleClear(e); }}
            >
              <X className="w-4 h-4" />
            </div>
          )}
          <ChevronDown className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand' : ''}`} />
        </div>
      </button>

      {error && <p className="mt-1.5 px-1 text-[10px] font-bold text-red-500">{error}</p>}
      {helperText && !error && <p className="mt-1.5 px-1 text-[10px] font-bold text-text-muted">{helperText}</p>}

      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="custom-select-dropdown"
              ref={listboxRef}
              initial={{ opacity: 0, scale: 0.95, y: direction === "down" ? -10 : 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: direction === "down" ? -10 : 10 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              style={dropdownStyle}
              className={`bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col ${dropdownClassName}`}
              role="listbox"
              onKeyDown={handleKeyDown}
            >
              {searchable && (
                <div className="p-2 border-b border-slate-100 bg-white sticky top-0 z-10">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border-none rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand/20 text-text-primary"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                          e.preventDefault();
                          handleKeyDown(e);
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="overflow-y-auto py-1 overscroll-contain flex-1 min-h-0">

                {filteredOptions.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-text-muted">
                    No options found
                  </div>
                ) : (
                  filteredOptions.map((opt, i) => {
                    if (opt.options) {
                      return (
                        <div key={`group-container-${opt.label}`}>
                          {renderOptionItem(opt, -1, true)}
                          {opt.options.filter(subOpt => 
                            !searchQuery || String(subOpt.label || subOpt).toLowerCase().includes(searchQuery.toLowerCase())
                          ).map((subOpt) => renderOptionItem(subOpt))}
                        </div>
                      );
                    }
                    return renderOptionItem(opt);
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default CustomSelect;
