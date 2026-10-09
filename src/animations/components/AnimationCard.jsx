
import React, { useRef, useState, useCallback } from 'react';
import { cn } from '@/libs/utils/className'; // module id: 103746
import Link from '@/components/navigation/Link'; // module id: 101836

import { bunnyImageUrl } from '@/libs/utils/bunnyImageUrl'; // module id: 632021 (Mapped)
import ProvenanceChip from '@/components/ui/ProvenanceChip'; // module id: 909247 (Mapped)
import FreeChip from '@/components/ui/FreeChip'; // module id: 993603 (Mapped)
import { getProvenanceSite } from '@/libs/utils/provenance'; // module id: 809630 (Mapped)
import SaveButton from '@/components/ui/SaveButton'; // module id: 878512

function isNew(animation) { // original mangled: b
  if (!animation?.published_at) return false;
  let pubDate = new Date(animation.published_at).getTime();
  return (Date.now() - pubDate) < 1209600000; // 14 days
}

const RATIOS = { // original mangled: y
  grid: "aspect-[16/10]",
  duo: "aspect-[16/10]",
  condensed: "aspect-[16/10]",
  list: "aspect-[16/10]"
};

// module id: 591611
export default function AnimationCard({
  animation, // original mangled: e
  viewMode = "grid", // original mangled: l
  isAuthenticated = false, // original mangled: o
  initialIsSaved = false, // original mangled: c
  priority = false, // original mangled: d
  hrefBase = "/animations", // original mangled: u
  chipLabel, // original mangled: m
  hideSave = false, // original mangled: f
  badge = null // original mangled: h
}) {
  let provenanceLabel = chipLabel || getProvenanceSite(animation) || "Studio Original"; // original mangled: p
  let { id, title, slug, category, preview_image_url, preview_video_url } = animation; // original mangled: j, w, k, N, E, H
  
  let videoRef = useRef(null); // original mangled: S
  let [isHovering, setIsHovering] = useState(false); // original mangled: V, A
  let [isVideoLoaded, setIsVideoLoaded] = useState(false); // original mangled: _, M
  
  let showNewBadge = isNew(animation); // original mangled: T
  let showUpdatedBadge = !showNewBadge && animation?.content_updated_at && (Date.now() - new Date(animation.content_updated_at).getTime()) < 604800000; // original mangled: C
  
  let handleMouseEnter = useCallback(() => { // original mangled: L
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

  let handleMouseLeave = useCallback(() => { // original mangled: P
    setIsHovering(false);
    if (videoRef.current && preview_video_url) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [preview_video_url]);

  let handleVideoLoaded = useCallback(() => { // original mangled: Z
    if (isHovering && videoRef.current) {
      let playPromise = videoRef.current.play();
      if (playPromise?.catch) playPromise.catch(() => {});
    }
  }, [isHovering]);

  let ratioClass = RATIOS[viewMode] ?? RATIOS.grid; // original mangled: R

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
