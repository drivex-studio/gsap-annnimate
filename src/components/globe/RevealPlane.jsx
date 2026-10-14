'use client'
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import * as THREE from 'three';

const planeGeometry = new THREE.PlaneGeometry(0.6, 0.44);

export function RevealPlane({
  position,
  rotation,
  texture,
  wantsPlay,
  revealDelay,
  reducedMotion,
}) {
  const meshRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(+!!reducedMotion);
    }
  }, [reducedMotion]);

  useEffect(() => {
    if (!wantsPlay || !meshRef.current) return;

    if (reducedMotion) {
      meshRef.current.scale.setScalar(1);
      return;
    }

    animationRef.current?.kill();

    animationRef.current = gsap.to(meshRef.current.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 1.1,
      ease: 'power3.out',
      delay: revealDelay,
    });

    return () => animationRef.current?.kill();
  }, [wantsPlay, revealDelay, reducedMotion]);

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      geometry={planeGeometry}
      frustumCulled={false}
    >
      <meshBasicMaterial map={texture} side={THREE.FrontSide} />
    </mesh>
  );
}
