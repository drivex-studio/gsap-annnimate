import React, { useRef, useState, useCallback } from 'react';
import { cn } from '@/libs/utils/className';
import Link from '@/components/navigation/Link';

import { bunnyImageUrl } from '@/libs/utils/bunnyImageUrl';
import ProvenanceChip from '@/components/ui/ProvenanceChip';
import FreeChip from '@/components/ui/FreeChip';
import { getProvenanceSite } from '@/libs/utils/provenance';
import SaveButton from '@/components/ui/SaveButton';

function isNew(animation) {
  if (!animation?.published_at) return false;
  let pubDate = new Date(animation.published_at).getTime();
  return (Date.now() - pubDate) < 1209600000;
}

const RATIOS = {
  grid: "aspect-[16/10]",
  duo: "aspect-[16/10]",
  condensed: "aspect-[16/10]",
  list: "aspect-[16/10]"
};

export default function AnimationCard({
  animation,
  viewMode = "grid",
  isAuthenticated = false,
  initialIsSaved = false,
  priority = false,
  hrefBase = "/animations",
  chipLabel,
  hideSave = false,
  badge = null
}) {
  let provenanceLabel = chipLabel || getProvenanceSite(animation) || "Studio Original";
  let { id, title, slug, category, preview_image_url, preview_video_url } = animation;
  
  let videoRef = useRef(null);
  let [isHovering, setIsHovering] = useState(false);
  let [isVideoLoaded, setIsVideoLoaded] = useState(false);
  
  let showNewBadge = isNew(animation);
  let showUpdatedBadge = !showNewBadge && animation?.content_updated_at && (Date.now() - new Date(animation.content_updated_at).getTime()) < 604800000;
  
  let handleMouseEnter = useCallback(() => {
    setIsHovering(true);
    if (preview_video_url && !isVideoLoaded) {
      setIsVideoLoaded(true);
      return;
    }
    if (videoRef.current && preview_video_url) {
      let playPromise = videoRef.current.play();
      if (playPromise?.catch) playPromise.catch(() => {});
    }
  }, [preview_video_url, isVideoLoaded]);

  let handleMouseLeave = useCallback(() => {
    setIsHovering(false);
    if (videoRef.current && preview_video_url) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [preview_video_url]);

  let handleVideoLoaded = useCallback(() => {
    if (isHovering && videoRef.current) {
      let playPromise = videoRef.current.play();
      if (playPromise?.catch) playPromise.catch(() => {});
    }
  }, [isHovering]);

  let ratioClass = RATIOS[viewMode] ?? RATIOS.grid;

  return (
    <Link
      href={`${hrefBase}/${slug}`}
      data-theme="dark"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative block bg-surface p-12 text-foreground transition-transform duration-(--duration-quick) ease-(--ease-back-out) hover:scale-[0.98]"
    >
      <div className={cn("relative overflow-hidden bg-foreground/[0.06]", `w-full ${ratioClass}`)}>
        {preview_image_url && (
          <img
            src={bunnyImageUrl(preview_image_url, { width: 720 })}
            alt={title}
            fetchPriority={priority ? "high" : undefined}
            decoding="async"
            className="absolute inset-0 block object-cover"
            style={{ width: "100%", height: "100%" }}
          />
        )}
        
        {preview_video_url && isVideoLoaded && (
          <video
            ref={videoRef}
            src={preview_video_url}
            muted={true}
            loop={true}
            playsInline={true}
            preload="metadata"
            onLoadedData={handleVideoLoaded}
            className={cn("absolute inset-0 block size-full object-cover transition-opacity duration-(--duration-snap)", isHovering ? "opacity-100" : "opacity-0")}
            style={{ width: "100%", height: "100%" }}
          />
        )}
        
        {!hideSave && (
          <div className="absolute right-8 top-8 z-10">
            <SaveButton
              animation={animation}
              initialIsSaved={initialIsSaved}
              isAuthenticated={isAuthenticated}
              variant="overlay"
              fadeOnHover={true}
              unauthHint="arrow"
            />
          </div>
        )}
      </div>
      
      <div className="mt-12 flex h-24 items-center justify-between gap-8">
        <ProvenanceChip label={provenanceLabel} size="default" className="text-foreground-muted" />
        <div className="flex h-full items-center gap-8">
          {badge}
          {animation.is_free_preview && <FreeChip />}
          {showNewBadge && (
            <span className="text-accent-xs inline-flex h-full items-center bg-brand px-8 font-medium text-[#141314]">
              New
            </span>
          )}
          {showUpdatedBadge && (
            <span className="text-accent-xs inline-flex h-full items-center bg-foreground px-8 font-medium text-background">
              Updated
            </span>
          )}
        </div>
      </div>
      
      <div className="mt-36 flex items-baseline justify-between gap-12">
        <p className="text-body-sm truncate font-medium text-foreground">{title}</p>
        <p className="text-accent-xs shrink-0 text-foreground-muted">{category}</p>
      </div>
    </Link>
  );
}
