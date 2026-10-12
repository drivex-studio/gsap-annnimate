'use client';
import React, { useRef } from 'react';
import {
  InertiaPlugin,
  MotionPathPlugin,
  Draggable,
  useGSAP, 
  gsap
} from '@/libs/utils/vendor';

export default function CircularSlider({
  className = '',
  images = [],
  type = 'snap',
  autoplay = 0,
  duration = 1,
  ease = 'elastic.out(1, 0.8)',
  showControls = true
}) {
  let wrapperRef = useRef(null);
  let sliderWrapRef = useRef(null);
  let containerRef = useRef(null);
  let svgRef = useRef(null);
  let pathRef = useRef(null);
  let itemRefs = useRef([]);
  let prevRef = useRef(null);
  let nextRef = useRef(null);
  
  let state = useRef({
    isDragging: false,
    arrowAnimating: false,
    autoplayTimer: null,
    autoplayTween: null,
    draggableInstance: null,
    resizeTimeout: null,
    circlePath: null,
    targetRotation: 0
  });

  useGSAP(() => {
    let wrap = sliderWrapRef.current;
    let container = containerRef.current;
    let svg = svgRef.current;
    let pathElement = pathRef.current;
    let items = itemRefs.current.filter(Boolean);
    
    if (!wrap || !container || !svg || !pathElement || !items.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    
    let totalItems = items.length;
    let step = 360 / totalItems;
    let isSnap = type === 'snap';
    let currentState = state.current;
    
    currentState.isDragging = false;
    currentState.circlePath = null;
    currentState.targetRotation = 0;
    
    let setupLayout = (isResize = false) => {
      let winWidth = window.innerWidth;
      let firstImg = items[0]?.querySelector('.circular_slider_image');
      let imgWidth = firstImg ? firstImg.offsetWidth : 360;
      let multiplier = parseFloat(getComputedStyle(wrap).getPropertyValue('--anm-circle-multiplier') || '') || 8;
      let circleSize = Math.max(imgWidth * multiplier, winWidth + 800);
      
      let currentRotation = isResize && currentState.draggableInstance ? gsap.getProperty(container, 'rotation') : 0;
      currentState.targetRotation = isResize && isSnap ? gsap.utils.snap(step, currentRotation) : currentRotation;
      
      gsap.set(container, {
        position: 'absolute', width: circleSize, height: circleSize, left: '50%', top: '50%',
        xPercent: -50, display: 'block', overflow: 'visible', padding: 0, gap: 0,
        rotation: currentRotation, force3D: true
      });
      
      gsap.set(svg, { display: 'block', position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' });
      gsap.set(items, { position: 'absolute', flex: 'none' });
      
      if (!currentState.circlePath) {
        currentState.circlePath = MotionPathPlugin.convertToPath(pathElement, false)[0];
        currentState.circlePath.id = 'cs-path-' + Math.random().toString(36).slice(2, 9);
        svg.prepend(currentState.circlePath);
      }
      
      gsap.set(items, {
        force3D: true,
        motionPath: { path: currentState.circlePath, align: currentState.circlePath, alignOrigin: [0.5, 0.5], start: -0.25, end: index => index / totalItems - 0.25, autoRotate: true }
      });
    };
    
    let clearAutoplay = () => {
      if (currentState.autoplayTimer) {
        clearInterval(currentState.autoplayTimer);
        currentState.autoplayTimer = null;
      }
      if (currentState.autoplayTween) {
        currentState.autoplayTween.kill();
        currentState.autoplayTween = null;
      }
    };
    
    let rotateBy = direction => {
      if (currentState.draggableInstance) {
        if (!currentState.arrowAnimating) {
          let currentRot = gsap.getProperty(container, 'rotation');
          currentState.targetRotation = isSnap ? gsap.utils.snap(step, currentRot) : currentRot;
        }
        currentState.targetRotation += direction * step;
        currentState.arrowAnimating = true;
        gsap.to(container, { rotation: currentState.targetRotation, duration, ease, overwrite: 'auto', force3D: true });
      }
    };
    
    let startAutoplay = () => {
      if (autoplay <= 0 || currentState.isDragging) return;
      if (isSnap) {
        if (!currentState.autoplayTimer) {
          currentState.autoplayTimer = setInterval(() => {
            if (!currentState.isDragging) rotateBy(-1);
          }, autoplay);
        }
      } else {
        let currentRot = gsap.getProperty(container, 'rotation');
        currentState.autoplayTween = gsap.to(container, {
          rotation: currentRot - 360, duration: (autoplay / 1000) * 10, ease: 'none', repeat: -1
        });
      }
    };
    
    let initDraggable = () => {
      if (currentState.draggableInstance) {
        currentState.draggableInstance.kill();
        currentState.draggableInstance = null;
      }
      currentState.draggableInstance = Draggable.create(container, {
        type: 'rotation',
        inertia: true,
        cursor: 'grab',
        activeCursor: 'grabbing',
        allowNativeTouchScrolling: true,
        snap: !!isSnap && (val => gsap.utils.snap(step, val)),
        onDragStart() {
          currentState.isDragging = true;
          currentState.arrowAnimating = false;
          clearAutoplay();
        },
        onDragEnd() {
          currentState.isDragging = false;
          startAutoplay();
        }
      })[0];
    };
    
    setupLayout();
    initDraggable();
    startAutoplay();
    
    let handleResize = () => {
      clearTimeout(currentState.resizeTimeout);
      currentState.resizeTimeout = setTimeout(() => {
        clearAutoplay();
        setupLayout(true);
        initDraggable();
        if (!currentState.isDragging) startAutoplay();
      }, 250);
    };
    
    let handleVisibility = () => {
      if (document.hidden) {
        clearAutoplay();
      } else if (!currentState.isDragging) {
        startAutoplay();
      }
    };
    
    let prevBtn = prevRef.current;
    let nextBtn = nextRef.current;
    
    let onNext = () => { clearAutoplay(); rotateBy(1); startAutoplay(); };
    let onPrev = () => { clearAutoplay(); rotateBy(-1); startAutoplay(); };
    
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibility);
    prevBtn?.addEventListener('click', onNext);
    nextBtn?.addEventListener('click', onPrev);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      prevBtn?.removeEventListener('click', onNext);
      nextBtn?.removeEventListener('click', onPrev);
      clearTimeout(currentState.resizeTimeout);
      clearAutoplay();
      if (currentState.draggableInstance) {
        currentState.draggableInstance.kill();
        currentState.draggableInstance = null;
      }
      if (currentState.circlePath?.parentNode) {
        currentState.circlePath.parentNode.removeChild(currentState.circlePath);
      }
      currentState.circlePath = null;
    };
  }, { scope: wrapperRef, dependencies: [type, autoplay, duration, ease, images.length], revertOnUpdate: true });

  return (
    <div ref={wrapperRef} className={['circular_slider_demo_wrap', className].filter(Boolean).join(' ')}>
      <div ref={sliderWrapRef} className="circular_slider_wrap" data-anm-circular-slider={true}>
        <div ref={containerRef} className="circular_slider_container" data-anm-circular-slider-container={true}>
          <svg ref={svgRef} className="circular_slider_svg" viewBox="0 0 200 200">
            <circle ref={pathRef} className="circular_slider_path" data-anm-circular-slider-path={true} cx="100" cy="100" r="100" />
          </svg>
          {images.map((img, idx) => (
            <div key={idx} ref={el => { itemRefs.current[idx] = el; }} className="circular_slider_item" data-anm-circular-slider-item={true}>
              <img src={img.src} alt={img.alt} className="circular_slider_image" />
            </div>
          ))}
        </div>
      </div>
      {showControls && (
        <div className="circular_slider_controls">
          <button ref={prevRef} className="circular_slider_arrow" data-anm-circular-slider-prev={true} aria-label="Previous slide">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button ref={nextRef} className="circular_slider_arrow" data-anm-circular-slider-next={true} aria-label="Next slide">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
