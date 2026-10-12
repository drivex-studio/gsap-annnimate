"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

import HeroSection from '@/components/animations/HeroSection';
import NewsletterForm from '@/components/ui/NewsletterEyebrow';
import StarterPackModal from '@/components/animations/StarterPackModal';
import FilterBar, { VIEW_MODES } from '@/components/animations/FilterBar';
import AnimationsList from '@/components/animations/AnimationsList';
import EmptyState from '@/components/animations/EmptyState';
import CallToAction from '@/components/landing/FAQSection';
import FAQ from '@/components/animations/FAQ';

import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { analytics } from '@/libs/utils/analytics';
import { SORT_OPTIONS } from '@/libs/utils/search';
import { useCategorySlugs, useCategoryOptions } from '@/providers/CategoryProvider';

const INTERACTION_OPTIONS = [
  { value: "hover", label: "Hover" },
  { value: "click", label: "Click" },
  { value: "drag", label: "Drag" },
  { value: "scroll", label: "Scroll" },
  { value: "ambient", label: "Ambient" }
];

const INTERACTION_VALUES = INTERACTION_OPTIONS.map(e => e.value);

export default function AnimationsPage({
  initialAnimations = [],
  savedAnimationIds = [],
  isAuthenticated = false,
  faq = []
}) {
  let searchParams = useSearchParams();
  let searchTimeoutRef = useRef(null);
  
  let categorySlugs = useCategorySlugs();
  let categoryOptions = useCategoryOptions();
  
  let [allAnimations] = useState(initialAnimations);
  
  let [activeCategories, setActiveCategories] = useState(() => {
    let catParam = searchParams.get("category");
    if (!catParam) return [];
    let firstCat = catParam.split(/[?&]/)[0];
    return categorySlugs.includes(firstCat) ? [firstCat] : [];
  });
  
  let [activeInteraction, setActiveInteraction] = useState(() => {
    let intParam = searchParams.get("interaction");
    return intParam && INTERACTION_VALUES.includes(intParam) ? intParam : null;
  });
  
  let [freeOnly, setFreeOnly] = useState(() => searchParams.get("free") === "1");
  let [searchValue, setSearchValue] = useState(() => searchParams.get("search") || "");
  let [sortBy, setSortBy] = useState(() => searchParams.get("sort") || "recent");
  let [viewMode, setViewMode] = useState(VIEW_MODES.GRID);
  
  let [prevListLength, setPrevListLength] = useState(0);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  let updateUrl = useCallback((categories, search, sort, interaction, isFree) => {
    let params = new URLSearchParams();
    if (categories.length > 0) params.set("category", categories[0]);
    if (interaction) params.set("interaction", interaction);
    if (isFree) params.set("free", "1");
    if (search) params.set("search", search);
    if (sort && sort !== "recent") params.set("sort", sort);
    
    let paramString = params.toString();
    let newUrl = paramString ? `${window.location.pathname}?${paramString}` : window.location.pathname;
    window.history.replaceState({}, "", newUrl);
  }, []);

  let filterOptionsWithCount = useMemo(() => [
    {
      id: "category",
      label: "Category",
      options: categoryOptions.map(opt => ({
        ...opt,
        count: allAnimations.filter(anim => anim.category === opt.value).length
      }))
    }
  ], [categoryOptions, allAnimations]);

  let interactionOptionsWithCount = useMemo(() =>
    INTERACTION_OPTIONS.map(opt => ({
      ...opt,
      count: allAnimations.filter(anim => (anim.metadata?.interaction || []).includes(opt.value)).length
    }))
  , [allAnimations]);

  let freeCount = useMemo(() => allAnimations.filter(anim => anim.is_free_preview).length, [allAnimations]);
  
  let sortOptionsList = SORT_OPTIONS;

  let filteredAnimations = useMemo(() => {
    let result = [...allAnimations];
    
    if (activeCategories.length > 0) {
      result = result.filter(anim => activeCategories.includes(anim.category));
    }
    if (activeInteraction) {
      result = result.filter(anim => (anim.metadata?.interaction || []).includes(activeInteraction));
    }
    if (freeOnly) {
      result = result.filter(anim => anim.is_free_preview);
    }
    if (searchValue.trim()) {
      let query = searchValue.toLowerCase().trim();
      result = result.filter(anim => 
        anim.title?.toLowerCase().includes(query) || 
        anim.description?.toLowerCase().includes(query) || 
        anim.category?.toLowerCase().includes(query)
      );
    }
    
    switch (sortBy) {
      case "hot":
        result.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        break;
      case "new":
        result.sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));
        break;
      case "saved":
        result.sort((a, b) => (b.save_count || 0) - (a.save_count || 0));
        break;
      default: {
        let now = Date.now();
        let sevenDaysAgo = now - 604800000;
        let fourteenDaysAgo = now - 1209600000;
        
        let getPriorityScore = (anim) => {
          let isRecentlyPublished = anim.published_at && new Date(anim.published_at).getTime() > fourteenDaysAgo;
          let isRecentlyUpdated = anim.content_updated_at && new Date(anim.content_updated_at).getTime() > sevenDaysAgo;
          return isRecentlyPublished || isRecentlyUpdated ? 1 : 0;
        };
        
        result.sort((a, b) => {
          let scoreDiff = getPriorityScore(b) - getPriorityScore(a);
          if (scoreDiff !== 0) return scoreDiff;
          return new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at);
        });
      }
    }
    return result;
  }, [allAnimations, activeCategories, activeInteraction, freeOnly, searchValue, sortBy]);

  let { displayedCount, sentinelRef, hasMore } = useInfiniteScroll(filteredAnimations.length, [activeCategories, activeInteraction, freeOnly, searchValue, sortBy]);
  
  let visibleAnimations = useMemo(() => filteredAnimations.slice(0, displayedCount), [filteredAnimations, displayedCount]);
  
  let animationKey = useMemo(() => {
    let idsStr = filteredAnimations.slice(0, 9).map(a => a.id).join("-");
    return `${idsStr}-${viewMode}`;
  }, [filteredAnimations, viewMode]);

  useEffect(() => {
    let currentLen = filteredAnimations.length;
    if (prevListLength !== 0 && prevListLength !== currentLen) {
      if (window.lenis) {
        window.lenis.scrollTo(0, {
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
        });
      } else {
        let contentEl = document.querySelector("[data-transition-content]");
        if (contentEl && contentEl.scrollHeight > contentEl.clientHeight) {
          contentEl.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    }
    setPrevListLength(currentLen);
  }, [filteredAnimations.length, prevListLength]);

  let handleCategoryChange = useCallback((cats) => {
    setActiveCategories(cats);
    updateUrl(cats, searchValue, sortBy, activeInteraction, freeOnly);
    
    let simulatedResult = [...allAnimations];
    if (cats.length > 0) simulatedResult = simulatedResult.filter(a => cats.includes(a.category));
    if (activeInteraction) simulatedResult = simulatedResult.filter(a => (a.metadata?.interaction || []).includes(activeInteraction));
    if (searchValue.trim()) {
      let q = searchValue.toLowerCase().trim();
      simulatedResult = simulatedResult.filter(a => a.title?.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q) || a.category?.toLowerCase().includes(q));
    }
    
    analytics.search.filtered({ category: cats[0] || null, interaction: activeInteraction, sort: sortBy }, simulatedResult.length);
  }, [allAnimations, searchValue, sortBy, activeInteraction, freeOnly, updateUrl]);

  let handleInteractionChange = useCallback((interaction) => {
    setActiveInteraction(interaction);
    updateUrl(activeCategories, searchValue, sortBy, interaction, freeOnly);
    analytics.search.filtered({ category: activeCategories[0] || null, interaction: interaction, sort: sortBy }, filteredAnimations.length);
  }, [activeCategories, searchValue, sortBy, freeOnly, updateUrl, filteredAnimations.length]);

  let handleFreeChange = useCallback((isFree) => {
    setFreeOnly(isFree);
    updateUrl(activeCategories, searchValue, sortBy, activeInteraction, isFree);
    analytics.search.filtered({ category: activeCategories[0] || null, interaction: activeInteraction, free: isFree, sort: sortBy }, filteredAnimations.length);
  }, [activeCategories, searchValue, sortBy, activeInteraction, updateUrl, filteredAnimations.length]);

  let handleSearchChange = useCallback((query) => {
    setSearchValue(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(() => {
      updateUrl(activeCategories, query, sortBy, activeInteraction, freeOnly);
      if (query.trim()) {
        let q = query.toLowerCase().trim();
        let matches = allAnimations.filter(a => a.title?.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q) || a.category?.toLowerCase().includes(q)).length;
        analytics.search.performed(query.trim(), matches, { category: activeCategories[0] || null, sort: sortBy });
      }
    }, 300);
  }, [activeCategories, allAnimations, sortBy, activeInteraction, freeOnly, updateUrl]);

  let handleSortChange = useCallback((sort) => {
    setSortBy(sort);
    updateUrl(activeCategories, searchValue, sort, activeInteraction, freeOnly);
    analytics.search.filtered({ category: activeCategories[0] || null, interaction: activeInteraction, sort: sort }, filteredAnimations.length);
  }, [activeCategories, searchValue, activeInteraction, freeOnly, updateUrl, filteredAnimations.length]);

  let handleViewModeChange = useCallback((mode) => setViewMode(mode), []);

  let handleReset = useCallback(() => {
    setActiveCategories([]);
    setActiveInteraction(null);
    setFreeOnly(false);
    setSearchValue("");
    setSortBy("recent");
    updateUrl([], "", "recent", null, false);
  }, [updateUrl]);

  let previewImages = useMemo(() => allAnimations.map(a => a.preview_image_url).filter(Boolean).slice(0, 24), [allAnimations]);

  return (
    <div data-theme="dark" className="bg-background text-foreground">
      <HeroSection
        headline="GSAP animations, every framework."
        subtext="React and Vue animation components, built on GSAP. The animated UI components studios ship on real brand work - scroll reveals, magnetic buttons, text effects, page transitions. Copy what you need."
      />
      
      <div className="relative pb-32">
        {visibleAnimations.length === 0 ? (
          <EmptyState query={searchValue} onReset={handleReset} />
        ) : (
          <AnimationsList
            animations={visibleAnimations}
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
                    <NewsletterForm
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
        
        <FilterBar
          activeFilters={activeCategories}
          onFiltersChange={handleCategoryChange}
          interaction={activeInteraction}
          onInteractionChange={handleInteractionChange}
          interactionOptions={interactionOptionsWithCount}
          freeOnly={freeOnly}
          onFreeChange={handleFreeChange}
          freeCount={freeCount}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          filterOptions={filterOptionsWithCount}
          sortOptions={sortOptionsList}
          count={filteredAnimations.length}
          isAuthenticated={isAuthenticated}
        />
      </div>

      <section className="v2-container py-96 lg:py-128">
        <div className="grid grid-cols-12 gap-x-24">
          <div className="col-span-12 lg:col-span-8 lg:col-start-3">
            <FAQ items={faq} />
          </div>
        </div>
      </section>

      {isAuthenticated ? (
        <CallToAction
          images={previewImages}
          minimal={true}
          headline="Find your next component."
          subtext="Filter, preview live, copy in React or Vue. The library updates every week."
          primaryCta={{ label: "View your saved", href: "/animations/saved" }}
          secondaryCta={{ label: "Suggest a component", href: "/roadmap" }}
        />
      ) : (
        <CallToAction images={previewImages} bleed={true} />
      )}

      <StarterPackModal
        isAuthenticated={isAuthenticated}
        source="animations-list-modal"
        idPrefix="animations-list-modal"
      />
    </div>
  );
}
