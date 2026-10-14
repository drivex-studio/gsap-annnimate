"use client";

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { loadSharedImage } from '@/libs/utils/loadSharedImage';
import { useWebGLSupport } from '@/components/globe/hooks/useWebGLSupport';

const ROTATION_X = Math.PI / 7;
const PHI = Math.PI * (3 - Math.sqrt(5));
const PLANE_GEO = new THREE.PlaneGeometry(0.6, 0.44);

function debugLog(msg) {}

function Warmup() {
  let { gl, scene, camera } = useThree();
  let hasWarmedUp = useRef(false);
  
  useEffect(() => {
    if (hasWarmedUp.current) return;
    hasWarmedUp.current = true;
    
    let compileShaders = () => {
      let start = performance.now();
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

function GlobeNode({ position, rotation, texture, wantsPlay, revealDelay, reducedMotion }) {
  let meshRef = useRef(null);
  let animRef = useRef(null);
  
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

function useGlobeTextures(images) {
  let { gl } = useThree();
  let [, setForceRender] = useState(0);
  let stateRef = useRef({
    textures: [],
    uploaded: new Set(),
    target: 0,
    loadedCount: 0,
    initialized: false
  });
  
  useEffect(() => {
    let state = stateRef.current;
    if (state.initialized) return;
    state.initialized = true;
    
    let targetCount = Math.min(70, images.length);
    if (state.target = targetCount, targetCount === 0) return;
    
    let startTime = performance.now();
    let isCancelled = false;
    let currentIdx = 0;
    let activeLoads = 0;
    let handles = new Set();
    
    function processQueue() {
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
    
    async function fetchAndUpload(index, handle) {
      if (handle) handles.delete(handle);
      if (isCancelled) return;
      
      try {
        let bitmap = await loadSharedImage(images[index], { maxWidth: 384 });
        if (isCancelled) {
          bitmap.close?.();
          return;
        }
        
        let tex = new THREE.Texture(bitmap);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy());
        tex.flipY = false;
        tex.needsUpdate = true;
        
        let uploadStart = performance.now();
        gl.initTexture(tex);
        let uploadTime = performance.now() - uploadStart;
        
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

function InteractiveGlobe({ images, wantsPlay, reducedMotion }) {
  let groupRef = useRef(null);
  let physics = useRef({
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
  
  let nodesData = useMemo(() => {
    let arr = [];
    for (let i = 0; i < 70; i++) {
      let yStr = 1 - (i / 69) * 2;
      let radius = Math.sqrt(Math.max(0, 1 - yStr * yStr));
      let theta = i * PHI;
      
      let x = Math.cos(theta) * radius * 3;
      let y = yStr * 3;
      let z = Math.sin(theta) * radius * 3;
      
      let lookMat = new THREE.Matrix4().lookAt(
        new THREE.Vector3(x, y, z),
        new THREE.Vector3(x * 2, y * 2, z * 2),
        new THREE.Vector3(0, 1, 0)
      );
      
      let quat = new THREE.Quaternion().setFromRotationMatrix(lookMat);
      let euler = new THREE.Euler().setFromQuaternion(quat);
      
      arr.push({
        position: [x, y, z],
        rotation: [euler.x, euler.y, euler.z],
        revealDelay: 0.7 * Math.random()
      });
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    let p = physics.current;
    p.frames++;
    if (delta > p.maxDt) p.maxDt = delta;
    if (delta > 0.033) p.droppedFrames++;
    if (!p.firstRenderLogged) {
      p.firstRenderLogged = true;
      debugLog("first-render");
    }
    
    let dragForce = -0.0015 * p.dragAccum;
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
    
    let now = performance.now();
    if (now - p.lastLog > 1000) {
      let fps = p.frames / ((now - p.lastLog) / 1000);
      debugLog(`fps=${fps.toFixed(0)} maxDt=${(p.maxDt * 1000).toFixed(1)}ms dropped=${p.droppedFrames}`);
      p.frames = 0;
      p.droppedFrames = 0;
      p.maxDt = 0;
      p.lastLog = now;
    }
  });

  let { gl } = useThree();
  
  useEffect(() => {
    let dom = gl.domElement;
    let p = physics.current;
    
    function onDown(e) {
      p.dragging = true;
      p.lastX = e.clientX;
      dom.setPointerCapture?.(e.pointerId);
      dom.style.cursor = "grabbing";
    }
    
    function onMove(e) {
      if (p.dragging) {
        p.dragAccum += e.clientX - p.lastX;
        p.lastX = e.clientX;
      }
    }
    
    function onUp(e) {
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
          let tex = textures[index];
          return tex && uploaded.has(index) ? (
            <GlobeNode key="{index}" position="{node.position}" reducedMotion="{reducedMotion}" revealDelay="{node.revealDelay}" rotation="{node.rotation}" texture="{tex}" wantsPlay="{wantsPlay}"/>
          ) : null;
        })}
      </group>
    </group>
  );
}

if (typeof performance !== "undefined") performance.now();

export default function Globe({ images = [], wantsPlay = false, active = true }) {
  debugLog("mount");
  let [reducedMotion, setReducedMotion] = useState(false);
  
  useEffect(() => {
    let mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    let onChange = (e) => setReducedMotion(e.matches);
    if (mql.addEventListener) {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    }
  }, []);

  let supportsWebGL = useWebGLSupport();
  
  if (!supportsWebGL) return null;

    return (
      <Canvas
        className="size-full block"
        style={{ background: "transparent" }}
        frameloop={active ? "always" : "never"}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 11], fov: 35 }}
        gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
        onCreated={({ gl }) => {
          debugLog("r3f-created");
          gl.domElement.addEventListener("webglcontextlost", e => e.preventDefault());
        }}
      >
        <Warmup />
        <InteractiveGlobe 
          images={images} 
          reducedMotion={reducedMotion} 
          wantsPlay={wantsPlay} 
        />
      </Canvas>
    );
}
