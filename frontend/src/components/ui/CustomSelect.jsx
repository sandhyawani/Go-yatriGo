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
  label = "",
  className = "",
  dropdownClassName = "",
  optionRenderer = null,
  placement = "auto",
  onChangeMode = "event" // "event" | "value"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [direction, setDirection] = useState("down");
  const [isMobile, setIsMobile] = useState(false);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listboxRef = useRef(null);
  const buttonRef = useRef(null);

  // Detect mobile viewport (< 640px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery) return options;
    return options.filter(opt => {
      if (opt.options) return true; // Keep groups, filter sub-options below
      return String(opt.label || opt.value || opt).toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [options, searchable, searchQuery]);

  const flatOptions = useMemo(() => {
    return filteredOptions.reduce((acc, opt) => {
      if (opt.options) {
        return [...acc, ...opt.options.filter(subOpt => 
          !searchQuery || String(subOpt.label || subOpt.value || subOpt).toLowerCase().includes(searchQuery.toLowerCase())
        )];
      }
      return [...acc, opt];
    }, []).filter(opt => !opt.disabled);
  }, [filteredOptions, searchQuery]);

  // Use bottom sheet only on mobile AND if the list is long or explicitly searchable
  const shouldUseBottomSheet = isMobile && (searchable || options.length > 8);

  // Lock background body scroll when mobile bottom sheet is active
  useEffect(() => {
    if (!isOpen || !shouldUseBottomSheet) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, shouldUseBottomSheet]);

  const updateDropdownPosition = useCallback(() => {
    if (!containerRef.current || shouldUseBottomSheet) return;
    
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

    // Safeguard position to remain within viewport boundaries
    const viewportWidth = window.innerWidth;
    const desiredWidth = Math.min(rect.width, viewportWidth - 24);
    let leftPos = rect.left;
    if (leftPos + desiredWidth > viewportWidth - 12) {
      leftPos = Math.max(12, viewportWidth - desiredWidth - 12);
    }

    setDropdownStyle({
      position: 'fixed',
      width: `${desiredWidth}px`,
      left: `${leftPos}px`,
      top: openDirection === "down" ? `${rect.bottom + 6}px` : 'auto',
      bottom: openDirection === "up" ? `${window.innerHeight - rect.top + 6}px` : 'auto',
      maxHeight: `${Math.min(maxDropdownHeight, 350)}px`,
      zIndex: 1300
    });
  }, [placement, shouldUseBottomSheet]);

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
          searchInputRef.current?.focus();
        }, 80);
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
      // In bottom sheet mode, the backdrop handles outside clicks
      if (shouldUseBottomSheet) return;

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
  }, [isOpen, shouldUseBottomSheet]);

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

  const getOptionValue = useCallback((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      if (opt.value !== undefined) return opt.value;
      if (opt.id !== undefined) return opt.id;
      if (opt.label !== undefined) return opt.label;
      if (opt.name !== undefined) return opt.name;
    }
    return opt;
  }, []);

  const getOptionLabel = useCallback((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      if (opt.label !== undefined) return opt.label;
      if (opt.name !== undefined) return opt.name;
      if (opt.value !== undefined) return opt.value;
      if (opt.id !== undefined) return opt.id;
    }
    return opt;
  }, []);

  const handleSelect = (opt) => {
    if (opt.disabled) return;
    const optVal = getOptionValue(opt);

    if (typeof onChange === 'function') {
      if (onChangeMode === "value") {
        onChange(optVal, opt);
      } else {
        onChange({ target: { id, name: name || id, value: optVal } }, opt);
      }
    }

    setIsOpen(false);
    setSearchQuery("");
    buttonRef.current?.focus();
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (typeof onChange === 'function') {
      if (onChangeMode === "value") {
        onChange("", null);
      } else {
        onChange({ target: { id, name: name || id, value: "" } });
      }
    }
    setSearchQuery("");
    buttonRef.current?.focus();
  };

  const selectedOption = useMemo(() => {
    return flatOptions.find(
      opt => String(getOptionValue(opt)) === String(value)
    ) || value;
  }, [value, flatOptions, getOptionValue]);
  
  const displayLabel = value !== "" && value !== undefined && value !== null && selectedOption 
    ? getOptionLabel(selectedOption) 
    : placeholder;

  const titleText = label || placeholder || "Select Option";

  const renderOptionItem = (opt, index = -1, isGroup = false) => {
    if (isGroup) {
      return (
        <div key={`group-${opt.label || opt.name}`} className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-text-muted bg-slate-50/50">
          {opt.label || opt.name}
        </div>
      );
    }
    
    const isSelected = String(getOptionValue(opt)) === String(value);
    const isHighlighted = flatOptions.indexOf(opt) === highlightedIndex;
    
    return (
      <button
        key={String(getOptionValue(opt))}
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
          ${opt.disabled ? 'opacity-50 cursor-not-allowed text-text-muted' : 'cursor-pointer active:bg-brand/10'}
          ${isSelected ? 'bg-brand/10 text-brand font-bold' : 'text-text-primary hover:bg-slate-50 hover:text-brand-dark'}
          ${isHighlighted && !isSelected && !shouldUseBottomSheet ? 'bg-slate-50 text-brand-dark' : ''}
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
            shouldUseBottomSheet ? (
              /* Mobile Bottom Sheet Modal */
              <div className="fixed inset-0 z-[1290] flex items-end justify-center">
                {/* Backdrop */}
                <motion.div
                  key="bottom-sheet-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsOpen(false)}
                  className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-[1290]"
                />

                {/* Bottom Sheet Card */}
                <motion.div
                  key="bottom-sheet-content"
                  ref={listboxRef}
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 28, stiffness: 320 }}
                  role="listbox"
                  className={`relative z-[1300] w-full max-w-lg bg-white rounded-t-3xl shadow-2xl border-t border-slate-100 flex flex-col max-h-[80dvh] pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] ${dropdownClassName}`}
                >
                  {/* Drag / Indicator Handle */}
                  <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 mb-1 shrink-0" />

                  {/* Header */}
                  <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-text-primary font-heading truncate max-w-[240px]">
                        {titleText}
                      </h4>
                      <span className="text-[10px] font-bold text-text-muted bg-slate-100 px-2 py-0.5 rounded-full">
                        {flatOptions.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="p-1.5 text-text-muted hover:text-text-primary hover:bg-slate-100 rounded-lg transition-colors"
                      aria-label="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Sticky Search Field (Always present for long lists) */}
                  {(searchable || options.length > 8) && (
                    <div className="p-3 border-b border-slate-100 bg-slate-50/70 shrink-0">
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                        <input
                          ref={searchInputRef}
                          type="text"
                          className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand text-text-primary transition-all shadow-2xs"
                          placeholder={`Search ${titleText.toLowerCase()}...`}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Scrollable Option Items */}
                  <div className="overflow-y-auto py-1 overscroll-contain flex-1 min-h-0 divide-y divide-slate-100/60">
                    {filteredOptions.length === 0 ? (
                      <div className="px-4 py-8 text-center text-xs sm:text-sm text-text-muted">
                        No results found matching "{searchQuery}"
                      </div>
                    ) : (
                      filteredOptions.map((opt) => {
                        if (opt.options) {
                          return (
                            <div key={`group-container-${opt.label}`}>
                              {renderOptionItem(opt, -1, true)}
                              {opt.options
                                .filter(
                                  (subOpt) =>
                                    !searchQuery ||
                                    String(subOpt.label || subOpt.value || subOpt)
                                      .toLowerCase()
                                      .includes(searchQuery.toLowerCase())
                                )
                                .map((subOpt) => renderOptionItem(subOpt))}
                            </div>
                          );
                        }
                        return renderOptionItem(opt);
                      })
                    )}
                  </div>
                </motion.div>
              </div>
            ) : (
              /* Desktop Compact Popover / Short Mobile Menu */
              <motion.div
                key="custom-select-dropdown"
                ref={listboxRef}
                initial={{ opacity: 0, scale: 0.95, y: direction === "down" ? -8 : 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: direction === "down" ? -8 : 8 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                style={dropdownStyle}
                className={`bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col z-[1300] ${dropdownClassName}`}
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
                    filteredOptions.map((opt) => {
                      if (opt.options) {
                        return (
                          <div key={`group-container-${opt.label}`}>
                            {renderOptionItem(opt, -1, true)}
                            {opt.options
                              .filter(
                                (subOpt) =>
                                  !searchQuery ||
                                  String(subOpt.label || subOpt.value || subOpt)
                                    .toLowerCase()
                                    .includes(searchQuery.toLowerCase())
                              )
                              .map((subOpt) => renderOptionItem(subOpt))}
                          </div>
                        );
                      }
                      return renderOptionItem(opt);
                    })
                  )}
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default CustomSelect;
