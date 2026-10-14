import { useState } from 'react';

let cachedWebGLSupport;

function detectWebGLSupport() {
  if (typeof document === 'undefined') {
    return true;
  }

  if (cachedWebGLSupport !== undefined) {
    return cachedWebGLSupport;
  }

  try {
    const canvas = document.createElement('canvas');
    const context =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');

    cachedWebGLSupport = !!context;

    try {
      context
        ?.getExtension?.('WEBGL_lose_context')
        ?.loseContext?.();
    } catch (error) {
    }
  } catch (error) {
    cachedWebGLSupport = false;
  }

  return cachedWebGLSupport;
}

export function useWebGLSupport() {
  return useState(detectWebGLSupport)[0];
}
