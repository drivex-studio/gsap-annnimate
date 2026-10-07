'use client'

import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { perfLog, perfMeasure } from '@/libs/utils/perfLog';

const debugLog = (...args) => 0;
const AnimationContext = createContext(null);
const defaultContextValue = {
    revealed: false,
    revealPage: () => {},
    whenRevealed: () => {},
    addReadyGate: () => () => {},
    onGatesClear: () => () => {},
    triggerPageEnter: () => {},
    getHasTriggered: () => false
};

export function useAnimation() {
    const context = useContext(AnimationContext);
    return context || defaultContextValue;
}

export default function AnimationProvider({ children }) {
    const pathname = usePathname();
    const currentPathRef = useRef(pathname);
    currentPathRef.current = pathname;

    const revealedPathRef = useRef(null);
    const [revealed, setRevealed] = useState(false);
    
    const whenRevealedSubscribers = useRef(new Set());
    const readyGates = useRef(new Set());
    const onGatesClearCallback = useRef(null);
    const isTriggeredPending = useRef(false);

    const revealPage = useCallback(() => {
        if (revealedPathRef.current === currentPathRef.current) {
            debugLog('revealPage skipped - already revealed:', currentPathRef.current);
        } else {
            revealedPathRef.current = currentPathRef.current;
            setRevealed(true);
            
            debugLog(`revealPage (${currentPathRef.current}), subscribers: ${whenRevealedSubscribers.current.size}`);
            
            perfLog('revealPage() fired', {
                path: currentPathRef.current,
                subscribers: whenRevealedSubscribers.current.size
            });

            if (typeof document !== 'undefined') {
                document.querySelectorAll('[data-page-enter-animation]').forEach(el => {
                    el.setAttribute('data-animation-started', 'true');
                });
            }

            perfMeasure('reveal wave (all whenRevealed callbacks)', () => {
                Array.from(whenRevealedSubscribers.current).forEach(callback => {
                    try {
                        callback();
                    } catch (err) {
                        console.error('Error in whenRevealed callback:', err);
                    }
                });
            });
        }
    }, []);

    const whenRevealed = useCallback((callback) => {
        if (revealedPathRef.current === currentPathRef.current) {
            try {
                callback();
            } catch (err) {
                console.error('Error in whenRevealed callback:', err);
            }
            return () => {};
        }
        whenRevealedSubscribers.current.add(callback);
        return () => whenRevealedSubscribers.current.delete(callback);
    }, []);

    useEffect(() => {
        if (revealedPathRef.current !== pathname) {
            setRevealed(false);
        }
    }, [pathname]);

    const addReadyGate = useCallback((gateId) => {
        readyGates.current.add(gateId);
        debugLog(`addReadyGate: ${gateId}, open: ${[...readyGates.current].join(', ')}`);
        
        let isReleased = false;

        return () => {
            if (!isReleased) {
                isReleased = true;
                readyGates.current.delete(gateId);
                debugLog(`gate released: ${gateId}, remaining: ${[...readyGates.current].join(', ') || '(none)'}`);
                
                if (readyGates.current.size === 0) {
                    onGatesClearCallback.current?.();
                    if (isTriggeredPending.current) {
                        isTriggeredPending.current = false;
                        revealPage();
                    }
                }
            }
        };
    }, [revealPage]);

    const onGatesClear = useCallback((callback) => {
        onGatesClearCallback.current = callback;
        if (readyGates.current.size === 0) {
            callback();
        }
        return () => {
            if (onGatesClearCallback.current === callback) {
                onGatesClearCallback.current = null;
            }
        };
    }, []);

    const triggerPageEnter = useCallback(() => {
        if (readyGates.current.size > 0) {
            isTriggeredPending.current = true;
            return;
        }
        revealPage();
    }, [revealPage]);

    const getHasTriggered = useCallback(() => {
        return revealedPathRef.current === currentPathRef.current;
    }, []);

    return (
        <AnimationContext.Provider
            value={{
                revealed,
                revealPage,
                whenRevealed,
                addReadyGate,
                onGatesClear,
                triggerPageEnter,
                getHasTriggered
            }}
        >
            {children}
        </AnimationContext.Provider>
    );
}

export function usePageEnterAnimation(callback, deps = [], name = '', enabled = true) {
    const { whenRevealed } = useAnimation();
    const callbackRef = useRef(callback);
    
    callbackRef.current = callback;
    
    useEffect(() => {
        if (enabled) {
            return whenRevealed(() => callbackRef.current());
        }
    }, [whenRevealed, enabled, ...deps]);
}
