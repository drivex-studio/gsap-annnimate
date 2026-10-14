import { useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { loadSharedImage } from '@/libs/utils/loadSharedImage';

const MAX_TEXTURES = 70;
const MAX_CONCURRENT_LOADS = 4;
const MAX_IMAGE_WIDTH = 384;

function logPerformance(message) {}

export function useImageTextures(images) {
  const { gl } = useThree();
  const [, setLoadRevision] = useState(0);

  const textureStateRef = useRef({
    textures: [],
    uploaded: new Set(),
    target: 0,
    loadedCount: 0,
    initialized: false,
  });

  useEffect(() => {
    const state = textureStateRef.current;

    if (state.initialized) return;

    state.initialized = true;

    const targetCount = Math.min(MAX_TEXTURES, images.length);
    state.target = targetCount;

    if (targetCount === 0) return;

    const startTime = performance.now();
    let cancelled = false;
    let nextIndex = 0;
    let activeLoads = 0;

    const scheduledTasks = new Set();

    function scheduleNextLoads() {
      if (cancelled) return;

      while (
        activeLoads < MAX_CONCURRENT_LOADS &&
        nextIndex < targetCount
      ) {
        const imageIndex = nextIndex++;
        activeLoads++;

        if (typeof requestIdleCallback === 'function') {
          let taskId;

          taskId = requestIdleCallback(
            () => loadTexture(imageIndex, taskId),
            { timeout: 2000 }
          );

          scheduledTasks.add(taskId);
        } else {
          const taskId = setTimeout(
            () => loadTexture(imageIndex, taskId),
            0
          );

          scheduledTasks.add(taskId);
        }
      }
    }

    async function loadTexture(imageIndex, taskId) {
      if (taskId != null) {
        scheduledTasks.delete(taskId);
      }

      if (cancelled) {
        activeLoads--;
        return;
      }

      try {
        const image = await loadSharedImage(images[imageIndex], {
          maxWidth: MAX_IMAGE_WIDTH,
        });

        if (cancelled) {
          image.close?.();
          return;
        }

        const texture = new THREE.Texture(image);

        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(
          4,
          gl.capabilities.getMaxAnisotropy()
        );
        texture.flipY = false;
        texture.needsUpdate = true;

        const uploadStart = performance.now();

        gl.initTexture(texture);

        const uploadDuration = performance.now() - uploadStart;

        if (uploadDuration > 10) {
          logPerformance(
            `upload-slow #${imageIndex} ${uploadDuration.toFixed(1)}ms`
          );
        }

        state.textures[imageIndex] = texture;
        state.uploaded.add(imageIndex);
        state.loadedCount++;

        setLoadRevision((revision) => revision + 1);

        if (state.loadedCount === targetCount) {
          logPerformance(
            `textures-ready (${(
              performance.now() - startTime
            ).toFixed(0)}ms total)`
          );
        }
      } catch (error) {
        state.loadedCount++;
      } finally {
        activeLoads--;
        scheduleNextLoads();
      }
    }

    scheduleNextLoads();

    return () => {
      cancelled = true;

      for (const taskId of scheduledTasks) {
        if (typeof requestIdleCallback === 'function') {
          try {
            cancelIdleCallback(taskId);
          } catch (error) {
            clearTimeout(taskId);
          }
        } else {
          clearTimeout(taskId);
        }
      }

      scheduledTasks.clear();

      for (const texture of state.textures) {
        texture?.dispose();
      }

      state.textures = [];
      state.uploaded.clear();
      state.target = 0;
      state.loadedCount = 0;
      state.initialized = false;
    };
  }, [images, gl]);

  return {
    textures: textureStateRef.current.textures,
    uploaded: textureStateRef.current.uploaded,
  };
}
