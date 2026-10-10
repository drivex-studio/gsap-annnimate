import React, { forwardRef, useRef, useState, useEffect, useCallback, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const CustomCursor = forwardRef(function CustomCursor({
  className = '',
  children,
  speed = 0.7,
  ease = 'expo.out',
  size = 48,
  maxRotation = 35,
  rotationDecay = 0.92,
  velocityMultiplier = 0.5,
  hideNativeCursor = false
}, ref) {
  
  let wrapperRef = useRef(null);
  let cursorElRef = useRef(null);
  let textElRef = useRef(null);
  
  let mousePos = useRef({ x: 0, y: 0 });
  let prevMousePos = useRef({ x: 0, y: 0 });
  let velocity = useRef({ x: 0, y: 0 });
  
  let currentRotation = useRef(0);
  let targetRotation = useRef(0);
  
  let rAF = useRef(null);
  let lastTime = useRef(0);
  
  let isVisible = useRef(false);
  let isTextActive = useRef(false);
  let timeoutRef = useRef(null);

  let [isTouchDevice, setIsTouchDevice] = useState(true);
  let [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIsTouchDevice(
      'ontouchstart' in window || 
      navigator.maxTouchPoints > 0 || 
      window.matchMedia('(hover: none)').matches
    );
    setMounted(true);
  }, []);

  let { contextSafe } = useGSAP({ scope: wrapperRef });

  let moveCursor = useCallback((x, y, immediate = false) => {
    if (cursorElRef.current) {
      gsap.to(cursorElRef.current, {
        x, 
        y, 
        force3D: true, 
        overwrite: true, 
        ease, 
        duration: immediate ? 0 : speed
      });
    }
  }, [ease, speed]);

  let showCursor = useCallback(() => {
    if (!isVisible.current && cursorElRef.current) {
      isVisible.current = true;
      cursorElRef.current.classList.add('is-visible');
    }
  }, []);

  let hideCursor = useCallback(() => {
    if (isVisible.current && cursorElRef.current) {
      isVisible.current = false;
      cursorElRef.current.classList.remove('is-visible');
    }
  }, []);

  let setLabel = contextSafe((text, bgColor, textColor) => {
    if (textElRef.current && cursorElRef.current) {
      gsap.killTweensOf(textElRef.current);
      textElRef.current.innerHTML = text;
      cursorElRef.current.classList.add('is-text');
      isTextActive.current = true;
      showCursor();
      
      textElRef.current.style.backgroundColor = bgColor || '';
      textElRef.current.style.color = textColor || '';
      
      gsap.fromTo(textElRef.current, 
        { scale: 0 }, 
        { scale: 1, duration: 0.35, ease: 'back.out(1.7)', force3D: true }
      );
    }
  });

  let clearLabel = contextSafe(() => {
    if (textElRef.current && cursorElRef.current) {
      gsap.killTweensOf(textElRef.current);
      cursorElRef.current.classList.remove('is-text');
      isTextActive.current = false;
      hideCursor();
      
      gsap.to(textElRef.current, {
        scale: 0, 
        rotation: 0, 
        duration: 0.25, 
        ease: 'power2.inOut', 
        force3D: true, 
        onComplete: () => {
          if (!isTextActive.current && textElRef.current) {
            textElRef.current.innerHTML = '';
            textElRef.current.style.backgroundColor = '';
            textElRef.current.style.color = '';
          }
        }
      });
    }
  });

  useImperativeHandle(ref, () => ({
    setLabel: (text, bgColor, textColor) => setLabel(text, bgColor, textColor),
    clearLabel: () => clearLabel()
  }), [setLabel, clearLabel]);

  useGSAP(() => {
    if (isTouchDevice || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !cursorElRef.current || !textElRef.current || !wrapperRef.current) return;
    
    document.documentElement.style.setProperty('--anm-cursor-size', `${size}px`);
    gsap.set(textElRef.current, { x: 0, y: 0, xPercent: -50, yPercent: -50, scale: 0, rotation: 0, force3D: true });
    
    moveCursor(-window.innerWidth, -window.innerHeight, true);
    
    let interactables = wrapperRef.current.querySelectorAll('[data-anm-cursor-text]');
    let listeners = [];
    
    interactables.forEach(el => {
      let text = el.dataset.anmCursorText;
      if (!text) return;
      
      let handleEnter = () => { setLabel(text, el.dataset.anmCursorBg || null, el.dataset.anmCursorColor || null); };
      let handleLeave = () => { clearLabel(); };
      
      el.addEventListener('mouseenter', handleEnter);
      el.addEventListener('mouseleave', handleLeave);
      listeners.push({ element: el, handleEnter, handleLeave });
    });

    let currentTheme = null;
    
    let updateTheme = (target) => {
      if (!cursorElRef.current) return;
      let themedParent = target?.closest?.('[data-theme]');
      let parentTheme = themedParent?.dataset?.theme || 'light';
      let cursorTheme = parentTheme === 'dark' ? 'light' : 'dark';
      
      if (cursorTheme !== currentTheme) {
        currentTheme = cursorTheme;
        cursorElRef.current.setAttribute('data-cursor-theme', cursorTheme);
      }
    };

    let onMouseMove = (e) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;
      moveCursor(mousePos.current.x, mousePos.current.y);
      updateTheme(e.target);
    };
    
    document.addEventListener('mousemove', onMouseMove);

    let tick = (time) => {
      if (!lastTime.current) lastTime.current = time;
      let dt = time - lastTime.current;
      lastTime.current = time;
      
      let dx = mousePos.current.x - prevMousePos.current.x;
      
      if (dt > 0) {
        velocity.current.x = 0.7 * velocity.current.x + 0.3 * dx;
      }
      
      prevMousePos.current.x = mousePos.current.x;
      prevMousePos.current.y = mousePos.current.y;
      
      targetRotation.current = Math.max(-maxRotation, Math.min(maxRotation, velocity.current.x * velocityMultiplier));
      
      if (isTextActive.current) {
        currentRotation.current += (targetRotation.current - currentRotation.current) * 0.2;
      } else {
        currentRotation.current *= rotationDecay;
      }
      
      if (textElRef.current) {
        gsap.set(textElRef.current, { rotation: currentRotation.current, xPercent: -50, yPercent: -50, force3D: true });
      }
      
      rAF.current = requestAnimationFrame(tick);
    };

    rAF.current = requestAnimationFrame(tick);

    return () => {
      if (rAF.current) cancelAnimationFrame(rAF.current);
      clearTimeout(timeoutRef.current);
      document.removeEventListener('mousemove', onMouseMove);
      
      listeners.forEach(({ element, handleEnter, handleLeave }) => {
        element.removeEventListener('mouseenter', handleEnter);
        element.removeEventListener('mouseleave', handleLeave);
      });
      
      if (cursorElRef.current) gsap.killTweensOf(cursorElRef.current);
      if (textElRef.current) gsap.killTweensOf(textElRef.current);
    };
  }, { scope: wrapperRef, dependencies: [isTouchDevice, speed, ease, size, maxRotation, rotationDecay, velocityMultiplier] });

  let portalContent = mounted && !isTouchDevice && createPortal(
    <div ref={cursorElRef} className="anm-cursor">
      <div ref={textElRef} className="anm-cursor-text" />
    </div>,
    document.body
  );

  return (
    <React.Fragment>
      <div 
        ref={wrapperRef} 
        className={`custom_cursor_wrap ${className}`.trim()} 
        data-anm-custom-cursor={true} 
        style={hideNativeCursor ? { cursor: 'none' } : undefined}
      >
        {children}
      </div>
      {portalContent}
    </React.Fragment>
  );
});

export default CustomCursor;
