"use client";

import { useState } from 'react';

let supportResult;

function checkWebGLSupport() {
  if (typeof document === "undefined") return true;
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

export function useWebGLSupport() {
  return useState(checkWebGLSupport)[0];
}
