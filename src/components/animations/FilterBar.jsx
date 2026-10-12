"use client";

import React, { useState, useEffect, useRef, Fragment } from 'react';
import { Funnel, CaretDown, X } from '@phosphor-icons/react';
import { Columns, GridFour, List } from '@phosphor-icons/react';
import { MagnifyingGlass } from '@phosphor-icons/react';

import { cn } from '@/libs/utils/className';
import AnimatedCounter from '@/animations/components/AnimatedNumber';
import AnimatedTabGroup from '@/animations/components/AnimatedTabGroup';
import { useScrollLockContext } from '@/providers/ScrollLockProvider';
import CursorClickIcon from '@/assets/icons/CursorClickIcon';

export const VIEW_MODES = {
  GRID: "grid",
  DUO: "duo",
  LIST: "list"
};

const VIEW_MODE_STORAGE_KEY = "annnimate_view_mode";

const VIEW_MODE_OPTIONS = [
  { id: VIEW_MODES.DUO, label: "Duo view", Icon: Columns },
  { id: VIEW_MODES.GRID, label: "Grid view", Icon: GridFour },
  { id: VIEW_MODES.LIST, label: "List view", Icon: List }
];

function ActiveDot() {
  return <span aria-hidden="true" className="size-8 shrink-0 bg-brand" />;
}

function DropdownWrapper({ trigger, open, onOpenChange, children, menuClass = "" }) {
  let containerRef = useRef(null);
  
  useEffect(() => {
    if (!open) return;
    let handleMouseDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) onOpenChange(false);
    };
    let handleKeyDown = (e) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={containerRef} className="relative flex items-stretch">
      {trigger}
      <div
        data-state={open ? "open" : "closed"}
        className={cn(
          "text-body-sm absolute bottom-full left-0 z-50 mb-2 min-w-[220px] origin-bottom overflow-hidden bg-surface text-foreground shadow-lg",
          "transition-[opacity,transform] duration-(--duration-snap) ease-(--ease-expo-out)",
          "data-[state=closed]:pointer-events-none data-[state=closed]:translate-y-4 data-[state=closed]:scale-95 data-[state=closed]:opacity-0",
          "data-[state=open]:translate-y-0 data-[state=open]:scale-100 data-[state=open]:opacity-100",
          menuClass
        )}
        aria-hidden={!open}
      >
        {children}
      </div>
    </div>
  );
}

function ViewModeToggle({ viewMode, onChange }) {
  return (
    <AnimatedTabGroup activeId={viewMode} containerClassName="items-center" role="tablist">
      {VIEW_MODE_OPTIONS.map(({ id, label, Icon }) => {
        let isActive = viewMode === id;
        return (
          <button
            key={id}
            type="button"
            data-flip-id={id}
            onClick={() => onChange(id)}
            aria-label={label}
            aria-pressed={isActive}
            role="tab"
            className={cn(
              "relative z-10 flex size-48 items-center justify-center transition-colors duration-(--duration-fast) ease-(--ease-expo-out)",
              isActive ? "text-foreground" : "text-foreground-muted hover:text-foreground"
            )}
          >
            <Icon className="size-16" />
          </button>
        );
      })}
    </AnimatedTabGroup>
  );
}

function FilterSheetSection({ title, children }) {
  return (
    <section className="border-b border-foreground/10 px-16 py-16 last:border-b-0">
      <h3 className="text-accent-xs mb-12 text-foreground-muted">{title}</h3>
      <ul className="flex flex-col">{children}</ul>
    </section>
  );
}

function FilterSheetItem({ label, count, active, onClick }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "text-body-sm flex w-full items-center justify-between gap-12 py-12 text-left transition-colors duration-(--duration-fast) ease-(--ease-expo-out)",
          active ? "text-foreground" : "text-foreground hover:text-foreground-muted"
        )}
      >
        <span>{label}</span>
        <span className="flex items-center gap-8">
          {count != null && <span className="text-accent-xs text-foreground-muted">{count}</span>}
          {active && <ActiveDot />}
        </span>
      </button>
    </li>
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
  allLabel = "All categories",
  sheetTitle = "Category"
}) {
  let { lockScroll, unlockScroll } = useScrollLockContext();
  
  useEffect(() => {
    if (!open) return;
    let handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    lockScroll();
    return () => {
      document.removeEventListener("keydown", handleKey);
      unlockScroll();
    };
  }, [open, onClose, lockScroll, unlockScroll]);

  let stateAttr = open ? "open" : "closed";

  return (
    <Fragment>
      <div
        onClick={onClose}
        data-state={stateAttr}
        data-lenis-prevent={true}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-[199] bg-background/70 backdrop-blur-sm md:hidden",
          "transition-opacity duration-(--duration-snap) ease-(--ease-expo-out)",
          "data-[state=closed]:pointer-events-none data-[state=closed]:opacity-0",
          "data-[state=open]:opacity-100"
        )}
      />
      <div
        data-theme="dark"
        data-state={stateAttr}
        data-lenis-prevent={true}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        aria-hidden={!open}
        className={cn(
          "fixed inset-x-0 bottom-0 z-[200] max-h-[85vh] overflow-y-auto overscroll-none bg-surface text-foreground md:hidden",
          "transition-transform duration-(--duration-snap) ease-(--ease-expo-out)",
          "data-[state=closed]:translate-y-full",
          "data-[state=open]:translate-y-0"
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
            <X className="size-18" />
          </button>
        </div>
        
        <FilterSheetSection title={sheetTitle}>
          <FilterSheetItem label={allLabel} active={activeFilters.length === 0} onClick={() => onCategorySelect(null)} />
          {flatCategoryOptions.map(opt => (
            <FilterSheetItem
              key={opt.value}
              label={opt.label}
              count={opt.count}
              active={activeFilters.includes(opt.value)}
              onClick={() => onCategorySelect(opt.value)}
            />
          ))}
        </FilterSheetSection>

        {interactionOptions?.length > 0 && (
          <FilterSheetSection title="Interaction">
            <FilterSheetItem label="Any interaction" active={!interaction} onClick={() => onInteractionSelect(null)} />
            {interactionOptions.map(opt => (
              <FilterSheetItem
                key={opt.value}
                label={opt.label}
                count={opt.count}
                active={interaction === opt.value}
                onClick={() => onInteractionSelect(opt.value)}
              />
            ))}
          </FilterSheetSection>
        )}

        {onFreeChange && (
          <FilterSheetSection title="Free components">
            <FilterSheetItem label="All components" active={!freeOnly} onClick={() => onFreeChange(false)} />
            <FilterSheetItem label="Free only" count={freeCount} active={freeOnly} onClick={() => onFreeChange(true)} />
          </FilterSheetSection>
        )}

        <FilterSheetSection title="Sort by">
          {sortOptions.map(opt => (
            <FilterSheetItem
              key={opt.value}
              label={opt.label}
              active={sortBy === opt.value}
              onClick={() => onSortChange(opt.value)}
            />
          ))}
        </FilterSheetSection>

        <FilterSheetSection title="View">
          <div className="grid grid-cols-3 gap-8">
            {VIEW_MODE_OPTIONS.map(({ id, label, Icon }) => {
              let isActive = viewMode === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onViewModeChange(id)}
                  aria-label={label}
                  aria-pressed={isActive}
                  className={cn(
                    "text-accent-xs flex items-center justify-center gap-8 px-12 py-14 transition-colors duration-(--duration-fast) ease-(--ease-expo-out)",
                    isActive ? "bg-foreground/10 text-foreground" : "text-foreground-muted hover:bg-foreground/5 hover:text-foreground"
                  )}
                >
                  <Icon className="size-16" />
                  <span>{label.replace(" view", "")}</span>
                </button>
              );
            })}
          </div>
        </FilterSheetSection>
      </div>
    </Fragment>
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
  sortBy = "recent",
  onSortChange,
  viewMode = VIEW_MODES.GRID,
  onViewModeChange,
  searchValue = "",
  onSearchChange,
  filterOptions = [],
  sortOptions = [],
  count = 0,
  isAuthenticated = false,
  allLabel = "All categories",
  searchPlaceholder = "Search animations..."
}) {
  let searchInputRef = useRef(null);
  let [catOpen, setCatOpen] = useState(false);
  let [intOpen, setIntOpen] = useState(false);
  let [sortOpen, setSortOpen] = useState(false);
  let [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  let [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes("MAC"));
  }, []);

  useEffect(() => {
    let handleKeydown = (e) => {
      let isModifier = navigator.platform.toUpperCase().includes("MAC") ? e.metaKey : e.ctrlKey;
      if (isModifier && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, []);

  useEffect(() => {
    let storedMode = sessionStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (storedMode && Object.values(VIEW_MODES).includes(storedMode) && storedMode !== viewMode) {
      onViewModeChange(storedMode);
    }
  }, []);

  let handleViewModeChange = (mode) => {
    sessionStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    onViewModeChange(mode);
  };

  let handleCatSelect = (val) => {
    if (val === null || activeFilters.includes(val)) {
      onFiltersChange([]);
    } else {
      onFiltersChange([val]);
    }
    setCatOpen(false);
  };

  let handleIntSelect = (val) => {
    onInteractionChange?.(val === interaction ? null : val);
    setIntOpen(false);
  };

  let flatCatOptions = filterOptions.flatMap(group => group.options || []);
  let currentCatLabel = flatCatOptions.find(opt => opt.value === activeFilters[0])?.label || allLabel;
  let currentIntLabel = interactionOptions.find(opt => opt.value === interaction)?.label || "Any interaction";
  let currentSortLabel = sortOptions.find(opt => opt.value === sortBy)?.label || "Recent";

  return (
    <Fragment>
      <div className="pointer-events-none sticky bottom-24 z-[100] flex justify-center px-16">
        <div data-theme="dark" className="pointer-events-auto flex w-full max-w-full items-stretch bg-surface text-foreground md:w-auto">
          
          <div className="text-accent-xs hidden items-center gap-6 px-16 text-foreground-muted md:flex">
            <AnimatedCounter
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

          {}
          <div className="hidden items-stretch md:flex">
            <DropdownWrapper
              open={catOpen}
              onOpenChange={setCatOpen}
              trigger={
                <button
                  type="button"
                  onClick={() => setCatOpen(prev => !prev)}
                  className="text-accent-xs flex items-center gap-8 px-12 py-14 text-foreground transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:bg-foreground/10"
                  aria-haspopup="listbox"
                  aria-expanded={catOpen}
                >
                  <Funnel className="size-14 text-foreground-muted" />
                  <span className="truncate">{currentCatLabel}</span>
                  <CaretDown className={cn("size-14 text-foreground-muted transition-transform duration-(--duration-fast) ease-(--ease-expo-out)", catOpen && "rotate-180")} />
                </button>
              }
            >
              <ul role="listbox" className="max-h-[60vh] overflow-y-auto py-4">
                <li>
                  <button
                    type="button"
                    onClick={() => handleCatSelect(null)}
                    className="flex w-full items-center justify-between gap-12 px-12 py-10 text-left text-foreground transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:bg-foreground/10"
                  >
                    <span>{allLabel}</span>
                    {activeFilters.length === 0 && <ActiveDot />}
                  </button>
                </li>
                <li aria-hidden="true" className="my-4 h-px bg-foreground/10" />
                {flatCatOptions.map(opt => (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => handleCatSelect(opt.value)}
                      className="flex w-full items-center justify-between gap-12 px-12 py-10 text-left text-foreground transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:bg-foreground/10"
                    >
                      <span>{opt.label}</span>
                      <span className="flex items-center gap-8">
                        {opt.count != null && <span className="text-accent-2xs text-foreground-muted">{opt.count}</span>}
                        {activeFilters.includes(opt.value) && <ActiveDot />}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </DropdownWrapper>
            
            {activeFilters.length > 0 && (
              <button
                type="button"
                onClick={() => handleCatSelect(null)}
                aria-label="Clear category filter"
                className="flex items-center px-8 text-foreground-muted transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:text-foreground"
              >
                <X className="size-14" />
              </button>
            )}
          </div>
          <span aria-hidden="true" className="hidden w-px self-stretch bg-foreground/10 md:block" />

          {}
          {interactionOptions.length > 0 && (
            <Fragment>
              <div className="hidden items-stretch md:flex">
                <DropdownWrapper
                  open={intOpen}
                  onOpenChange={setIntOpen}
                  trigger={
                    <button
                      type="button"
                      onClick={() => setIntOpen(prev => !prev)}
                      className="text-accent-xs flex items-center gap-8 px-12 py-14 text-foreground transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:bg-foreground/10"
                      aria-haspopup="listbox"
                      aria-expanded={intOpen}
                    >
                      <CursorClickIcon className="size-14 text-foreground-muted" />
                      <span className="truncate">{currentIntLabel}</span>
                      <CaretDown className={cn("size-14 text-foreground-muted transition-transform duration-(--duration-fast) ease-(--ease-expo-out)", intOpen && "rotate-180")} />
                    </button>
                  }
                >
                  <ul role="listbox" className="py-4">
                    <li>
                      <button
                        type="button"
                        onClick={() => handleIntSelect(null)}
                        className="flex w-full items-center justify-between gap-12 px-12 py-10 text-left text-foreground transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:bg-foreground/10"
                      >
                        <span>Any interaction</span>
                        {!interaction && <ActiveDot />}
                      </button>
                    </li>
                    <li aria-hidden="true" className="my-4 h-px bg-foreground/10" />
                    {interactionOptions.map(opt => (
                      <li key={opt.value}>
                        <button
                          type="button"
                          onClick={() => handleIntSelect(opt.value)}
                          className="flex w-full items-center justify-between gap-12 px-12 py-10 text-left text-foreground transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:bg-foreground/10"
                        >
                          <span>{opt.label}</span>
                          <span className="flex items-center gap-8">
                            {opt.count != null && <span className="text-accent-2xs text-foreground-muted">{opt.count}</span>}
                            {interaction === opt.value && <ActiveDot />}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </DropdownWrapper>
                {interaction && (
                  <button
                    type="button"
                    onClick={() => handleIntSelect(null)}
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

          {}
          {onFreeChange && (
            <Fragment>
              <button
                type="button"
                onClick={() => onFreeChange(!freeOnly)}
                aria-pressed={freeOnly}
                className="text-accent-xs hidden items-center gap-8 px-12 py-14 text-foreground transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:bg-foreground/10 md:flex"
              >
                <span>Free</span>
                {freeOnly ? <ActiveDot /> : <span className="text-accent-2xs text-foreground-muted">{freeCount}</span>}
              </button>
              <span aria-hidden="true" className="hidden w-px self-stretch bg-foreground/10 md:block" />
            </Fragment>
          )}

          {}
          <label className="relative flex flex-1 items-stretch md:flex-initial">
            <MagnifyingGlass className="pointer-events-none absolute left-12 top-1/2 size-16 -translate-y-1/2 text-foreground-muted transition-colors duration-(--duration-fast) ease-(--ease-expo-out)" aria-hidden="true" />
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
                onClick={() => onSearchChange("")}
                aria-label="Clear search"
                className="absolute right-12 top-1/2 flex size-20 -translate-y-1/2 items-center justify-center text-foreground-muted transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:text-foreground"
              >
                <X className="size-14" />
              </button>
            ) : (
              <span aria-hidden="true" className="pointer-events-none absolute right-12 top-1/2 flex -translate-y-1/2 select-none items-center gap-4">
                <kbd className="text-accent-2xs flex h-20 min-w-20 items-center justify-center bg-foreground/10 px-4 font-medium text-foreground-muted">
                  {isMac ? "⌘" : "Ctrl"}
                </kbd>
                <kbd className="text-accent-2xs flex h-20 min-w-20 items-center justify-center bg-foreground/10 px-4 font-medium text-foreground-muted">
                  K
                </kbd>
              </span>
            )}
          </label>
          <span aria-hidden="true" className="hidden w-px self-stretch bg-foreground/10 md:block" />

          {}
          <div className="hidden items-stretch md:flex">
            <DropdownWrapper
              open={sortOpen}
              onOpenChange={setSortOpen}
              trigger={
                <button
                  type="button"
                  onClick={() => setSortOpen(prev => !prev)}
                  className="text-accent-xs flex items-center gap-8 px-12 py-14 text-foreground transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:bg-foreground/10"
                  aria-haspopup="listbox"
                  aria-expanded={sortOpen}
                >
                  <span className="truncate">{currentSortLabel}</span>
                  <CaretDown className={cn("size-14 text-foreground-muted transition-transform duration-(--duration-fast) ease-(--ease-expo-out)", sortOpen && "rotate-180")} />
                </button>
              }
            >
              <ul role="listbox" className="py-4">
                {sortOptions.map(opt => (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => { onSortChange(opt.value); setSortOpen(false); }}
                      className="flex w-full items-center justify-between gap-12 px-12 py-10 text-left text-foreground transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:bg-foreground/10"
                    >
                      <span>{opt.label}</span>
                      {sortBy === opt.value && <ActiveDot />}
                    </button>
                  </li>
                ))}
              </ul>
            </DropdownWrapper>
          </div>
          <span aria-hidden="true" className="hidden w-px self-stretch bg-foreground/10 md:block" />

          {}
          <div className="hidden items-stretch md:flex">
            <ViewModeToggle viewMode={viewMode} onChange={handleViewModeChange} />
          </div>

          <span aria-hidden="true" className="w-px self-stretch bg-foreground/10 md:hidden" />

          {}
          <button
            type="button"
            onClick={() => setMobileSheetOpen(true)}
            className="text-accent-xs flex items-center gap-8 px-16 py-14 text-foreground transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:bg-foreground/10 md:hidden"
            aria-label="Open filters"
          >
            <Funnel className="size-16 text-foreground-muted" />
            <span>Filter</span>
          </button>
          
          {}
          {activeFilters.length > 0 && (
            <button
              type="button"
              onClick={() => handleCatSelect(null)}
              aria-label="Clear category filter"
              className="flex items-center pr-12 text-foreground-muted transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:text-foreground md:hidden"
            >
              <X className="size-14" />
            </button>
          )}

        </div>
      </div>

      <MobileFilterSheet
        open={mobileSheetOpen}
        onClose={() => setMobileSheetOpen(false)}
        activeFilters={activeFilters}
        flatCategoryOptions={flatCatOptions}
        onCategorySelect={handleCatSelect}
        interaction={interaction}
        interactionOptions={interactionOptions}
        onInteractionSelect={handleIntSelect}
        freeOnly={freeOnly}
        onFreeChange={onFreeChange}
        freeCount={freeCount}
        sortBy={sortBy}
        sortOptions={sortOptions}
        onSortChange={onSortChange}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        allLabel={allLabel}
        sheetTitle={filterOptions[0]?.label || "Category"}
      />
    </Fragment>
  );
}
