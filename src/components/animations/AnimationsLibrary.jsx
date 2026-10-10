'use client';

import { useMemo, useState } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { cn } from '@/libs/utils/className';
import AnimationCard from '@/animations/components/AnimationCard';

const CATEGORY_LABELS = {
  button: 'Buttons',
  scroll: 'Scroll',
  'ui-component': 'UI Components',
  experimental: 'Experimental',
  shader: 'Shaders',
  menu: 'Menus',
  section: 'Sections',
};

function Chip({ active, onClick, children, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-accent-base inline-flex h-32 cursor-pointer items-center gap-8 border px-12 transition-colors duration-200',
        active
          ? 'border-foreground bg-foreground text-background'
          : 'border-foreground/15 bg-transparent text-foreground-muted hover:text-foreground'
      )}
    >
      {children}
      {count != null && <span className="text-accent-2xs opacity-60">{count}</span>}
    </button>
  );
}

export default function AnimationsLibrary({ animations = [] }) {
  const [category, setCategory] = useState(null);
  const [query, setQuery] = useState('');

  const categories = useMemo(() => {
    const counts = {};
    animations.forEach((a) => {
      counts[a.category] = (counts[a.category] || 0) + 1;
    });
    return Object.keys(CATEGORY_LABELS)
      .filter((slug) => counts[slug])
      .map((slug) => ({ slug, label: CATEGORY_LABELS[slug], count: counts[slug] }));
  }, [animations]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return animations.filter((a) => {
      if (category && a.category !== category) return false;
      if (!q) return true;
      return (
        a.title?.toLowerCase().includes(q) ||
        a.category?.toLowerCase().includes(q) ||
        a.slug?.toLowerCase().includes(q)
      );
    });
  }, [animations, category, query]);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-16 pb-96 pt-120 lg:px-32 lg:pt-160">
      <header className="mb-32 flex flex-col gap-24 lg:mb-48">
        <div className="flex flex-wrap items-end justify-between gap-16">
          <div>
            <h1 className="text-h1 text-foreground">Library</h1>
            <p className="text-body mt-8 text-foreground-muted">
              {animations.length} {animations.length === 1 ? 'animation' : 'animations'}
            </p>
          </div>
          <label className="flex h-40 w-full items-center gap-8 border border-foreground/15 px-12 text-foreground-muted focus-within:border-foreground/40 sm:w-[280px]">
            <MagnifyingGlass className="size-16 shrink-0" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search animations"
              className="text-body-sm w-full border-0 bg-transparent text-foreground outline-none placeholder:text-foreground-muted/60"
            />
          </label>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-8">
            <Chip active={!category} onClick={() => setCategory(null)} count={animations.length}>
              All
            </Chip>
            {categories.map((c) => (
              <Chip
                key={c.slug}
                active={category === c.slug}
                onClick={() => setCategory(c.slug)}
                count={c.count}
              >
                {c.label}
              </Chip>
            ))}
          </div>
        )}
      </header>

      {items.length === 0 ? (
        <p className="text-body py-96 text-center text-foreground-muted">
          {animations.length === 0 ? 'No animations published yet.' : 'No animations match your filters.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-16 sm:grid-cols-2 lg:grid-cols-3 lg:gap-24">
          {items.map((animation, index) => (
            <AnimationCard
              key={animation.id}
              animation={animation}
              viewMode="grid"
              hideSave
              priority={index < 3}
            />
          ))}
        </div>
      )}
    </div>
  );
}
