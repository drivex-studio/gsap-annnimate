'use client';
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import HeroHeader from '@/components/animations/HeroHeader';
import NewsletterSignup from '@/components/ui/NewsletterEyebrow';
import AnimationsListModal from '@/components/animations/AnimationsListModal';
import FilterBar, { VIEW_MODES } from '@/components/animations/FilterBar';
import AnimationsGrid from '@/components/animations/AnimationsGrid';
import EmptyState from '@/components/animations/EmptyState';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import CtaSection from '@/components/landing/BottomCTA';
import FaqList from '@/components/animations/FaqList';
import { useCategorySlugs, useCategoryOptions } from '@/providers/CategoryProvider';
import { analytics } from '@/libs/utils/analytics';
import { SORT_OPTIONS } from '@/libs/utils/search';

const INTERACTION_TYPES = [
  { value: 'hover', label: 'Hover' },
  { value: 'click', label: 'Click' },
  { value: 'drag', label: 'Drag' },
  { value: 'scroll', label: 'Scroll' },
  { value: 'ambient', label: 'Ambient' }
];

const INTERACTION_VALUES = INTERACTION_TYPES.map(type => type.value);

export default function AnimationPage({
  initialAnimations = [],
  savedAnimationIds = [],
  isAuthenticated = false,
  faq = []
}) {
  const searchParams = useSearchParams();
  const searchTimeoutRef = useRef(null);
  
  const categorySlugs = useCategorySlugs();
  const categoryOptions = useCategoryOptions();

  
  const [animations] = useState(initialAnimations);
  
  const [activeCategories, setActiveCategories] = useState(() => {
    const categoryParam = searchParams.get('category');
    if (!categoryParam) return [];
    const baseCategory = categoryParam.split(/[?&]/)[0];
    return categorySlugs.includes(baseCategory) ? [baseCategory] : [];
  });
  
  const [activeInteraction, setActiveInteraction] = useState(() => {
    const interactionParam = searchParams.get('interaction');
    return interactionParam && INTERACTION_VALUES.includes(interactionParam)
      ? interactionParam
      : null;
  });
  
  const [isFreeOnly, setIsFreeOnly] = useState(() => searchParams.get('free') === '1');
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'recent');
  
  const [viewMode, setViewMode] = useState(VIEW_MODES.GRID);
  const [previousCount, setPreviousCount] = useState(0);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  const updateUrlParams = useCallback((category, search, sort, interaction, isFree) => {
    const params = new URLSearchParams();
    
    if (category.length > 0) params.set('category', category[0]);
    if (interaction) params.set('interaction', interaction);
    if (isFree) params.set('free', '1');
    if (search) params.set('search', search);
    if (sort && sort !== 'recent') params.set('sort', sort);
    
    const queryStr = params.toString();
    const newUrl = queryStr
      ? `${window.location.pathname}?${queryStr}`
      : window.location.pathname;
      
    window.history.replaceState({}, '', newUrl);
  }, []);

  const filterOptions = useMemo(() => [
    {
      id: 'category',
      label: 'Category',
      options: categoryOptions.map(option => ({
        ...option,
        count: animations.filter(anim => anim.category === option.value).length
      }))
    }
  ], [categoryOptions, animations]);

  const interactionOptions = useMemo(() => {
    return INTERACTION_TYPES.map(interaction => ({
      ...interaction,
      count: animations.filter(anim =>
        (anim.metadata?.interaction || []).includes(interaction.value)
      ).length
    }));
  }, [animations]);

  const freeCount = useMemo(() => {
    return animations.filter(anim => anim.is_free_preview).length;
  }, [animations]);

  const filteredAnimations = useMemo(() => {
    let result = [...animations];
    
    if (activeCategories.length > 0) {
      result = result.filter(anim => activeCategories.includes(anim.category));
    }
    
    if (activeInteraction) {
      result = result.filter(anim => 
        (anim.metadata?.interaction || []).includes(activeInteraction)
      );
    }
    
    if (isFreeOnly) {
      result = result.filter(anim => anim.is_free_preview);
    }
    
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase().trim();
      result = result.filter(anim => 
        anim.title?.toLowerCase().includes(lowerQuery) ||
        anim.description?.toLowerCase().includes(lowerQuery) ||
        anim.category?.toLowerCase().includes(lowerQuery)
      );
    }
    
    switch (sortBy) {
      case 'hot':
        result.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        break;
        
      case 'new':
        result.sort((a, b) => 
          new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at)
        );
        break;
        
      case 'saved':
        result.sort((a, b) => (b.save_count || 0) - (a.save_count || 0));
        break;
        
      default: {
        const now = Date.now();
        const oneWeekAgo = now - 604800000;
        const twoWeeksAgo = now - 1209600000;
        
        const isRecent = anim => 
          (anim.published_at && new Date(anim.published_at).getTime() > twoWeeksAgo) ||
          (anim.content_updated_at && new Date(anim.content_updated_at).getTime() > oneWeekAgo)
            ? 1
            : 0;
            
        result.sort((a, b) => {
          const recentDiff = isRecent(b) - isRecent(a);
          if (recentDiff !== 0) return recentDiff;
          
          return new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at);
        });
      }
    }
    
    return result;
  }, [animations, activeCategories, activeInteraction, isFreeOnly, searchQuery, sortBy]);

  const {
    displayedCount,
    sentinelRef,
    hasMore
  } = useInfiniteScroll(filteredAnimations.length, [
    activeCategories,
    activeInteraction,
    isFreeOnly,
    searchQuery,
    sortBy
  ]);

  const displayedAnimations = useMemo(() => {
    return filteredAnimations.slice(0, displayedCount);
  }, [filteredAnimations, displayedCount]);

  const animationKey = useMemo(() => {
    const prefix = filteredAnimations.slice(0, 9).map(anim => anim.id).join('-');
    return `${prefix}-${viewMode}`;
  }, [filteredAnimations, viewMode]);

  useEffect(() => {
    const currentLength = filteredAnimations.length;
    
    if (previousCount !== 0 && previousCount !== currentLength) {
      if (window.lenis) {
        window.lenis.scrollTo(0, {
          duration: 1.2,
          easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t))
        });
      } else {
        const transitionContent = document.querySelector('[data-transition-content]');
        if (transitionContent && transitionContent.scrollHeight > transitionContent.clientHeight) {
          transitionContent.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }
    setPreviousCount(currentLength);
  }, [filteredAnimations.length, previousCount]);

  const handleCategoryChange = useCallback(category => {
    setActiveCategories(category);
    updateUrlParams(category, searchQuery, sortBy, activeInteraction, isFreeOnly);
    
    let simulatedResult = [...animations];
    if (category.length > 0) {
      simulatedResult = simulatedResult.filter(anim => category.includes(anim.category));
    }
    if (activeInteraction) {
      simulatedResult = simulatedResult.filter(anim => 
        (anim.metadata?.interaction || []).includes(activeInteraction)
      );
    }
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase().trim();
      simulatedResult = simulatedResult.filter(anim => 
        anim.title?.toLowerCase().includes(lowerQuery) ||
        anim.description?.toLowerCase().includes(lowerQuery) ||
        anim.category?.toLowerCase().includes(lowerQuery)
      );
    }
    
    analytics.search.filtered({
      category: category[0] || null,
      interaction: activeInteraction,
      sort: sortBy
    }, simulatedResult.length);
  }, [animations, searchQuery, sortBy, activeInteraction, isFreeOnly, updateUrlParams]);

  const handleInteractionChange = useCallback(interaction => {
    setActiveInteraction(interaction);
    updateUrlParams(activeCategories, searchQuery, sortBy, interaction, isFreeOnly);
    
    analytics.search.filtered({
      category: activeCategories[0] || null,
      interaction: interaction,
      sort: sortBy
    }, filteredAnimations.length);
  }, [activeCategories, searchQuery, sortBy, isFreeOnly, updateUrlParams, filteredAnimations.length]);

  const handleFreeChange = useCallback(isFree => {
    setIsFreeOnly(isFree);
    updateUrlParams(activeCategories, searchQuery, sortBy, activeInteraction, isFree);
    
    analytics.search.filtered({
      category: activeCategories[0] || null,
      interaction: activeInteraction,
      free: isFree,
      sort: sortBy
    }, filteredAnimations.length);
  }, [activeCategories, searchQuery, sortBy, activeInteraction, updateUrlParams, filteredAnimations.length]);

  const handleSearchChange = useCallback(search => {
    setSearchQuery(search);
    
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(() => {
      updateUrlParams(activeCategories, search, sortBy, activeInteraction, isFreeOnly);
      
      if (search.trim()) {
        const lowerQuery = search.toLowerCase().trim();
        const matchCount = animations.filter(anim => 
          anim.title?.toLowerCase().includes(lowerQuery) ||
          anim.description?.toLowerCase().includes(lowerQuery) ||
          anim.category?.toLowerCase().includes(lowerQuery)
        ).length;
        
        analytics.search.performed(search.trim(), matchCount, {
          category: activeCategories[0] || null,
          sort: sortBy
        });
      }
    }, 300);
  }, [activeCategories, animations, sortBy, activeInteraction, isFreeOnly, updateUrlParams]);

  const handleSortChange = useCallback(sort => {
    setSortBy(sort);
    updateUrlParams(activeCategories, searchQuery, sort, activeInteraction, isFreeOnly);
    
    analytics.search.filtered({
      category: activeCategories[0] || null,
      interaction: activeInteraction,
      sort: sort
    }, filteredAnimations.length);
  }, [activeCategories, searchQuery, activeInteraction, isFreeOnly, updateUrlParams, filteredAnimations.length]);

  const handleViewModeChange = useCallback(mode => {
    setViewMode(mode);
  }, []);

  const handleResetFilters = useCallback(() => {
    setActiveCategories([]);
    setActiveInteraction(null);
    setIsFreeOnly(false);
    setSearchQuery('');
    setSortBy('recent');
    updateUrlParams([], '', 'recent', null, false);
  }, [updateUrlParams]);

  const previewImages = useMemo(() => {
    return animations
      .map(anim => anim.preview_image_url)
      .filter(Boolean)
      .slice(0, 24);
  }, [animations]);

  return (
    <div data-theme="dark" className="bg-background text-foreground">
      <HeroHeader 
        headline="GSAP animations, every framework." 
        subtext="React and Vue animation components, built on GSAP. The animated UI components studios ship on real brand work - scroll reveals, magnetic buttons, text effects, page transitions. Copy what you need." 
      />
      
      <div className="relative pb-32">
        {displayedAnimations.length === 0 ? (
          <EmptyState 
            query={searchQuery} 
            onReset={handleResetFilters} 
          />
        ) : (
          <AnimationsGrid 
            animations={displayedAnimations} 
            viewMode={viewMode} 
            isAuthenticated={isAuthenticated} 
            savedAnimationIds={savedAnimationIds} 
            sentinelRef={sentinelRef} 
            hasMore={hasMore} 
            animationKey={animationKey} 
            interstitial={
              isAuthenticated ? null : (
                <section data-starter-pack-band={true} className="py-32 lg:py-48">
                  <div className="mx-auto flex max-w-[640px] flex-col gap-16 text-left">
                    <h3 className="text-h3 font-medium text-foreground">
                      A new free component every week.
                      <span className="block">Get the pack.</span>
                    </h3>
                    <NewsletterSignup 
                      source="animations-library" 
                      idPrefix="animations" 
                      buttonLabel="Send it to me" 
                      inputSize="lg" 
                    />
                  </div>
                </section>
              )
            } 
          />
        )}
      </div>

      <FilterBar 
        activeFilters={activeCategories} 
        onFiltersChange={handleCategoryChange} 
        interaction={activeInteraction} 
        onInteractionChange={handleInteractionChange} 
        interactionOptions={interactionOptions} 
        freeOnly={isFreeOnly} 
        onFreeChange={handleFreeChange} 
        freeCount={freeCount} 
        sortBy={sortBy} 
        onSortChange={handleSortChange} 
        viewMode={viewMode} 
        onViewModeChange={handleViewModeChange} 
        searchValue={searchQuery} 
        onSearchChange={handleSearchChange} 
        filterOptions={filterOptions} 
        sortOptions={SORT_OPTIONS} 
        count={filteredAnimations.length} 
        isAuthenticated={isAuthenticated} 
      />

      <section className="v2-container py-96 lg:py-128">
        <div className="grid grid-cols-12 gap-x-24">
          <div className="col-span-12 lg:col-span-8 lg:col-start-3">
            <FaqList items={faq} />
          </div>
        </div>
      </section>

      {isAuthenticated ? (
        <CtaSection 
          images={previewImages} 
          minimal={true} 
          headline="Find your next component." 
          subtext="Filter, preview live, copy in React or Vue. The library updates every week." 
          primaryCta={{ label: 'View your saved', href: '/animations/saved' }} 
          secondaryCta={{ label: 'Suggest a component', href: '/roadmap' }} 
        />
      ) : (
        <CtaSection 
          images={previewImages} 
          bleed={true} 
        />
      )}
      
      <AnimationsListModal 
        isAuthenticated={isAuthenticated} 
        source="animations-list-modal" 
        idPrefix="animations-list-modal" 
      />
    </div>
  );
}
