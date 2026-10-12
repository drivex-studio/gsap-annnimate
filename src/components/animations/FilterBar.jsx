'use client';
import React, { useState, useEffect, useRef, forwardRef, Fragment } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { Funnel, GridFour, Columns, List, MagnifyingGlass, X } from '@phosphor-icons/react';
import { IconBase } from '@phosphor-icons/react'; 
import CloseIcon from '@/assets/icons/Icons';
import AnimatedNumber from '@/animations/components/AnimatedNumber';
import SegmentedControl from '@/animations/shared/SegmentedControl';
import { cn as cx } from '@/libs/utils/className';
import { useScrollLockContext } from '@/providers/ScrollLockProvider';

const CURSOR_CLICK_PATHS = new Map([
  ['bold', <Fragment key="bold"><path d="M224.15,179.17l-46.82-46.82,37.92-13.51c.26-.09.51-.19.76-.3a20,20,0,0,0-1.76-37.27L54.16,29A20,20,0,0,0,29,54.16L81.27,214.24A20,20,0,0,0,118.54,216c.11-.25.21-.5.3-.76l13.51-37.92,46.83,46.82a20,20,0,0,0,28.28,0l16.69-16.68A20,20,0,0,0,224.15,179.17Zm-30.83,25.17-48.48-48.48A20,20,0,0,0,130.7,150a20.47,20.47,0,0,0-3.73.35A20,20,0,0,0,112.35,162c-.11.25-.2.5-.3.76L100.4,195.5,54.29,54.29,195.5,100.4l-32.71,11.65c-.25.09-.51.19-.76.3a20,20,0,0,0-6.16,32.48h0l48.48,48.48ZM84,16V12a12,12,0,0,1,24,0v4a12,12,0,0,1-24,0ZM12,108a12,12,0,0,1,0-24h4a12,12,0,0,1,0,24ZM120.62,24.21l4-12a12,12,0,0,1,22.77,7.58l-4,12a12,12,0,0,1-22.77-7.58Zm-81.23,104a12,12,0,0,1-7.59,15.17l-12,4a12,12,0,1,1-7.59-22.76l12-4A12,12,0,0,1,39.39,128.21Z" /></Fragment>],
  ['duotone', <Fragment key="duotone"><path d="M213.66,201,201,213.66a8,8,0,0,1-11.31,0l-51.31-51.31a8,8,0,0,0-13,2.46l-17.82,46.41a8,8,0,0,1-14.85-.71L40.41,50.44a8,8,0,0,1,10-10L210.51,92.68a8,8,0,0,1,.71,14.85l-46.41,17.82a8,8,0,0,0-2.46,13l51.31,51.31A8,8,0,0,1,213.66,201Z" opacity="0.2" /><path d="M88,24V16a8,8,0,0,1,16,0v8a8,8,0,0,1-16,0ZM16,104h8a8,8,0,0,0,0-16H16a8,8,0,0,0,0,16ZM124.42,39.16a8,8,0,0,0,10.74-3.58l8-16a8,8,0,0,0-14.31-7.16l-8,16A8,8,0,0,0,124.42,39.16Zm-96,81.69-16,8a8,8,0,0,0,7.16,14.31l16-8a8,8,0,1,0-7.16-14.31ZM219.31,184a16,16,0,0,1,0,22.63l-12.68,12.68a16,16,0,0,1-22.63,0L132.7,168,115,214.09c0,.1-.08.21-.13.32a15.83,15.83,0,0,1-14.6,9.59l-.79,0a15.83,15.83,0,0,1-14.41-11L32.8,52.92A16,16,0,0,1,52.92,32.8L213,85.07a16,16,0,0,1,1.41,29.8l-.32.13L168,132.69ZM208,195.31,156.69,144h0a16,16,0,0,1,4.93-26l.32-.14,45.95-17.64L48,48l52.2,159.86,17.65-46c0-.11.08-.22.13-.33a16,16,0,0,1,11.69-9.34,16.72,16.72,0,0,1,3-.28,16,16,0,0,1,11.3,4.69L195.31,208Z" /></Fragment>],
  ['fill', <Fragment key="fill"><path d="M220.49,190.83a12,12,0,0,1,0,17L207.8,220.49a12,12,0,0,1-17,0l-56.56-56.57L115,214.09c0,.1-.08.21-.13.32a15.83,15.83,0,0,1-14.6,9.59l-.79,0a15.83,15.83,0,0,1-14.41-11L32.8,52.92A16,16,0,0,1,52.92,32.8L213,85.07a16,16,0,0,1,1.41,29.8l-.32.13-50.17,19.27ZM96,32a8,8,0,0,0,8-8V16a8,8,0,0,0-16,0v8A8,8,0,0,0,96,32ZM16,104h8a8,8,0,0,0,0-16H16a8,8,0,0,0,0,16ZM124.42,39.16a8,8,0,0,0,10.74-3.58l8-16a8,8,0,0,0-14.31-7.16l-8,16A8,8,0,0,0,124.42,39.16Zm-96,81.69-16,8a8,8,0,0,0,7.16,14.31l16-8a8,8,0,1,0-7.16-14.31Z" /></Fragment>],
  ['light', <Fragment key="light"><path d="M90,24V16a6,6,0,0,1,12,0v8a6,6,0,0,1-12,0ZM16,102h8a6,6,0,0,0,0-12H16a6,6,0,0,0,0,12ZM125.32,37.37a6,6,0,0,0,8.05-2.69l8-16a6,6,0,0,0-10.74-5.37l-8,16A6,6,0,0,0,125.32,37.37Zm-96,85.26-16,8a6,6,0,0,0,5.36,10.74l16-8a6,6,0,1,0-5.36-10.74ZM217.9,185.41a14,14,0,0,1,0,19.8L205.21,217.9a14,14,0,0,1-19.8,0L134.1,166.59a2,2,0,0,0-3.21.54l-17.75,46.24a2.44,2.44,0,0,0-.1.24A13.85,13.85,0,0,1,100.26,222c-.23,0-.45,0-.68,0A13.85,13.85,0,0,1,87,212.38L34.7,52.3A14,14,0,0,1,52.3,34.7L212.38,87A14,14,0,0,1,213.61,113l-.24.09-46.25,17.76a2,2,0,0,0-.53,3.21Zm-8.49,8.49L158.1,142.59h0a14,14,0,0,1,4.32-22.74l.24-.1L208.91,102a2,2,0,0,0-.26-3.61L48.58,46.11a2.33,2.33,0,0,0-.65-.11,2,2,0,0,0-1.82,2.58L98.38,208.65a1.84,1.84,0,0,0,1.77,1.35,1.81,1.81,0,0,0,1.84-1.09l17.76-46.25.1-.24a14,14,0,0,1,22.74-4.32l51.31,51.31a2,2,0,0,0,2.83,0l12.68-12.68A2,2,0,0,0,209.41,193.9Z" /></Fragment>],
  ['regular', <Fragment key="regular"><path d="M88,24V16a8,8,0,0,1,16,0v8a8,8,0,0,1-16,0ZM16,104h8a8,8,0,0,0,0-16H16a8,8,0,0,0,0,16ZM124.42,39.16a8,8,0,0,0,10.74-3.58l8-16a8,8,0,0,0-14.31-7.16l-8,16A8,8,0,0,0,124.42,39.16Zm-96,81.69-16,8a8,8,0,0,0,7.16,14.31l16-8a8,8,0,1,0-7.16-14.31ZM219.31,184a16,16,0,0,1,0,22.63l-12.68,12.68a16,16,0,0,1-22.63,0L132.7,168,115,214.09c0,.1-.08.21-.13.32a15.83,15.83,0,0,1-14.6,9.59l-.79,0a15.83,15.83,0,0,1-14.41-11L32.8,52.92A16,16,0,0,1,52.92,32.8L213,85.07a16,16,0,0,1,1.41,29.8l-.32.13L168,132.69ZM208,195.31,156.69,144h0a16,16,0,0,1,4.93-26l.32-.14,45.95-17.64L48,48l52.2,159.86,17.65-46c0-.11.08-.22.13-.33a16,16,0,0,1,11.69-9.34,16.72,16.72,0,0,1,3-.28,16,16,0,0,1,11.3,4.69L195.31,208Z" /></Fragment>],
  ['thin', <Fragment key="thin"><path d="M92,24V16a4,4,0,0,1,8,0v8a4,4,0,0,1-8,0ZM16,100h8a4,4,0,0,0,0-8H16a4,4,0,0,0,0,8ZM126.21,35.58a4,4,0,0,0,5.37-1.79l8-16a4,4,0,0,0-7.16-3.58l-8,16A4,4,0,0,0,126.21,35.58Zm-96,88.84-16,8a4,4,0,0,0,3.58,7.16l16-8a4,4,0,1,0-3.58-7.16Zm186.28,62.41a12,12,0,0,1,0,17L203.8,216.49a12,12,0,0,1-17,0l-51.31-51.31a3.93,3.93,0,0,0-3.58-1.11,4,4,0,0,0-2.89,2.27l-17.78,46.31a.77.77,0,0,1-.07.16A11.85,11.85,0,0,1,100.26,220h-.59a11.88,11.88,0,0,1-10.8-8.23L36.6,51.68A12,12,0,0,1,51.68,36.6L211.76,88.87a12,12,0,0,1,1.05,22.33l-.16.07-46.31,17.78a4,4,0,0,0-1.17,6.47Zm-5.66,5.66-51.31-51.32a12,12,0,0,1,3.7-19.49l.16-.06,46.31-17.79a3.95,3.95,0,0,0-.42-7.35L49.2,44.21a4,4,0,0,0-5,5L96.48,209.27a4,4,0,0,0,7.36.42l17.78-46.31a1.11,1.11,0,0,1,.07-.16,12,12,0,0,1,8.76-7,12.21,12.21,0,0,1,2.24-.21,12,12,0,0,1,8.49,3.52l51.31,51.31a4,4,0,0,0,5.65,0l12.69-12.69A4,4,0,0,0,210.83,192.49Z" /></Fragment>]
]);

const CursorClickIcon = forwardRef((props, ref) => (
  <IconBase ref={ref} {...props} weights={CURSOR_CLICK_PATHS} />
));
CursorClickIcon.displayName = 'CursorClickIcon';

export const VIEW_MODES = {
  GRID: 'grid',
  DUO: 'duo',
  LIST: 'list'
};

const VIEW_MODE_SESSION_KEY = 'annnimate_view_mode';

const VIEW_MODE_OPTIONS = [
  { id: VIEW_MODES.DUO, label: 'Duo view', Icon: Columns },
  { id: VIEW_MODES.GRID, label: 'Grid view', Icon: GridFour },
  { id: VIEW_MODES.LIST, label: 'List view', Icon: List }
];

function ActiveIndicator() {
  return (
    <span aria-hidden="true" className="size-8 shrink-0 bg-brand" />
  );
}

function MobileFilterSheet({
  open,
  onClose,
  activeFilters,
  flatCategoryOptions,
  onCategorySelect,
  interaction,
  interactionOptions,
  onInteractionSelect,
  freeOnly,
  onFreeChange,
  freeCount,
  sortBy,
  sortOptions,
  onSortChange,
  viewMode,
  onViewModeChange,
  allLabel = 'All categories',
  sheetTitle = 'Category'
}) {
  const { lockScroll, unlockScroll } = useScrollLockContext();

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    lockScroll();
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      unlockScroll();
    };
  }, [open, onClose, lockScroll, unlockScroll]);

  const stateStr = open ? 'open' : 'closed';

  return (
    <Fragment>
      <div 
        onClick={onClose} 
        data-state={stateStr} 
        data-lenis-prevent={true} 
        aria-hidden="true" 
        className={cx(
          'fixed inset-0 z-[199] bg-background/70 backdrop-blur-sm md:hidden',
          'transition-opacity duration-(--duration-snap) ease-(--ease-expo-out)',
          'data-[state=closed]:pointer-events-none data-[state=closed]:opacity-0',
          'data-[state=open]:opacity-100'
        )} 
      />
      
      <div 
        data-theme="dark" 
        data-state={stateStr} 
        data-lenis-prevent={true} 
        role="dialog" 
        aria-modal="true" 
        aria-label="Filters" 
        aria-hidden={!open} 
        className={cx(
          'fixed inset-x-0 bottom-0 z-[200] max-h-[85vh] overflow-y-auto overscroll-none bg-surface text-foreground md:hidden',
          'transition-transform duration-(--duration-snap) ease-(--ease-expo-out)',
          'data-[state=closed]:translate-y-full',
          'data-[state=open]:translate-y-0'
        )}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-foreground/10 bg-surface px-16 py-16">
          <h2 className="text-accent-xs text-foreground-muted">Filter & sort</h2>
          <button 
            type="button" 
            onClick={onClose} 
            aria-label="Close filters" 
            className="flex size-32 items-center justify-center text-foreground-muted transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:text-foreground"
          >
            <CloseIcon className="size-18" />
          </button>
        </div>
        
        <FilterSection title={sheetTitle}>
          <FilterOption label={allLabel} active={activeFilters.length === 0} onClick={() => onCategorySelect(null)} />
          {flatCategoryOptions.map(opt => (
            <FilterOption 
              key={opt.value} 
              label={opt.label} 
              count={opt.count} 
              active={activeFilters.includes(opt.value)} 
              onClick={() => onCategorySelect(opt.value)} 
            />
          ))}
        </FilterSection>
        
        {interactionOptions?.length > 0 && (
          <FilterSection title="Interaction">
            <FilterOption label="Any interaction" active={!interaction} onClick={() => onInteractionSelect(null)} />
            {interactionOptions.map(opt => (
              <FilterOption 
                key={opt.value} 
                label={opt.label} 
                count={opt.count} 
                active={interaction === opt.value} 
                onClick={() => onInteractionSelect(opt.value)} 
              />
            ))}
          </FilterSection>
        )}
        
        {onFreeChange && (
          <FilterSection title="Free components">
            <FilterOption label="All components" active={!freeOnly} onClick={() => onFreeChange(false)} />
            <FilterOption label="Free only" count={freeCount} active={freeOnly} onClick={() => onFreeChange(true)} />
          </FilterSection>
        )}
        
        <FilterSection title="Sort by">
          {sortOptions.map(opt => (
            <FilterOption 
              key={opt.value} 
              label={opt.label} 
              active={sortBy === opt.value} 
              onClick={() => onSortChange(opt.value)} 
            />
          ))}
        </FilterSection>
        
        <FilterSection title="View">
          <div className="grid grid-cols-3 gap-8">
            {VIEW_MODE_OPTIONS.map(({ id, label, Icon }) => {
              const isActive = viewMode === id;
              return (
                <button 
                  key={id} 
                  type="button" 
                  onClick={() => onViewModeChange(id)} 
                  aria-label={label} 
                  aria-pressed={isActive} 
                  className={cx(
                    'text-accent-xs flex items-center justify-center gap-8 px-12 py-14 transition-colors duration-(--duration-fast) ease-(--ease-expo-out)',
                    isActive ? 'bg-foreground/10 text-foreground' : 'text-foreground-muted hover:bg-foreground/5 hover:text-foreground'
                  )}
                >
                  <Icon className="size-16" />
                  <span>{label.replace(' view', '')}</span>
                </button>
              );
            })}
          </div>
        </FilterSection>
      </div>
    </Fragment>
  );
}

function FilterSection({ title, children }) {
  return (
    <section className="border-b border-foreground/10 px-16 py-16 last:border-b-0">
      <h3 className="text-accent-xs mb-12 text-foreground-muted">{title}</h3>
      <ul className="flex flex-col">
        {children}
      </ul>
    </section>
  );
}

function FilterOption({ label, count, active, onClick }) {
  return (
    <li>
      <button 
        type="button" 
        onClick={onClick} 
        className={cx(
          'text-body-sm flex w-full items-center justify-between gap-12 py-12 text-left transition-colors duration-(--duration-fast) ease-(--ease-expo-out)',
          active ? 'text-foreground' : 'text-foreground hover:text-foreground-muted'
        )}
      >
        <span>{label}</span>
        <span className="flex items-center gap-8">
          {count != null && <span className="text-accent-xs text-foreground-muted">{count}</span>}
          {active && <ActiveIndicator />}
        </span>
      </button>
    </li>
  );
}

function ViewModeSelector({ viewMode, onChange }) {
  return (
    <SegmentedControl activeId={viewMode} containerClassName="items-center" role="tablist">
      {VIEW_MODE_OPTIONS.map(({ id, label, Icon }) => {
        const isActive = viewMode === id;
        return (
          <button 
            key={id} 
            type="button" 
            data-flip-id={id} 
            onClick={() => onChange(id)} 
            aria-label={label} 
            aria-pressed={isActive} 
            role="tab" 
            className={cx(
              'relative z-10 flex size-48 items-center justify-center transition-colors duration-(--duration-fast) ease-(--ease-expo-out)',
              isActive ? 'text-foreground' : 'text-foreground-muted hover:text-foreground'
            )}
          >
            <Icon className="size-16" />
          </button>
        );
      })}
    </SegmentedControl>
  );
}

function DropdownMenu({ trigger, open, onOpenChange, children, menuClass = '' }) {
  const ref = useRef(null);
  
  useEffect(() => {
    if (!open) return;
    
    const handleMouseDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onOpenChange(false);
      }
    };
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={ref} className="relative flex items-stretch">
      {trigger}
      <div 
        data-state={open ? 'open' : 'closed'} 
        className={cx(
          'text-body-sm absolute bottom-full left-0 z-50 mb-2 min-w-[220px] origin-bottom overflow-hidden bg-surface text-foreground shadow-lg',
          'transition-[opacity,transform] duration-(--duration-snap) ease-(--ease-expo-out)',
          'data-[state=closed]:pointer-events-none data-[state=closed]:translate-y-4 data-[state=closed]:scale-95 data-[state=closed]:opacity-0',
          'data-[state=open]:translate-y-0 data-[state=open]:scale-100 data-[state=open]:opacity-100',
          menuClass
        )} 
        aria-hidden={!open}
      >
        {children}
      </div>
    </div>
  );
}

export default function FilterBar({
  activeFilters = [],
  onFiltersChange,
  interaction = null,
  onInteractionChange,
  interactionOptions = [],
  freeOnly = false,
  onFreeChange,
  freeCount = 0,
  sortBy = 'recent',
  onSortChange,
  viewMode = VIEW_MODES.GRID,
  onViewModeChange,
  searchValue = '',
  onSearchChange,
  filterOptions = [],
  sortOptions = [],
  count = 0,
  isAuthenticated = false,
  allLabel = 'All categories',
  searchPlaceholder = 'Search animations...'
}) {
  const searchInputRef = useRef(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isInteractionOpen, setIsInteractionOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes('MAC'));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const modifier = navigator.platform.toUpperCase().includes('MAC') ? e.metaKey : e.ctrlKey;
      if (modifier && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const cachedMode = sessionStorage.getItem(VIEW_MODE_SESSION_KEY);
    if (cachedMode && Object.values(VIEW_MODES).includes(cachedMode) && cachedMode !== viewMode) {
      onViewModeChange(cachedMode);
    }
  }, []);

  const handleViewModeSelect = (mode) => {
    sessionStorage.setItem(VIEW_MODE_SESSION_KEY, mode);
    onViewModeChange(mode);
  };

  const handleCategorySelect = (val) => {
    if (val === null || activeFilters.includes(val)) {
      onFiltersChange([]);
    } else {
      onFiltersChange([val]);
    }
    setIsCategoryOpen(false);
  };

  const handleInteractionSelect = (val) => {
    onInteractionChange?.(val === interaction ? null : val);
    setIsInteractionOpen(false);
  };

  const flatCategoryOptions = filterOptions.flatMap(group => group.options || []);
  const activeCategoryLabel = flatCategoryOptions.find(opt => opt.value === activeFilters[0])?.label || allLabel;
  const activeInteractionLabel = interactionOptions.find(opt => opt.value === interaction)?.label || 'Any interaction';
  const activeSortLabel = sortOptions.find(opt => opt.value === sortBy)?.label || 'Recent';

  return (
    <Fragment>
      <div className="pointer-events-none sticky bottom-24 z-[100] flex justify-center px-16">
        <div data-theme="dark" className="pointer-events-auto flex w-full max-w-full items-stretch bg-surface text-foreground md:w-auto">
          
          <div className="text-accent-xs hidden items-center gap-6 px-16 text-foreground-muted md:flex">
            <AnimatedNumber 
              value={count} 
              minDigits={1} 
              triggerMode="immediate" 
              duration={0.8} 
              valueChangeDuration={1.2} 
              ease="power3.inOut" 
              className="text-accent-xs leading-none" 
            />
            <span>matching</span>
          </div>
          
          <span aria-hidden="true" className="hidden w-px self-stretch bg-foreground/10 md:block" />
          
          <div className="hidden items-stretch md:flex">
            <DropdownMenu 
              open={isCategoryOpen} 
              onOpenChange={setIsCategoryOpen} 
              trigger={
                <button 
                  type="button" 
                  onClick={() => setIsCategoryOpen(prev => !prev)} 
                  className="text-accent-xs flex items-center gap-8 px-12 py-14 text-foreground transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:bg-foreground/10" 
                  aria-haspopup="listbox" 
                  aria-expanded={isCategoryOpen}
                >
                  <Funnel className="size-14 text-foreground-muted" />
                  <span className="truncate">{activeCategoryLabel}</span>
                  <CaretDown className={cx('size-14 text-foreground-muted transition-transform duration-(--duration-fast) ease-(--ease-expo-out)', isCategoryOpen && 'rotate-180')} />
                </button>
              }
            >
              <ul role="listbox" className="max-h-[60vh] overflow-y-auto py-4">
                <li>
                  <button 
                    type="button" 
                    onClick={() => handleCategorySelect(null)} 
                    className="flex w-full items-center justify-between gap-12 px-12 py-10 text-left text-foreground transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:bg-foreground/10"
                  >
                    <span>{allLabel}</span>
                    {activeFilters.length === 0 && <ActiveIndicator />}
                  </button>
                </li>
                <li aria-hidden="true" className="my-4 h-px bg-foreground/10" />
                {flatCategoryOptions.map(opt => (
                  <li key={opt.value}>
                    <button 
                      type="button" 
                      onClick={() => handleCategorySelect(opt.value)} 
                      className="flex w-full items-center justify-between gap-12 px-12 py-10 text-left text-foreground transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:bg-foreground/10"
                    >
                      <span>{opt.label}</span>
                      <span className="flex items-center gap-8">
                        {opt.count != null && <span className="text-accent-2xs text-foreground-muted">{opt.count}</span>}
                        {activeFilters.includes(opt.value) && <ActiveIndicator />}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </DropdownMenu>
            
            {activeFilters.length > 0 && (
              <button 
                type="button" 
                onClick={() => handleCategorySelect(null)} 
                aria-label="Clear category filter" 
                className="flex items-center px-8 text-foreground-muted transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:text-foreground"
              >
                <X className="size-14" />
              </button>
            )}
          </div>
          
          <span aria-hidden="true" className="hidden w-px self-stretch bg-foreground/10 md:block" />
          
          {interactionOptions.length > 0 && (
            <Fragment>
              <div className="hidden items-stretch md:flex">
                <DropdownMenu 
                  open={isInteractionOpen} 
                  onOpenChange={setIsInteractionOpen} 
                  trigger={
                    <button 
                      type="button" 
                      onClick={() => setIsInteractionOpen(prev => !prev)} 
                      className="text-accent-xs flex items-center gap-8 px-12 py-14 text-foreground transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:bg-foreground/10" 
                      aria-haspopup="listbox" 
                      aria-expanded={isInteractionOpen}
                    >
                      <CursorClickIcon className="size-14 text-foreground-muted" />
                      <span className="truncate">{activeInteractionLabel}</span>
                      <CaretDown className={cx('size-14 text-foreground-muted transition-transform duration-(--duration-fast) ease-(--ease-expo-out)', isInteractionOpen && 'rotate-180')} />
                    </button>
                  }
                >
                  <ul role="listbox" className="py-4">
                    <li>
                      <button 
                        type="button" 
                        onClick={() => handleInteractionSelect(null)} 
                        className="flex w-full items-center justify-between gap-12 px-12 py-10 text-left text-foreground transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:bg-foreground/10"
                      >
                        <span>Any interaction</span>
                        {!interaction && <ActiveIndicator />}
                      </button>
                    </li>
                    <li aria-hidden="true" className="my-4 h-px bg-foreground/10" />
                    {interactionOptions.map(opt => (
                      <li key={opt.value}>
                        <button 
                          type="button" 
                          onClick={() => handleInteractionSelect(opt.value)} 
                          className="flex w-full items-center justify-between gap-12 px-12 py-10 text-left text-foreground transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:bg-foreground/10"
                        >
                          <span>{opt.label}</span>
                          <span className="flex items-center gap-8">
                            {opt.count != null && <span className="text-accent-2xs text-foreground-muted">{opt.count}</span>}
                            {interaction === opt.value && <ActiveIndicator />}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </DropdownMenu>
                
                {interaction && (
                  <button 
                    type="button" 
                    onClick={() => handleInteractionSelect(null)} 
                    aria-label="Clear interaction filter" 
                    className="flex items-center px-8 text-foreground-muted transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:text-foreground"
                  >
                    <X className="size-14" />
                  </button>
                )}
              </div>
              <span aria-hidden="true" className="hidden w-px self-stretch bg-foreground/10 md:block" />
            </Fragment>
          )}
          
          {onFreeChange && (
            <Fragment>
              <button 
                type="button" 
                onClick={() => onFreeChange(!freeOnly)} 
                aria-pressed={freeOnly} 
                className="text-accent-xs hidden items-center gap-8 px-12 py-14 text-foreground transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:bg-foreground/10 md:flex"
              >
                <span>Free</span>
                {freeOnly ? <ActiveIndicator /> : <span className="text-accent-2xs text-foreground-muted">{freeCount}</span>}
              </button>
              <span aria-hidden="true" className="hidden w-px self-stretch bg-foreground/10 md:block" />
            </Fragment>
          )}
          
          <label className="relative flex flex-1 items-stretch md:flex-initial">
            <MagnifyingGlass 
              className="pointer-events-none absolute left-12 top-1/2 size-16 -translate-y-1/2 text-foreground-muted transition-colors duration-(--duration-fast) ease-(--ease-expo-out)" 
              aria-hidden="true" 
            />
            <input 
              ref={searchInputRef} 
              type="text" 
              value={searchValue} 
              onChange={(e) => onSearchChange(e.target.value)} 
              placeholder={searchPlaceholder} 
              className="text-body-sm h-full w-full bg-transparent py-14 pl-36 pr-64 text-foreground placeholder:text-foreground-muted transition-colors duration-(--duration-fast) ease-(--ease-expo-out) focus:outline-none md:min-w-[360px]" 
            />
            {searchValue ? (
              <button 
                type="button" 
                onClick={() => onSearchChange('')} 
                aria-label="Clear search" 
                className="absolute right-12 top-1/2 flex size-20 -translate-y-1/2 items-center justify-center text-foreground-muted transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:text-foreground"
              >
                <X className="size-14" />
              </button>
            ) : (
              <span aria-hidden="true" className="pointer-events-none absolute right-12 top-1/2 flex -translate-y-1/2 select-none items-center gap-4">
                <kbd className="text-accent-2xs flex h-20 min-w-20 items-center justify-center bg-foreground/10 px-4 font-medium text-foreground-muted">
                  {isMac ? '⌘' : 'Ctrl'}
                </kbd>
                <kbd className="text-accent-2xs flex h-20 min-w-20 items-center justify-center bg-foreground/10 px-4 font-medium text-foreground-muted">
                  K
                </kbd>
              </span>
            )}
          </label>
          
          <span aria-hidden="true" className="hidden w-px self-stretch bg-foreground/10 md:block" />
          
          <div className="hidden items-stretch md:flex">
            <DropdownMenu 
              open={isSortOpen} 
              onOpenChange={setIsSortOpen} 
              trigger={
                <button 
                  type="button" 
                  onClick={() => setIsSortOpen(prev => !prev)} 
                  className="text-accent-xs flex items-center gap-8 px-12 py-14 text-foreground transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:bg-foreground/10" 
                  aria-haspopup="listbox" 
                  aria-expanded={isSortOpen}
                >
                  <span className="truncate">{activeSortLabel}</span>
                  <CaretDown className={cx('size-14 text-foreground-muted transition-transform duration-(--duration-fast) ease-(--ease-expo-out)', isSortOpen && 'rotate-180')} />
                </button>
              }
            >
              <ul role="listbox" className="py-4">
                {sortOptions.map(opt => (
                  <li key={opt.value}>
                    <button 
                      type="button" 
                      onClick={() => { onSortChange(opt.value); setIsSortOpen(false); }} 
                      className="flex w-full items-center justify-between gap-12 px-12 py-10 text-left text-foreground transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:bg-foreground/10"
                    >
                      <span>{opt.label}</span>
                      {sortBy === opt.value && <ActiveIndicator />}
                    </button>
                  </li>
                ))}
              </ul>
            </DropdownMenu>
          </div>
          
          <span aria-hidden="true" className="hidden w-px self-stretch bg-foreground/10 md:block" />
          
          <div className="hidden items-stretch md:flex">
            <ViewModeSelector viewMode={viewMode} onChange={handleViewModeSelect} />
          </div>
          
          <span aria-hidden="true" className="w-px self-stretch bg-foreground/10 md:hidden" />
          
          <button 
            type="button" 
            onClick={() => setIsMobileFiltersOpen(true)} 
            className="text-accent-xs flex items-center gap-8 px-16 py-14 text-foreground transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:bg-foreground/10 md:hidden" 
            aria-label="Open filters"
          >
            <Funnel className="size-16 text-foreground-muted" />
            <span>Filter</span>
          </button>
          
          {activeFilters.length > 0 && (
            <button 
              type="button" 
              onClick={() => handleCategorySelect(null)} 
              aria-label="Clear category filter" 
              className="flex items-center pr-12 text-foreground-muted transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:text-foreground md:hidden"
            >
              <X className="size-14" />
            </button>
          )}
        </div>
      </div>
      
      <MobileFilterSheet 
        open={isMobileFiltersOpen} 
        onClose={() => setIsMobileFiltersOpen(false)} 
        activeFilters={activeFilters} 
        flatCategoryOptions={flatCategoryOptions} 
        onCategorySelect={handleCategorySelect} 
        interaction={interaction} 
        interactionOptions={interactionOptions} 
        onInteractionSelect={handleInteractionSelect} 
        freeOnly={freeOnly} 
        onFreeChange={onFreeChange} 
        freeCount={freeCount} 
        sortBy={sortBy} 
        sortOptions={sortOptions} 
        onSortChange={onSortChange} 
        viewMode={viewMode} 
        onViewModeChange={handleViewModeSelect} 
        allLabel={allLabel} 
        sheetTitle={filterOptions[0]?.label || 'Category'} 
      />
    </Fragment>
  );
}
