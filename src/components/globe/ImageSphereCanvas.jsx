'use client'
import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useWebGLSupport } from '@/components/globe/hooks/useWebGLSupport';
import { SceneWarmup } from '@/components/globe/SceneWarmup';
import { ImageSphere } from '@/components/globe/ImageSphere';

function logPerformance(message) {}

export default function ImageSphereCanvas({
  images = [],
  wantsPlay = false,
  active = true,
}) {
  logPerformance('mount');

  const [reducedMotion, setReducedMotion] = useState(false);
  const hasWebGLSupport = useWebGLSupport();

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );

    setReducedMotion(mediaQuery.matches);

    const handleChange = (event) => {
      setReducedMotion(event.matches);
    };

    mediaQuery.addEventListener?.('change', handleChange);

    return () => {
      mediaQuery.removeEventListener?.('change', handleChange);
    };
  }, []);

  if (!hasWebGLSupport) {
    return null;
  }

  return (
    <Canvas
      className="size-full block"
      dpr={[1, 1.5]}
      frameloop={active ? 'always' : 'never'}
      gl={{
        alpha: true,
        antialias: false,
        powerPreference: 'low-power',
      }}
      camera={{
        position: [0, 0, 11],
        fov: 35,
      }}
      style={{ background: 'transparent' }}
      onCreated={({ gl }) => {
        logPerformance('r3f-created');

        gl.domElement.addEventListener(
          'webglcontextlost',
          (event) => event.preventDefault()
        );
      }}
    >
      <SceneWarmup />

      <ImageSphere
        images={images}
        wantsPlay={wantsPlay}
        reducedMotion={reducedMotion}
      />
    </Canvas>
  );
}
