'use client'
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RevealPlane } from '@/components/globe/RevealPlane';
import { useImageTextures } from '@/components/globe/hooks/useImageTextures';

const GROUP_ROTATION_X = Math.PI / 7;
const GROUP_ROTATION_Z = -(0.4 * GROUP_ROTATION_X);
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function logPerformance(message) {}

export function ImageSphere({
  images,
  wantsPlay,
  reducedMotion,
}) {
  const rotationGroupRef = useRef(null);

  const dragStateRef = useRef({
    spin: 0,
    inertia: 0,
    dragAccum: 0,
    dragging: false,
    lastX: 0,
    firstRenderLogged: false,
    frames: 0,
    droppedFrames: 0,
    maxDt: 0,
    lastLog: performance.now(),
  });

  const { textures, uploaded } = useImageTextures(images);

  const planes = useMemo(() => {
    const items = [];

    for (let index = 0; index < 70; index++) {
      const y = 1 - (index / 69) * 2;
      const radius = Math.sqrt(Math.max(0, 1 - y * y));
      const angle = index * GOLDEN_ANGLE;

      const x = Math.cos(angle) * radius * 3;
      const z = Math.sin(angle) * radius * 3;
      const verticalPosition = 3 * y;

      const lookAtMatrix = new THREE.Matrix4().lookAt(
        new THREE.Vector3(x, verticalPosition, z),
        new THREE.Vector3(
          2 * x,
          2 * verticalPosition,
          2 * z
        ),
        new THREE.Vector3(0, 1, 0)
      );

      const quaternion = new THREE.Quaternion()
        .setFromRotationMatrix(lookAtMatrix);

      const euler = new THREE.Euler().setFromQuaternion(quaternion);

      items.push({
        position: [x, verticalPosition, z],
        rotation: [euler.x, euler.y, euler.z],
        revealDelay: 0.7 * Math.random(),
      });
    }

    return items;
  }, []);

  useFrame((state, delta) => {
    const dragState = dragStateRef.current;

    dragState.frames++;

    if (delta > dragState.maxDt) {
      dragState.maxDt = delta;
    }

    if (delta > 0.033) {
      dragState.droppedFrames++;
    }

    if (!dragState.firstRenderLogged) {
      dragState.firstRenderLogged = true;
      logPerformance('first-render');
    }

    const dragRotation = -0.0015 * dragState.dragAccum;

    dragState.dragAccum = 0;

    if (dragState.dragging) {
      dragState.inertia =
        delta > 0
          ? Math.max(
              -1.4,
              Math.min(1.4, dragRotation / delta)
            )
          : 0;
    } else {
      dragState.inertia *= Math.exp(-2.4 * delta);
    }

    if (!reducedMotion) {
      dragState.spin += -0.05 * delta;
    }

    dragState.spin += dragRotation;

    if (!dragState.dragging) {
      dragState.spin += dragState.inertia * delta;
    }

    if (rotationGroupRef.current) {
      rotationGroupRef.current.rotation.y = dragState.spin;
    }

    const now = performance.now();

    if (now - dragState.lastLog > 1000) {
      const fps =
        dragState.frames / ((now - dragState.lastLog) / 1000);

      logPerformance(
        `fps=${fps.toFixed(0)} ` +
        `maxDt=${(1000 * dragState.maxDt).toFixed(1)}ms ` +
        `dropped=${dragState.droppedFrames}`
      );

      dragState.frames = 0;
      dragState.droppedFrames = 0;
      dragState.maxDt = 0;
      dragState.lastLog = now;
    }
  });

  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    const dragState = dragStateRef.current;

    function handlePointerDown(event) {
      dragState.dragging = true;
      dragState.lastX = event.clientX;

      canvas.setPointerCapture?.(event.pointerId);
      canvas.style.cursor = 'grabbing';
    }

    function handlePointerMove(event) {
      if (!dragState.dragging) return;

      dragState.dragAccum += event.clientX - dragState.lastX;
      dragState.lastX = event.clientX;
    }

    function handlePointerUp(event) {
      if (!dragState.dragging) return;

      dragState.dragging = false;

      canvas.releasePointerCapture?.(event.pointerId);
      canvas.style.cursor = 'grab';
    }

    canvas.style.cursor = 'grab';
    canvas.style.touchAction = 'pan-y';

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerUp);

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [gl]);

  return (
    <group rotation={[-GROUP_ROTATION_X, 0, GROUP_ROTATION_Z]}>
      <group ref={rotationGroupRef}>
        {planes.map((plane, index) => {
          const texture = textures[index];

          if (!texture || !uploaded.has(index)) {
            return null;
          }

          return (
            <RevealPlane
              key={index}
              position={plane.position}
              rotation={plane.rotation}
              texture={texture}
              wantsPlay={wantsPlay}
              revealDelay={plane.revealDelay}
              reducedMotion={reducedMotion}
            />
          );
        })}
      </group>
    </group>
  );
}
