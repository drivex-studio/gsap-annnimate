"use client";
import React, { forwardRef, useMemo, useRef, useCallback, useEffect, useImperativeHandle } from 'react';
import gsap from 'gsap';
import { bunnyImageUrl } from '@/libs/utils/bunnyImageUrl';

const defaultLayout = {
  cardW: 320,
  cardH: 180,
  gap: 48,
  cols: 6,
  rowCount: 6,
  offsetX: 184,
};

export default forwardRef(function ImageCarousel(
  {
    images,
    className = '',
    cursorRef = null,
    layout = null,
    entrance = null,
    driftVx = -28,
    driftVy = -14,
  },
  ref
) {
  const finalLayout = useMemo(() => ({ ...defaultLayout, ...(layout || {}) }), [layout]);

  const containerRef = useRef(null);
  const wrapRef = useRef(null);
  const cardData = useRef([]);
  const panState = useRef({ current: { x: 0, y: 0 }, target: { x: 0, y: 0 } });
  const dragState = useRef({ active: false, startX: 0, startY: 0, baseX: 0, baseY: 0 });
  const bounds = useRef({ w: 0, h: 0 });
  const driftState = useRef({ enabled: true, vx: driftVx, vy: driftVy });

  driftState.current.vx = driftVx;
  driftState.current.vy = driftVy;

  const animationFrameId = useRef(0);
  const lastTime = useRef(0);
  const isIntersecting = useRef(true);
  const hasRevealed = useRef(false);

  const cardItems = useMemo(() => {
    const items = [];
    const cellW = finalLayout.cardW + finalLayout.gap;
    const cellH = finalLayout.cardH + finalLayout.gap;
    let imageIndex = 0;

    for (let r = 0; r < finalLayout.rowCount; r++) {
      const rowOffset = r % 2 === 0 ? finalLayout.offsetX : 0;
      const y = r * cellH;

      for (let c = 0; c < finalLayout.cols; c++) {
        const x = rowOffset + c * cellW;
        const img = images[imageIndex % images.length];

        items.push({
          x: x,
          y: y,
          src: bunnyImageUrl(img, { width: 640 }),
        });
        imageIndex++;
      }
    }
    return items;
  }, [images, finalLayout]);

  const registerCard = useCallback(
    (index) => (el) => {
      if (!el) return;
      if (!cardData.current[index]) {
        cardData.current[index] = {};
      }
      const data = cardData.current[index];
      data.el = el;
      data.img = el.querySelector('img');
      data.x = cardItems[index].x;
      data.y = cardItems[index].y;
      data.w = finalLayout.cardW;
      data.h = finalLayout.cardH;
      data.extraX = 0;
      data.extraY = 0;

      if (entrance === 'center-out' && !hasRevealed.current) {
        el.style.opacity = '0';
      }
    },
    [cardItems, finalLayout, entrance]
  );

  const revealCards = useCallback(() => {
    if (entrance !== 'center-out' || hasRevealed.current) return;
    hasRevealed.current = true;

    const b = bounds.current;
    const centerX = b.w / 2;
    const centerY = b.h / 2;
    const pan = panState.current.current;

    cardData.current.forEach((data) => {
      if (!data?.el) return;
      const currentX = data.x + pan.x + (data.extraX || 0) + data.w / 2;
      const currentY = data.y + pan.y + (data.extraY || 0) + data.h / 2;
      const distance = Math.hypot(currentX - centerX, currentY - centerY);

      gsap.to(data.el, {
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out',
        delay: 0.0016 * distance,
        overwrite: true,
      });
    });
  }, [entrance]);

  useImperativeHandle(ref, () => ({ reveal: revealCards }), [revealCards]);

  useEffect(() => {
    if (entrance !== 'center-out') return;
    const timeoutId = window.setTimeout(revealCards, 4000);
    return () => window.clearTimeout(timeoutId);
  }, [entrance, revealCards]);

  useEffect(() => {
    const container = containerRef.current;
    const wrap = wrapRef.current;
    if (!container || !wrap) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    driftState.current.enabled = !prefersReducedMotion;

    const totalWidth = finalLayout.cols * (finalLayout.cardW + finalLayout.gap);
    const totalHeight = finalLayout.rowCount * (finalLayout.cardH + finalLayout.gap);

    const updateBounds = () => {
      const rect = container.getBoundingClientRect();
      bounds.current.w = rect.width;
      bounds.current.h = rect.height;
    };
    updateBounds();

    panState.current.current.x = panState.current.target.x = -(0.1 * bounds.current.w);
    panState.current.current.y = panState.current.target.y = -(0.1 * bounds.current.h);

    const observer = new IntersectionObserver(
      (entries) => {
        isIntersecting.current = entries[0]?.isIntersecting ?? true;
      },
      { rootMargin: '200px' }
    );
    observer.observe(container);
    window.addEventListener('resize', updateBounds);

    const onDragStart = (x, y) => {
      dragState.current.active = true;
      dragState.current.startX = x;
      dragState.current.startY = y;
      dragState.current.baseX = panState.current.target.x;
      dragState.current.baseY = panState.current.target.y;
      wrap.classList.add('is-dragging');

      if (!prefersReducedMotion) {
        cardData.current.forEach((data) => {
          if (data?.img) {
            gsap.to(data.img, { scale: 0.95, duration: 0.3, ease: 'expo.out', overwrite: true });
          }
        });
      }
    };

    const onDragMove = (x, y) => {
      if (!dragState.current.active) return;
      panState.current.target.x = dragState.current.baseX + (x - dragState.current.startX);
      panState.current.target.y = dragState.current.baseY + (y - dragState.current.startY);
    };

    const onDragEnd = () => {
      if (!dragState.current.active) return;
      dragState.current.active = false;
      wrap.classList.remove('is-dragging');

      cardData.current.forEach((data) => {
        if (data?.img) {
          gsap.to(data.img, { scale: 1, duration: 0.3, ease: 'expo.out', overwrite: true });
        }
      });
    };

    const handleMouseDown = (e) => {
      if (e.button === 0) {
        e.preventDefault();
        onDragStart(e.clientX, e.clientY);
      }
    };
    const handleMouseMove = (e) => onDragMove(e.clientX, e.clientY);
    const handleMouseUp = () => onDragEnd();

    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      onDragStart(touch.clientX, touch.clientY);
    };
    const handleTouchMove = (e) => {
      if (!dragState.current.active) return;
      e.preventDefault();
      const touch = e.touches[0];
      onDragMove(touch.clientX, touch.clientY);
    };
    const handleTouchEnd = () => onDragEnd();

    wrap.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    wrap.addEventListener('touchstart', handleTouchStart, { passive: true });
    wrap.addEventListener('touchmove', handleTouchMove, { passive: false });
    wrap.addEventListener('touchend', handleTouchEnd);

    const handlePointerEnter = () => {
      cursorRef?.current?.setLabel?.('Drag');
    };
    const handlePointerLeave = () => {
      cursorRef?.current?.clearLabel?.();
    };
    wrap.addEventListener('pointerenter', handlePointerEnter);
    wrap.addEventListener('pointerleave', handlePointerLeave);

    const tick = (time) => {
      animationFrameId.current = requestAnimationFrame(tick);

      if (!isIntersecting.current) {
        lastTime.current = time;
        return;
      }

      const delta = lastTime.current ? (time - lastTime.current) / 1000 : 0;
      lastTime.current = time;

      if (driftState.current.enabled && !dragState.current.active && delta > 0) {
        panState.current.target.x += driftState.current.vx * delta;
        panState.current.target.y += driftState.current.vy * delta;
      }

      const pan = panState.current;
      pan.current.x += (pan.target.x - pan.current.x) * 0.08;
      pan.current.y += (pan.target.y - pan.current.y) * 0.08;

      const b = bounds.current;

      cardData.current.forEach((data) => {
        if (!data?.el) return;

        let x = data.x + pan.current.x + data.extraX;
        let y = data.y + pan.current.y + data.extraY;

        while (x + data.w < 0) {
          data.extraX += totalWidth;
          x += totalWidth;
        }
        while (x > b.w) {
          data.extraX -= totalWidth;
          x -= totalWidth;
        }
        while (y + data.h < 0) {
          data.extraY += totalHeight;
          y += totalHeight;
        }
        while (y > b.h) {
          data.extraY -= totalHeight;
          y -= totalHeight;
        }

        data.el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      });
    };

    animationFrameId.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId.current);
      observer.disconnect();
      window.removeEventListener('resize', updateBounds);
      wrap.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      wrap.removeEventListener('touchstart', handleTouchStart);
      wrap.removeEventListener('touchmove', handleTouchMove);
      wrap.removeEventListener('touchend', handleTouchEnd);
      wrap.removeEventListener('pointerenter', handlePointerEnter);
      wrap.removeEventListener('pointerleave', handlePointerLeave);
      cursorRef?.current?.clearLabel?.();

      cardData.current.forEach((data) => {
        if (data?.img) {
          gsap.killTweensOf(data.img);
        }
      });
    };
  }, [finalLayout]);

  return (
    <div
      ref={containerRef}
      className={`library-showcase relative h-full w-full overflow-hidden ${className}`.trim()}
      aria-hidden="true"
    >
      <div
        ref={wrapRef}
        className="library-showcase-wrap absolute inset-0 cursor-grab select-none [&.is-dragging]:cursor-grabbing"
      >
        {cardItems.map((item, index) => (
          <div
            key={index}
            ref={registerCard(index)}
            className="absolute left-0 top-0 will-change-transform"
            style={{ width: `${finalLayout.cardW}px`, height: `${finalLayout.cardH}px` }}
          >
            <img
              src={item.src}
              alt=""
              loading="lazy"
              draggable="false"
              className="block object-cover opacity-90 transition-opacity duration-300 hover:opacity-100"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
});
