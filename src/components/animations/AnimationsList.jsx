import React, { useMemo, useRef, useEffect, Fragment, useCallback } from 'react';
import Link from 'next/link';

import { BookmarkSimple } from '@phosphor-icons/react'; 
import { ArrowUpRight } from '@phosphor-icons/react';

import { bunnyImageUrl } from '@/libs/utils/bunnyImageUrl';
import { useAnimation } from '@/animations/hooks/useAnimation';

import AnimationCard from '@/animations/components/AnimationCard';
import MasonryGrid from '@/animations/shared/HoverFollowPreview';
import { VIEW_MODES } from '@/components/animations/FilterBar';

function isRecent(animation) {
  return !!animation?.published_at && Date.now() - new Date(animation.published_at).getTime() < 1209600000;
}

function isUpdated(animation) {
  return !!animation?.content_updated_at && !isRecent(animation) && Date.now() - new Date(animation.content_updated_at).getTime() < 604800000;
}

function AnimationListItem({
  animation,
  index,
  isAuthenticated,
  initialIsSaved,
  hrefBase = "/animations",
  hideSave = false
}) {
  let { id, title, slug, category } = animation;
  let recent = isRecent(animation);
  let updated = isUpdated(animation);
  
  let { isSaved, isLoading, toggleSave } = useAnimation(isAuthenticated ? id : null, initialIsSaved, isAuthenticated ? animation : null);
  
  let handleSaveClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSave?.(e);
  }, [toggleSave]);

  return (
    <li
      data-row-index={index}
      data-hfp-index={index}
      data-tile={true}
      className="animate-stagger-in group relative"
      style={{ animationDelay: `${(index % 12) * 0.04}s` }}
    >
      <Link
        href={`${hrefBase}/${slug}`}
        className="grid items-center gap-16 px-16 py-20 transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:bg-foreground/5"
        style={{ gridTemplateColumns: "32px minmax(0,1fr) 240px 8rem 32px" }}
      >
        <span aria-hidden="true" className="text-accent-xs text-foreground-muted">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="text-h5 truncate font-medium text-foreground">
          {title}
        </h3>
        <span className="flex justify-start gap-8">
          {animation.is_free_preview && (
            <span className="text-accent-xs bg-brand px-8 py-4 font-medium text-[#141314]">Free</span>
          )}
          {recent && (
            <span className="text-accent-xs bg-brand px-8 py-4 font-medium text-[#141314]">New</span>
          )}
          {updated && (
            <span className="text-accent-xs bg-foreground px-8 py-4 font-medium text-background">Updated</span>
          )}
        </span>
        <span className="text-accent-xs truncate text-foreground-muted">
          {category}
        </span>
        
        <div className="flex justify-end">
          {hideSave ? null : isAuthenticated ? (
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={isLoading}
              aria-label={isSaved ? "Remove from saved" : "Save animation"}
              aria-pressed={isSaved}
              className="flex size-32 items-center justify-center text-foreground-muted transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:text-foreground"
            >
              <BookmarkSimple className={isSaved ? "size-16 fill-brand text-brand" : "size-16 text-current"} />
            </button>
          ) : (
            <span aria-hidden="true" className="flex size-32 items-center justify-center text-foreground-muted opacity-0 transition-opacity duration-(--duration-fast) ease-(--ease-expo-out) group-hover:opacity-100">
              <ArrowUpRight className="size-16" />
            </span>
          )}
        </div>
      </Link>
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-foreground/10" />
    </li>
  );
}

function ListModeContainer({
  animations,
  isAuthenticated = false,
  savedAnimationIds = [],
  hrefBase = "/animations",
  hideSave = false
}) {
  let containerRef = useRef(null);
  let savedSet = new Set(savedAnimationIds);
  
  let masonryItems = animations.map(a => ({
    type: "image",
    src: a.preview_image_url ? bunnyImageUrl(a.preview_image_url, { width: 480 }) : null
  }));

  return (
    <div className="v2-container pb-128">
      <div ref={containerRef} className="relative">
        <div aria-hidden="true" className="h-px bg-foreground/10" />
        <ul role="list" className="flex flex-col">
          {animations.map((anim, idx) => (
            <AnimationListItem
              key={anim.id}
              animation={anim}
              index={idx}
              isAuthenticated={isAuthenticated}
              initialIsSaved={savedSet.has(anim.id)}
              hrefBase={hrefBase}
              hideSave={hideSave}
            />
          ))}
        </ul>
      </div>
      <MasonryGrid containerRef={containerRef} items={masonryItems} width={240} />
    </div>
  );
}

const GRID_COLS = {
  grid: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  duo: "grid-cols-1 sm:grid-cols-2",
  condensed: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
};

const GRID_GAPS = {
  grid: "gap-x-24 gap-y-24",
  duo: "gap-x-32 gap-y-32",
  condensed: "gap-x-16 gap-y-16"
};

export default function AnimationsList({
  animations,
  viewMode = "grid",
  isAuthenticated = false,
  savedAnimationIds = [],
  sentinelRef,
  hasMore = false,
  animationKey = "default",
  interstitial = null,
  tileProps = null,
  listProps = null
}) {
  let savedSet = useMemo(() => new Set(savedAnimationIds), [savedAnimationIds]);
  let gridRef = useRef(null);
  let animKeyRef = useRef(null);

  useEffect(() => {
    let el = gridRef.current;
    if (!el) return;
    
    if (animKeyRef.current === null) {
      animKeyRef.current = animationKey;
      return;
    }
    
    if (animKeyRef.current === animationKey) return;
    animKeyRef.current = animationKey;
    
    let tiles = el.querySelectorAll("[data-tile]");
    if (tiles.length !== 0) {
      tiles.forEach(t => t.classList.remove("animate-stagger-in"));
      void el.offsetWidth;
      tiles.forEach(t => t.classList.add("animate-stagger-in"));
    }
  }, [animationKey]);

  if (viewMode === VIEW_MODES.LIST) {
    return (
      <Fragment>
        <ListModeContainer
          animations={animations}
          isAuthenticated={isAuthenticated}
          savedAnimationIds={savedAnimationIds}
          {...(listProps || {})}
        />
        {hasMore && (
          <div ref={sentinelRef} className="v2-container h-32 pb-128" aria-hidden="true" />
        )}
      </Fragment>
    );
  }

  let colClass = GRID_COLS[viewMode] ?? GRID_COLS.grid;
  let gapClass = GRID_GAPS[viewMode] ?? GRID_GAPS.grid;

  return (
    <div className="v2-container pb-128">
      <div ref={gridRef} className={`mt-24 grid ${colClass} ${gapClass}`}>
        {animations.map((anim, idx) => {
          let resolvedTileProps = typeof tileProps === "function" ? tileProps(anim) : (tileProps || {});
          return (
            <Fragment key={anim.id}>
              <div
                data-tile={true}
                className="animate-stagger-in"
                style={{ animationDelay: `${(idx % 12) * 0.04}s` }}
              >
                <AnimationCard
                  {...resolvedTileProps}
                  animation={anim}
                  viewMode={viewMode}
                  isAuthenticated={isAuthenticated}
                  initialIsSaved={savedSet.has(anim.id)}
                  priority={idx < 3}
                />
              </div>
              {interstitial && idx === Math.min(8, animations.length) - 1 ? (
                <div className="col-span-full">
                  {interstitial}
                </div>
              ) : null}
            </Fragment>
          );
        })}
      </div>
      {hasMore && (
        <div ref={sentinelRef} className="mt-48 h-32 w-full" aria-hidden="true" />
      )}
    </div>
  );
}
