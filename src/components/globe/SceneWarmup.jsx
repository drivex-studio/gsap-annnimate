'use client'
import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';

// module id: 607601
export function SceneWarmup() {
  const { gl, scene, camera } = useThree();
  const hasWarmedUp = useRef(false);

  useEffect(() => {
    if (hasWarmedUp.current) return;

    hasWarmedUp.current = true;

    const warmup = () => {
      const startTime = performance.now();

      try {
        gl.compile(scene, camera);
      } catch (error) {
        // Preserve the original behavior: compilation errors are ignored.
      }

      logPerformance(
        `warmup ${(performance.now() - startTime).toFixed(1)}ms`
      );
    };

    if (typeof requestIdleCallback === 'function') {
      const idleCallbackId = requestIdleCallback(warmup, {
        timeout: 500,
      });

      return () => cancelIdleCallback(idleCallbackId);
    }

    const timeoutId = setTimeout(warmup, 0);

    return () => clearTimeout(timeoutId);
  }, [gl, scene, camera]);

  return null;
}

// The original logger is an empty function.
function logPerformance(message) {}