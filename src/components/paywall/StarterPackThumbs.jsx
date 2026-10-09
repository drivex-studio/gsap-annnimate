
import React, { useRef } from 'react';
import gsap from 'gsap'; // module id: 989970
import { useGSAP } from '@gsap/react'; // module id: 365747

const DEFAULT_THUMBS = [ // original mangled: x
  { title: "Text Reveal", img: "[https://annnimate.b-cdn.net/video-thumbnails/scroll/text-reveal/text-reveal_cover.avif](https://annnimate.b-cdn.net/video-thumbnails/scroll/text-reveal/text-reveal_cover.avif)" },
  { title: "Dual Scramble", img: "[https://annnimate.b-cdn.net/video-thumbnails/ui-component/dual-scramble/dual_scramble_cover.avif](https://annnimate.b-cdn.net/video-thumbnails/ui-component/dual-scramble/dual_scramble_cover.avif)" },
  { title: "Accordion", img: "[https://annnimate.b-cdn.net/video-thumbnails/ui-component/accordion/accordion_cover.avif](https://annnimate.b-cdn.net/video-thumbnails/ui-component/accordion/accordion_cover.avif)" },
  { title: "Drawer Menu", img: "[https://annnimate.b-cdn.net/video-thumbnails/menu/multi-level-drawer-menu/multi-level-drawer-menu_cover.avif](https://annnimate.b-cdn.net/video-thumbnails/menu/multi-level-drawer-menu/multi-level-drawer-menu_cover.avif)" }
];

// module id: 993603 (named export 'StarterPackThumbs')
export default function StarterPackThumbs({ className = "", items = null }) { // original mangled: g, e, i
  let thumbs = items && items.length ? items : DEFAULT_THUMBS; // original mangled: s
  let containerRef = useRef(null); // original mangled: l
  let trackRef = useRef(null); // original mangled: o

  useGSAP(() => {
    let track = trackRef.current; // original mangled: e
    let container = containerRef.current; // original mangled: t
    
    if (track && container) {
      let mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        let tween = gsap.to(track, {
          xPercent: -50,
          duration: 7 * thumbs.length,
          ease: "none",
          repeat: -1,
          force3D: true
        }); // original mangled: a
        
        let onEnter = () => gsap.to(tween, { timeScale: 0, duration: 0.4, overwrite: true }); // original mangled: r
        let onLeave = () => gsap.to(tween, { timeScale: 1, duration: 0.4, overwrite: true }); // original mangled: i
        
        container.addEventListener("mouseenter", onEnter);
        container.addEventListener("mouseleave", onLeave);
        
        return () => {
          container.removeEventListener("mouseenter", onEnter);
          container.removeEventListener("mouseleave", onLeave);
        };
      });
    }
  }, { scope: containerRef });

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_28%,black_72%,transparent)] ${className}`}
    >
      <div ref={trackRef} className="flex w-max">
        {[...thumbs, ...thumbs].map((item, index) => (
          <figure
            key={`${item.title}-${index}`}
            aria-hidden={index >= thumbs.length ? "true" : undefined}
            className="flex w-140 shrink-0 flex-col gap-6 pr-12"
          >
            <div className="aspect-[16/10] w-full overflow-hidden border border-foreground/10 bg-foreground/[0.04]">
              <img
                src={item.img}
                alt={index >= thumbs.length ? "" : item.title}
                className="block object-cover"
                style={{ width: "100%", height: "100%" }}
              />
            </div>
            <figcaption className="text-accent-2xs truncate text-center text-foreground-muted">
              {item.title}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
