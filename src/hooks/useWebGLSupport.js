"use client";

import { useState } from 'react';

let supportResult; // original mangled: t

// module id: 143848
function checkWebGLSupport() { // original mangled: n
  if (typeof document === "undefined") return true; // SSR fallback
  if (supportResult !== undefined) return supportResult;
  
  try {
    let canvas = document.createElement("canvas");
    let gl = canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    supportResult = !!gl;
    
    try {
      gl?.getExtension?.("WEBGL_lose_context")?.loseContext?.();
    } catch (e) {}
  } catch (e) {
    supportResult = false;
  }
  
  return supportResult;
}

export function useWebGLSupport() { // exported implicitly via module s[]
  return useState(checkWebGLSupport)[0];
}
