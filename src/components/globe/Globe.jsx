"use client";

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { loadSharedImage } from '@/libs/utils/loadSharedImage';
import { useWebGLSupport } from '@/hooks/useWebGLSupport';
import { useWebGLSupport } from '@/hooks/useWebGLSupport'; // module id: 143848

// Constants
const ROTATION_X = Math.PI / 7; // original mangled: c
const PHI = Math.PI * (3 - Math.sqrt(5)); // original mangled: d
const PLANE_GEO = new THREE.PlaneGeometry(0.6, 0.44); // original mangled: f

// Debugger stub
function debugLog(msg) {} // original mangled: p

// Warmup component to compile shaders early
function Warmup() { // original mangled: m
  let { gl, scene, camera } = useThree();
  let hasWarmedUp = useRef(false); // original mangled: n
  
  useEffect(() => {
    if (hasWarmedUp.current) return;
    hasWarmedUp.current = true;
    
    let compileShaders = () => { // original mangled: a
      let start = performance.now(); // original mangled: n
      try {
        gl.compile(scene, camera);
      } catch (e) {}
      debugLog(`warmup ${(performance.now() - start).toFixed(1)}ms`);
    };
    
    if (typeof requestIdleCallback === "function") {
      let handle = requestIdleCallback(compileShaders, { timeout: 500 });
      return () => cancelIdleCallback(handle);
    }
    
    let timeoutId = setTimeout(compileShaders, 0);
    return () => clearTimeout(timeoutId);
  }, [gl, scene, camera]);
  
  return null;
}

// Single Image Node on the Globe
function GlobeNode({ position, rotation, texture, wantsPlay, revealDelay, reducedMotion }) { // original mangled: g
  let meshRef = useRef(null); // original mangled: c
  let animRef = useRef(null); // original mangled: d
  
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(+!!reducedMotion);
    }
  }, [reducedMotion]);
  
  useEffect(() => {
    if (wantsPlay && meshRef.current) {
      if (reducedMotion) {
        meshRef.current.scale.setScalar(1);
        return;
      }
      
      animRef.current?.kill();
      animRef.current = gsap.to(meshRef.current.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 1.1,
        ease: "power3.out",
        delay: revealDelay
      });
      
      return () => animRef.current?.kill();
    }
  }, [wantsPlay, revealDelay, reducedMotion]);
  
  return (
    <mesh ref={meshRef} position={position} rotation={rotation} geometry={PLANE_GEO} frustumCulled={false}>
      <meshBasicMaterial map={texture} side={THREE.FrontSide} />
    </mesh>
  );
}

// Custom hook to incrementally load textures via idle callbacks
function useGlobeTextures(images) {
  let { gl } = useThree(); // original mangled: t
  let [, setForceRender] = useState(0); // original mangled: r
  let stateRef = useRef({ // original mangled: n
    textures: [],
    uploaded: new Set(),
    target: 0,
    loadedCount: 0,
    initialized: false
  });
  
  useEffect(() => {
    let state = stateRef.current; // original mangled: a
    if (state.initialized) return;
    state.initialized = true;
    
    let targetCount = Math.min(70, images.length); // original mangled: o
    if (state.target = targetCount, targetCount === 0) return;
    
    let startTime = performance.now(); // original mangled: l
    let isCancelled = false; // original mangled: s
    let currentIdx = 0; // original mangled: c
    let activeLoads = 0; // original mangled: d
    let handles = new Set(); // original mangled: f
    
    function processQueue() { // original mangled: m
      if (isCancelled) return;
      while (activeLoads < 4 && currentIdx < targetCount) {
        let loadIdx = currentIdx++;
        activeLoads++;
        
        let handle = typeof requestIdleCallback === "function" 
          ? requestIdleCallback(() => fetchAndUpload(loadIdx, handle), { timeout: 2000 })
          : setTimeout(() => fetchAndUpload(loadIdx, null), 0);
          
        if (handle) handles.add(handle);
      }
    }
    
    async function fetchAndUpload(index, handle) { // original mangled: g
      if (handle) handles.delete(handle);
      if (isCancelled) return;
      
      try {
        let bitmap = await loadSharedImage(images[index], { maxWidth: 384 }); // original mangled: c
        if (isCancelled) {
          bitmap.close?.();
          return;
        }
        
        let tex = new THREE.Texture(bitmap); // original mangled: d
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy());
        tex.flipY = false;
        tex.needsUpdate = true;
        
        let uploadStart = performance.now(); // original mangled: f
        gl.initTexture(tex);
        let uploadTime = performance.now() - uploadStart; // original mangled: m
        
        if (uploadTime > 10) debugLog(`upload-slow #${index} ${uploadTime.toFixed(1)}ms`);
        
        state.textures[index] = tex;
        state.uploaded.add(index);
        state.loadedCount++;
        setForceRender(prev => prev + 1);
        
        if (state.loadedCount === targetCount) {
          debugLog(`textures-ready (${(performance.now() - startTime).toFixed(0)}ms total)`);
        }
      } catch (err) {
        state.loadedCount++;
      } finally {
        activeLoads--;
        processQueue();
      }
    }
    
    processQueue();
    
    return () => {
      isCancelled = true;
      for (let h of handles) {
        if (typeof cancelIdleCallback === "function") {
          try { cancelIdleCallback(h); } catch (e) { clearTimeout(h); }
        } else {
          clearTimeout(h);
        }
      }
      handles.clear();
      
      for (let tex of state.textures) tex?.dispose();
      
      state.textures = [];
      state.uploaded.clear();
      state.target = 0;
      state.loadedCount = 0;
      state.initialized = false;
    };
  }, [images, gl]);
  
  return { textures: stateRef.current.textures, uploaded: stateRef.current.uploaded };
}

// Main Interactive Globe Manager
function InteractiveGlobe({ images, wantsPlay, reducedMotion }) { // original mangled: x
  let groupRef = useRef(null); // original mangled: s
  let physics = useRef({ // original mangled: f
    spin: 0,
    inertia: 0,
    dragAccum: 0,
    dragging: false,
    lastX: 0,
    firstRenderLogged: false,
    frames: 0,
    droppedFrames: 0,
    maxDt: 0,
    lastLog: performance.now()
  });
  
  let { textures, uploaded } = useGlobeTextures(images);
  
  // Calculate spherical Fibonacci points
  let nodesData = useMemo(() => { // original mangled: w
    let arr = [];
    for (let i = 0; i < 70; i++) {
      let yStr = 1 - (i / 69) * 2; // original mangled: r
      let radius = Math.sqrt(Math.max(0, 1 - yStr * yStr)); // original mangled: n
      let theta = i * PHI; // original mangled: a
      
      let x = Math.cos(theta) * radius * 3; // original mangled: o
      let y = yStr * 3; // original mangled: l
      let z = Math.sin(theta) * radius * 3; // original mangled: u
      
      let lookMat = new THREE.Matrix4().lookAt(
        new THREE.Vector3(x, y, z),
        new THREE.Vector3(x * 2, y * 2, z * 2),
        new THREE.Vector3(0, 1, 0)
      ); // original mangled: s
      
      let quat = new THREE.Quaternion().setFromRotationMatrix(lookMat); // original mangled: c
      let euler = new THREE.Euler().setFromQuaternion(quat); // original mangled: f
      
      arr.push({
        position: [x, y, z],
        rotation: [euler.x, euler.y, euler.z],
        revealDelay: 0.7 * Math.random()
      });
    }
    return arr;
  }, []);

  // Update loop for rotation and drag physics
  useFrame((state, delta) => {
    let p = physics.current; // original mangled: r
    p.frames++;
    if (delta > p.maxDt) p.maxDt = delta;
    if (delta > 0.033) p.droppedFrames++;
    if (!p.firstRenderLogged) {
      p.firstRenderLogged = true;
      debugLog("first-render");
    }
    
    let dragForce = -0.0015 * p.dragAccum; // original mangled: n
    p.dragAccum = 0;
    
    if (p.dragging) {
      p.inertia = delta > 0 ? Math.max(-1.4, Math.min(1.4, dragForce / delta)) : 0;
    } else {
      p.inertia *= Math.exp(-2.4 * delta);
    }
    
    if (!reducedMotion) p.spin += -0.05 * delta;
    p.spin += dragForce;
    if (!p.dragging) p.spin += p.inertia * delta;
    
    if (groupRef.current) groupRef.current.rotation.y = p.spin;
    
    let now = performance.now(); // original mangled: a
    if (now - p.lastLog > 1000) {
      let fps = p.frames / ((now - p.lastLog) / 1000);
      debugLog(`fps=${fps.toFixed(0)} maxDt=${(p.maxDt * 1000).toFixed(1)}ms dropped=${p.droppedFrames}`);
      p.frames = 0;
      p.droppedFrames = 0;
      p.maxDt = 0;
      p.lastLog = now;
    }
  });

  let { gl } = useThree(); // original mangled: y
  
  // Drag event bindings
  useEffect(() => {
    let dom = gl.domElement; // original mangled: e
    let p = physics.current; // original mangled: t
    
    function onDown(e) { // original mangled: r
      p.dragging = true;
      p.lastX = e.clientX;
      dom.setPointerCapture?.(e.pointerId);
      dom.style.cursor = "grabbing";
    }
    
    function onMove(e) { // original mangled: n
      if (p.dragging) {
        p.dragAccum += e.clientX - p.lastX;
        p.lastX = e.clientX;
      }
    }
    
    function onUp(e) { // original mangled: a
      if (p.dragging) {
        p.dragging = false;
        dom.releasePointerCapture?.(e.pointerId);
        dom.style.cursor = "grab";
      }
    }
    
    dom.style.cursor = "grab";
    dom.style.touchAction = "pan-y";
    
    dom.addEventListener("pointerdown", onDown);
    dom.addEventListener("pointermove", onMove);
    dom.addEventListener("pointerup", onUp);
    dom.addEventListener("pointercancel", onUp);
    
    return () => {
      dom.removeEventListener("pointerdown", onDown);
      dom.removeEventListener("pointermove", onMove);
      dom.removeEventListener("pointerup", onUp);
      dom.removeEventListener("pointercancel", onUp);
    };
  }, [gl]);

  return (
    <group rotation={[-ROTATION_X, 0, -(0.4 * ROTATION_X)]}>
      <group ref={groupRef}>
        {nodesData.map((node, index) => {
          let tex = textures[index]; // original mangled: a
          return tex && uploaded.has(index) ? (
            <GlobeNode key="{index}" position="{node.position}" reducedMotion="{reducedMotion}" revealDelay="{node.revealDelay}" rotation="{node.rotation}" texture="{tex}" wantsPlay="{wantsPlay}"/>
          ) : null;
        })}
      </group>
    </group>
  );
}

if (typeof performance !== "undefined") performance.now();

// module id: 607601
export default function Globe({ images = [], wantsPlay = false, active = true }) {
  debugLog("mount");
  let [reducedMotion, setReducedMotion] = useState(false); // original mangled: i, l
  
  useEffect(() => {
    let mql = window.matchMedia("(prefers-reduced-motion: reduce)"); // original mangled: e
    setReducedMotion(mql.matches);
    let onChange = (e) => setReducedMotion(e.matches); // original mangled: t
    if (mql.addEventListener) {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }
  }, []);

  let supportsWebGL = useWebGLSupport();
  
  if (!supportsWebGL) return null;

  return (
    <Canvas "always" "low-power" "never"} "transparent" 0, 1.5]} 11], 35 : ? [0, alpha: antialias: background: camera="{{" className="size-full block" dpr="{[1," false, fov: frameloop="{active" gl onCreated="{({" position: powerPreference: style="{{" true, }}> {
        debugLog("r3f-created");
        gl.domElement.addEventListener("webglcontextlost", e => e.preventDefault());
      }}
    >
      <Warmup/>
      <InteractiveGlobe images="{images}" reducedMotion="{reducedMotion}" wantsPlay="{wantsPlay}"/>
    </Canvas>
  );
}
