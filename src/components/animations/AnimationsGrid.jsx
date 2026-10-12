'use client';
import React, { useRef, useMemo, useCallback, useEffect, Fragment } from 'react'; // module id: 271645
import Link from 'next/link'; // module id: 101836
import AnimationTile from '@/animations/components/AnimationCard'; // module id: 591611
import HoverImagePreview from '@/animations/shared/HoverImagePreview'; // module id: 934783
import { BookmarkSimple } from '@phosphor-icons/react'; // module id: 933325
import { ArrowUpRight } from '@phosphor-icons/react'; // module id: 683845
import { bunnyImageUrl } from '@/libs/utils/bunnyImageUrl'; // module id: 632021
import { useAnimation } from '@/animations/hooks/useAnimation'; // module id: 488843

/* Data */
const GRID_COLS = {
  grid: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  duo: 'grid-cols-1 sm:grid-cols-2',
  condensed: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
};

const GRID_GAPS = {
  grid: 'gap-x-24 gap-y-24',
  duo: 'gap-x-32 gap-y-32',
  condensed: 'gap-x-16 gap-y-16'
};

/* --- Helpers --- */
function isNewAnimation(animation) {
  return !!animation?.published_at && (Date.now() - new Date(animation.published_at).getTime() < 1209600000); // 14 days
}

/* --- Subcomponents --- */

function AnimationListItem({
  animation,
  index,
  isAuthenticated,
  initialIsSaved,
  hrefBase = '/animations',
  hideSave = false
}) {
  const { id, title, slug, category } = animation;
  
  const isNew = isNewAnimation(animation);
  const isUpdated = !(!animation?.content_updated_at || isNewAnimation(animation)) && 
                    (Date.now() - new Date(animation.content_updated_at).getTime() < 604800000); // 7 days

  const { isSaved, isLoading, toggleSave } = useAnimation(
    isAuthenticated ? id : null, 
    initialIsSaved, 
    isAuthenticated ? animation : null
  );

  const handleSaveClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSave?.(e);
  }, [toggleSave]);

  return (
    <li data-row-index={index} data-hfp-index={index} data-tile={true} className="animate-stagger-in group relative" style={{ animationDelay: `${(index % 12) * 0.04}s` }}>
      <Link 
        href={`${hrefBase}/${slug}`} 
        className="grid items-center gap-16 px-16 py-20 transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:bg-foreground/5" 
        style={{ gridTemplateColumns: '32px minmax(0,1fr) 240px 8rem 32px' }}
      >
        <span aria-hidden="true" className="text-accent-xs text-foreground-muted">
          {String(index + 1).padStart(2, '0')}
        </span>
        <h3 className="text-h5 truncate font-medium text-foreground">
          {title}
        </h3>
        
        <span className="flex justify-start gap-8">
          {animation.is_free_preview && (
            <span className="text-accent-xs bg-brand px-8 py-4 font-medium text-[#141314]">Free</span>
          )}
          {isNew && (
            <span className="text-accent-xs bg-brand px-8 py-4 font-medium text-[#141314]">New</span>
          )}
          {isUpdated && (
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
              aria-label={isSaved ? 'Remove from saved' : 'Save animation'} 
              aria-pressed={isSaved} 
              className="flex size-32 items-center justify-center text-foreground-muted transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:text-foreground"
            >
              <BookmarkSimple className={isSaved ? 'size-16 fill-brand text-brand' : 'size-16 text-current'} />
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

function AnimationsListView({
  animations,
  isAuthenticated = false,
  savedAnimationIds = [],
  hrefBase = '/animations',
  hideSave = false
}) {
  const containerRef = useRef(null);
  const savedSet = new Set(savedAnimationIds);
  
  const hoverItems = animations.map(anim => ({
    type: 'image',
    src: anim.preview_image_url ? bunnyImageUrl(anim.preview_image_url, { width: 480 }) : null
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
      <HoverImagePreview containerRef={containerRef} items={hoverItems} width={240} />
    </div>
  );
}

/* --- AnimationsGrid --- */
// module id: 425565

export default function AnimationsGrid({
  animations,
  viewMode = 'grid',
  isAuthenticated = false,
  savedAnimationIds = [],
  sentinelRef,
  hasMore = false,
  animationKey = 'default',
  interstitial = null,
  tileProps = null,
  listProps = null
}) {
  const savedSet = useMemo(() => new Set(savedAnimationIds), [savedAnimationIds]);
  const containerRef = useRef(null);
  const prevAnimationKey = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    if (prevAnimationKey.current === null) {
      prevAnimationKey.current = animationKey;
      return;
    }
    
    if (prevAnimationKey.current === animationKey) return;
    
    prevAnimationKey.current = animationKey;
    const tiles = container.querySelectorAll('[data-tile]');
    
    if (tiles.length !== 0) {
      tiles.forEach(tile => tile.classList.remove('animate-stagger-in'));
      // trigger reflow
      container.offsetWidth; 
      tiles.forEach(tile => tile.classList.add('animate-stagger-in'));
    }
  }, [animationKey]);

  if (viewMode === 'list') {
    return (
      <Fragment>
        <AnimationsListView 
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

  return (
    <div className="v2-container pb-128">
      <div 
        ref={containerRef} 
        className={`mt-24 grid ${GRID_COLS[viewMode] ?? GRID_COLS.grid} ${GRID_GAPS[viewMode] ?? GRID_GAPS.grid}`}
      >
        {animations.map((anim, idx) => (
          <Fragment key={anim.id}>
            <div data-tile={true} className="animate-stagger-in" style={{ animationDelay: `${(idx % 12) * 0.04}s` }}>
              <AnimationTile 
                {...(typeof tileProps === 'function' ? tileProps(anim) : (tileProps || {}))} 
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
        ))}
      </div>
      {hasMore && (
        <div ref={sentinelRef} className="mt-48 h-32 w-full" aria-hidden="true" />
      )}
    </div>
  );
}