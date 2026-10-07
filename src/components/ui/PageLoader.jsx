'use client'
import React, { useRef, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { getLayoutType } from '@/libs/config/GetLayoutType';
import { useAnimation } from '@/providers/AnimationProvider';
import BrandLogo from '@/components/ui/BrandLogo';
import { perfLog } from '@/libs/utils/perfLog';

const debugLog = (...args) => 0;

function Preloader({ onComplete }) {
    const rootRef = useRef(null);
    const bgRef = useRef(null);
    const logoRef = useRef(null);

    const { revealPage, onGatesClear } = useAnimation();

    const isRevealedRef = useRef(false);
    const isCompletedRef = useRef(false);
    const timelineRef = useRef(null);
    const logoDrawnRef = useRef(false);
    const gatesClearedRef = useRef(false);
    const logoDelayCompleteRef = useRef(false);
    const timeoutRef = useRef(null);

    const reveal = (isInstant) => {
        if (isRevealedRef.current) return;
        isRevealedRef.current = true;
        
        if (typeof document !== 'undefined') {
            document.body.setAttribute('data-preloader-ready', 'true');
        }
        
        revealPage();
        
        debugLog('startReveal, instant =', isInstant);
        perfLog('preloader: cover lifting -> revealPage()', { instant: isInstant });

        const handleTimelineComplete = () => {
            if (!isCompletedRef.current) {
                isCompletedRef.current = true;
                debugLog('finish() -> onComplete (unmount)');
                perfLog('preloader: cover removed (done)');
                onComplete?.();
            }
        };

        const elementsToFade = [logoRef.current, bgRef.current].filter(Boolean);

        if (isInstant) {
            gsap.set(elementsToFade, { autoAlpha: 0 });
            handleTimelineComplete();
            return;
        }

        const tl = gsap.timeline({ onComplete: handleTimelineComplete });
        timelineRef.current = tl;
        tl.to(elementsToFade, { autoAlpha: 0, duration: 0.4, ease: 'power2.inOut' }, 0);
    };

    const checkRevealReady = () => {
        if (logoDrawnRef.current && (gatesClearedRef.current || logoDelayCompleteRef.current)) {
            reveal(false);
        }
    };

    useEffect(() => {
        return onGatesClear(() => {
            debugLog('gates clear');
            perfLog('preloader: ready-gates clear (fonts)');
            gatesClearedRef.current = true;
            checkRevealReady();
        });
    }, []);

    const handleLogoDrawn = () => {
        if (!logoDrawnRef.current) {
            logoDrawnRef.current = true;
            debugLog('logo drawn');
            perfLog('preloader: logo drawn');
            timeoutRef.current = setTimeout(() => {
                logoDelayCompleteRef.current = true;
                checkRevealReady();
            }, 400);
            checkRevealReady();
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            debugLog('SAFETY timeout fired. revealed =', isRevealedRef.current);
            perfLog('preloader: SAFETY timeout fired (cover held too long)');
            reveal(true);
        }, 1200);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        debugLog('mounted');
        return () => {
            debugLog('unmounting');
            timelineRef.current?.kill();
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    useGSAP(() => {
        debugLog('useGSAP run');
        const logoContainer = logoRef.current;
        const brandPaths = Array.from(logoContainer?.querySelectorAll('[data-pass="brand"] path') || []);
        const fgPaths = Array.from(logoContainer?.querySelectorAll('[data-pass="fg"] path') || []);

        const setDash = (paths) => {
            paths.forEach((path) => {
                const totalLength = path.getTotalLength();
                gsap.set(path, { strokeDasharray: totalLength, strokeDashoffset: totalLength });
            });
        };

        const mm = gsap.matchMedia();

        mm.add('(prefers-reduced-motion: no-preference)', () => {
            debugLog('branch: no-preference, arches:', brandPaths.length);
            setDash(brandPaths);
            setDash(fgPaths);
            gsap.set(logoContainer, { autoAlpha: 1 });

            const staggerConfig = { each: 0.06 };
            const maxDuration = 0.4 + 0.06 * Math.max(0, brandPaths.length - 1);
            const tl = gsap.timeline();

            tl.to(brandPaths, { strokeDashoffset: 0, duration: 0.4, ease: 'expo.inOut', stagger: staggerConfig }, 0);
            tl.to(fgPaths, { strokeDashoffset: 0, duration: 0.4, ease: 'expo.inOut', stagger: staggerConfig }, 0.1);
            
            tl.call(() => {
                debugLog('logo draw ~95% -> requestReveal');
                handleLogoDrawn();
            }, [], (0.1 + maxDuration) * 0.95);

            return () => tl.kill();
        });

        mm.add('(prefers-reduced-motion: reduce)', () => {
            debugLog('branch: reduce');
            gsap.set([...brandPaths, ...fgPaths], { strokeDasharray: 'none', strokeDashoffset: 0 });
            gsap.set(brandPaths, { autoAlpha: 0 });
            gsap.set(logoContainer, { autoAlpha: 1 });

            const delayed = gsap.delayedCall(0.3, () => {
                debugLog('reduce: requestReveal');
                handleLogoDrawn();
            });
            return () => delayed.kill();
        });

        return () => mm.revert();
    }, { scope: rootRef });

    const logoClasses = 'col-start-1 row-start-1 h-auto w-[clamp(120px,26vw,168px)]';

    return (
        <div
            id="preloader-root"
            ref={rootRef}
            className="fixed inset-0 z-[320] overflow-hidden"
            style={{ pointerEvents: 'none' }}
            aria-hidden="true"
        >
            <div ref={bgRef} className="absolute inset-0 bg-[#141314]" />
            <div
                ref={logoRef}
                className="absolute inset-0 m-auto z-[2] grid h-max w-max place-items-center"
                style={{ opacity: 0 }}
            >
                <BrandLogo data-pass="brand" className={`${logoClasses} text-brand`} />
                <BrandLogo data-pass="fg" className={`${logoClasses} text-[#eeeeee]`} />
            </div>
        </div>
    );
}

function isSkipPath(pathname) {
    return (
        pathname === '/learn' ||
        pathname.startsWith('/learn/') ||
        pathname === '/compare' ||
        pathname.startsWith('/compare/') ||
        pathname === '/starter-pack'
    );
}

export default function PreloaderWrapper() {
    const pathname = usePathname();
    const { revealPage } = useAnimation();
    const isFirstRenderRef = useRef(true);

    const [showPreloader, setShowPreloader] = useState(() => {
        return getLayoutType(pathname) === 'marketing' && !isSkipPath(pathname);
    });

    debugLog('render, pathname =', pathname, 'layout =', getLayoutType(pathname), 'showPreloader =', showPreloader);

    useEffect(() => {
        if (getLayoutType(pathname) !== 'marketing' || isSkipPath(pathname)) {
            if (typeof document !== 'undefined') {
                document.body.setAttribute('data-preloader-ready', 'true');
            }
            if (isFirstRenderRef.current) {
                isFirstRenderRef.current = false;
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => revealPage());
                });
            }
        }
    }, [pathname, revealPage]);

    if (!showPreloader) return null;

    return (
        <Preloader
            onComplete={() => {
                debugLog('handlePreloaderComplete -> unmount preloader');
                setShowPreloader(false);
                if (typeof document !== 'undefined') {
                    document.body.setAttribute('data-preloader-ready', 'true');
                }
            }}
        />
    );
}
