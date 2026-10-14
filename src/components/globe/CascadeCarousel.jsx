'use client';

import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { useTransitionRouter } from '@/providers/TransitionRouterProvider';
import { loadSharedImage } from '@/libs/utils/loadSharedImage';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import Link from '@/components/navigation/Link';

import Carousel3D from '@/animations/components/Carousel3D';
import {
  CASCADE_VERTEX_SHADER,
  CASCADE_FRAGMENT_SHADER,
  CASCADE_POST_VERTEX_SHADER,
  CASCADE_POST_FRAGMENT_SHADER,
} from '@/components/globe/tree/cascadeShaders';

const ASPECT_RATIO = 1280 / 804;
const VISIBLE_ANGLE = 86 * Math.PI / 180;
const INTRO_ANGLE = 115 * Math.PI / 180;
const RING_RADIUS = 2.28;
const BRAND_COLOR = new THREE.Color('#fb460d');
const PLANE_GEOMETRY = new THREE.PlaneGeometry(1, 1 / ASPECT_RATIO, 48, 1);
const projectedPoint = new THREE.Vector3();
const INTRO_DISTANCE = 7;
const INTRO_DURATION = 1.6;
const INTRO_STAGGER = 0.08;
const INTRO_SPREAD = 3;
const easeOut = gsap.parseEase('expo.out');

const introEase = (value) => easeOut(value);
const curveScale = (angle) => (VISIBLE_ANGLE / Math.pow(RING_RADIUS * VISIBLE_ANGLE, 1)) * Math.abs(angle);
const edgeScale = (angle) => 1 + 0.35 * Math.min(1, Math.abs(angle) / VISIBLE_ANGLE);

let ringSamples = [];
function buildRing(gapFunction) {
  const samples = [{ x: 0, z: -RING_RADIUS, psi: 0 }];
  let angle = 0;
  let x = 0;
  let z = -RING_RADIUS;
  const stepSize = (value) => edgeScale(value) + gapFunction(value);

  for (let index = 1; index <= 512; index += 1) {
    const step = stepSize(angle + 0.5 * stepSize(angle) / 64) / 64;
    const psi = curveScale(angle + step / 2);
    x += Math.cos(psi) * step;
    z += Math.sin(psi) * step;
    angle += step;
    samples.push({ x, z, psi: curveScale(angle) });
  }

  ringSamples = samples;
}

buildRing(() => 0.04);
const ringPoint = { x: 0, z: 0, psi: 0 };
function getRingPoint(distance) {
  const samplePosition = Math.min(64 * Math.abs(distance), ringSamples.length - 1.001);
  const index = Math.floor(samplePosition);
  const fraction = samplePosition - index;
  const current = ringSamples[index];
  const next = ringSamples[index + 1];
  const sign = distance < 0 ? -1 : 1;

  ringPoint.x = sign * (current.x + (next.x - current.x) * fraction);
  ringPoint.z = current.z + (next.z - current.z) * fraction;
  ringPoint.psi = sign * (current.psi + (next.psi - current.psi) * fraction);
  return ringPoint;
}

function getSlidePoint(angle, width, x, result) {
  const blendedAngle = angle + x / RING_RADIUS;
  const blend = THREE.MathUtils.smoothstep(Math.abs(angle) / 0.456140350877193, 0, 1);
  const planarX = RING_RADIUS * Math.sin(angle) + x * Math.cos(angle);
  const planarZ = -RING_RADIUS * Math.cos(angle) + x * Math.sin(angle);
  result.x = planarX + (RING_RADIUS * Math.sin(blendedAngle) - planarX) * blend;
  result.z = planarZ + (-RING_RADIUS * Math.cos(blendedAngle) - planarZ) * blend;
  const currentAngle = Math.abs(Math.atan2(result.x, -result.z));
  result.top = 0.5 / ASPECT_RATIO * (1 + 0.35 * Math.min(1, currentAngle / VISIBLE_ANGLE));
  return result;
}

const glassPoint = { x: 0, z: 0, top: 0 };

function CascadeScene({ ring, state, glass, pickRef, active }) {
  const { gl, camera, size, scene } = useThree();
  const meshRefs = useRef([]);
  const slideStateRefs = useRef([]);
  const videoRefs = useRef([]);
  const videoActiveRefs = useRef([]);

  const materials = useMemo(() => ring.map(() => new THREE.ShaderMaterial({
    vertexShader: CASCADE_VERTEX_SHADER,
    fragmentShader: CASCADE_FRAGMENT_SHADER,
    transparent: true,
    uniforms: {
      uMap: { value: null }, uOverlay: { value: null },
      uHasMap: { value: 0 }, uHasOverlay: { value: 0 },
      uCrossed: { value: 0 }, uAlpha: { value: 1 },
      uAspect: { value: ASPECT_RATIO }, uPsi: { value: 0 },
      uScale: { value: 1 }, uR: { value: RING_RADIUS },
      uEdgeScale: { value: 0.35 }, uVisible: { value: VISIBLE_ANGLE },
      uBendReach: { value: 0.456140350877193 }, uRadius: { value: 0 },
      uBrand: { value: BRAND_COLOR },
    },
  })), [ring]);

  const postProcess = useMemo(() => {
    const renderTarget = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true });
    const material = new THREE.ShaderMaterial({
      vertexShader: CASCADE_POST_VERTEX_SHADER,
      fragmentShader: CASCADE_POST_FRAGMENT_SHADER,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tScene: { value: renderTarget.texture },
        uRes: { value: new THREE.Vector2(1, 1) },
        uBrand: { value: BRAND_COLOR },
        uGlass: { value: 1 },
        uHalfC: { value: 0.2 },
      },
    });
    const postScene = new THREE.Scene();
    postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
    return {
      renderTarget,
      material,
      scene: postScene,
      camera: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
    };
  }, []);

  useEffect(() => {
    const gapAtAngle = (angle, scale) => scale * (3.72 * Math.cos(angle) + RING_RADIUS) / Math.pow(3.72 + RING_RADIUS * Math.cos(angle), 2);
    let gapFunction = () => 0.04;
    let edgeAngle = 0;
    let cameraRadius = 1;

    for (let iteration = 0; iteration < 4; iteration += 1) {
      buildRing(gapFunction);
      const centerPsi = getRingPoint(2).psi;
      edgeAngle = RING_RADIUS * Math.sin(-gapFunction(0) / 2 / 2 / RING_RADIUS) /
        (3.72 + RING_RADIUS * Math.cos(-gapFunction(0) / 2 / 2 / RING_RADIUS)) / 1.33;
      cameraRadius = size.width / 2 / edgeAngle;
      const scale = size.width / 2 / cameraRadius;
      gapFunction = (angle) => 8 / gapAtAngle(angle, scale);
      void centerPsi;
    }

    buildRing(gapFunction);
    state.current.edgePsi = edgeAngle;
    state.current.gap0 = gapFunction(0);
    state.current.gapAt = gapFunction;
    camera.fov = 2 * Math.atan(cameraRadius / (size.width / size.height)) * 180 / Math.PI;
    camera.position.set(0, 0, 3.72);
    camera.updateProjectionMatrix();
    state.current.wpx = size.width / 2 * (1 / 6 / cameraRadius);

    const pixelRatio = gl.getPixelRatio();
    postProcess.renderTarget.setSize(Math.round(size.width * pixelRatio), Math.round(size.height * pixelRatio));
    postProcess.material.uniforms.uRes.value.set(size.width * pixelRatio, size.height * pixelRatio);
  }, [size, camera, gl, postProcess, materials, state]);

  useEffect(() => {
    let alive = true;

    document.fonts.ready.then(() => {
      if (!alive) return;
      const fontProbe = document.createElement('span');
      fontProbe.style.fontFamily = 'var(--font-sans)';
      document.body.appendChild(fontProbe);
      const fontFamily = getComputedStyle(fontProbe).fontFamily || 'system-ui, sans-serif';
      document.body.removeChild(fontProbe);

      ring.forEach((item, index) => {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = Math.round(640 / ASPECT_RATIO);
        const context = canvas.getContext('2d');
        if (!context) return;
        const gradient = context.createLinearGradient(0, 0.62 * canvas.height, 0, canvas.height);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.55)');
        context.fillStyle = gradient;
        context.fillRect(0, 0.62 * canvas.height, 640, 0.38 * canvas.height);
        context.fillStyle = '#ffffff';
        context.font = `500 22px ${fontFamily}`;
        context.textBaseline = 'alphabetic';
        context.fillText(item.title, 22, canvas.height - 20);
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.NoColorSpace;
        materials[index].uniforms.uOverlay.value = texture;
        materials[index].uniforms.uHasOverlay.value = 1;
      });
    });

    ring.forEach((item, index) => {
      loadSharedImage(item.image, { maxWidth: 720 }).then((image) => {
        if (!alive) return;
        const texture = new THREE.Texture(image);
        texture.flipY = false;
        texture.colorSpace = THREE.NoColorSpace;
        texture.needsUpdate = true;
        videoRefs.current[index] = texture;
        if (!videoActiveRefs.current[index]) {
          materials[index].uniforms.uMap.value = texture;
          materials[index].uniforms.uHasMap.value = 1;
        }
      }).catch(() => {});
    });

    return () => { alive = false; };
  }, [ring, materials]);

  useEffect(() => {
    const videos = ring.map((item, index) => {
      if (!item.video) return null;
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.preload = 'none';
      video.src = item.video;
      const texture = new THREE.VideoTexture(video);
      texture.colorSpace = THREE.NoColorSpace;
      video.addEventListener('loadeddata', () => {
        videoActiveRefs.current[index] = true;
        materials[index].uniforms.uMap.value = texture;
        materials[index].uniforms.uHasMap.value = 1;
      }, { once: true });
      return { video, texture };
    });

    videoRefs.current = videos;
    return () => {
      videos.forEach((entry) => {
        if (!entry?.video) return;
        entry.video.pause();
        entry.video.removeAttribute('src');
        entry.video.load();
        entry.texture.dispose();
      });
      videoRefs.current = [];
      videoActiveRefs.current = [];
    };
  }, [ring, materials]);

  useEffect(() => {
    if (!active) videoRefs.current.forEach((entry) => entry?.video?.pause());
  }, [active]);

  useFrame((_, delta) => {
    const current = state.current;
    const frameDelta = 60 * Math.min(delta, 0.1);
    if (current.autoplay && !current.reduce) current.offset += current.speed * frameDelta / 60;
    if (current.intro && current.introT != null) {
      current.introT += Math.min(delta, 0.1);
      if (current.introT > INTRO_DURATION + 2 * INTRO_SPREAD * INTRO_STAGGER) current.intro = false;
    }
    if (!current.dragging && Math.abs(current.velocity) > 2e-5) {
      current.offset += current.velocity * frameDelta;
      current.velocity *= Math.pow(0.94, frameDelta);
    }

    const count = ring.length;
    let crossing = null;
    meshRefs.current.forEach((mesh, index) => {
      if (!mesh) return;
      const slideOffset = THREE.MathUtils.euclideanModulo(index + current.offset + count / 2, count) - count / 2;
      let introOffset = 0;
      if (current.intro) {
        introOffset = current.introT == null
          ? INTRO_DISTANCE
          : INTRO_DISTANCE * (1 - introEase(THREE.MathUtils.clamp((current.introT - (INTRO_SPREAD - slideOffset) * INTRO_STAGGER) / INTRO_DURATION, 0, 1)));
      }
      const position = slideOffset - introOffset;
      const leftPsi = getRingPoint(position - 0.5).psi;
      const rightPsi = getRingPoint(position + 0.5).psi;
      const psi = (leftPsi + rightPsi) / 2;
      const absPsi = Math.abs(psi);
      let visible = true;
      if (current.intro) {
        const leftEdge = Math.abs(getRingPoint(slideOffset - 0.5).psi);
        const rightEdge = Math.abs(getRingPoint(slideOffset + 0.5).psi);
        visible = slideOffset * (slideOffset + 1) <= 0 || Math.min(leftEdge, rightEdge) < (current.edgePsi || 1.2);
      }
      const alpha = absPsi > INTRO_ANGLE || position < -count / 2 || !visible ? 0 : 1;
      mesh.visible = alpha > 0;
      const width = Math.max(0.2, RING_RADIUS * (rightPsi - leftPsi) - (current.gapAt ? current.gapAt(psi) : 0.04));
      const halfWidth = 0.5 * width / RING_RADIUS;
      slideStateRefs.current[index] = { psi, half: halfWidth, on: alpha > 0 };
      const uniforms = materials[index].uniforms;
      uniforms.uAlpha.value = alpha;
      uniforms.uPsi.value = psi;
      uniforms.uScale.value = width;
      uniforms.uCrossed.value = THREE.MathUtils.clamp((psi + halfWidth) / (2 * halfWidth), 0, 1);

      if (uniforms.uCrossed.value > 0 && uniforms.uCrossed.value < 1) crossing = { psi, scale: width };
      const videoEntry = videoRefs.current[index];
      if (videoEntry?.video) {
        const shouldPlay = alpha > 0 && absPsi - halfWidth < (current.edgePsi || 1.2) + 0.15 && !current.reduce;
        if (shouldPlay && videoEntry.video.paused) videoEntry.video.play().catch(() => {});
        else if (!shouldPlay && !videoEntry.video.paused) videoEntry.video.pause();
      }
    });

    const uniforms = postProcess.material.uniforms;
    if (crossing) {
      let low = -0.5 * crossing.scale;
      let high = 0.5 * crossing.scale;
      for (let iteration = 0; iteration < 20; iteration += 1) {
        const middle = (low + high) / 2;
        if (getSlidePoint(crossing.psi, crossing.scale, middle, glassPoint).x < 0) low = middle;
        else high = middle;
      }
      getSlidePoint(crossing.psi, crossing.scale, (low + high) / 2, glassPoint);
      projectedPoint.set(0, glassPoint.top, glassPoint.z).project(camera);
      uniforms.uHalfC.value = Math.min(0.5, projectedPoint.y / 2);
    }
    uniforms.uGlass.value = Number(Boolean(glass));
    gl.setRenderTarget(postProcess.renderTarget);
    gl.clear();
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    gl.clear();
    gl.render(postProcess.scene, postProcess.camera);
  }, 1);

  useEffect(() => {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    pickRef.current = (clientX, clientY) => {
      const bounds = gl.domElement.getBoundingClientRect();
      pointer.set((clientX - bounds.left) / bounds.width * 2 - 1, -(2 * ((clientY - bounds.top) / bounds.height)) + 1);
      raycaster.setFromCamera(pointer, camera);
      const { origin, direction } = raycaster.ray;
      const a = direction.x * direction.x + direction.z * direction.z;
      const b = 2 * (origin.x * direction.x + origin.z * direction.z);
      const discriminant = b * b - 4 * a * (origin.x * origin.x + origin.z * origin.z - RING_RADIUS * RING_RADIUS);
      if (discriminant < 0 || a === 0) return null;
      for (const distance of [(-b - Math.sqrt(discriminant)) / (2 * a), (-b + Math.sqrt(discriminant)) / (2 * a)]) {
        if (distance <= 0) continue;
        const x = origin.x + direction.x * distance;
        const y = origin.y + direction.y * distance;
        const angle = Math.atan2(x, -(origin.z + direction.z * distance));
        if (Math.abs(y) > 0.5 * edgeScale(angle) / ASPECT_RATIO) continue;
        const index = slideStateRefs.current.findIndex((entry) => entry?.on && Math.abs(angle - entry.psi) <= entry.half);
        if (index >= 0) return ring[index].slug;
      }
      return null;
    };
    return () => { pickRef.current = null; };
  }, [gl, camera, ring, pickRef]);

  return ring.map((item, index) => jsx('mesh', {
    ref: (element) => { meshRefs.current[index] = element; },
    geometry: PLANE_GEOMETRY,
    material: materials[index],
    frustumCulled: false,
  }, `${item.slug}-${index}`));
}

export default function CascadeCarousel({ items = [], autoplay = true, speed = 0.22, className = '', onIntro }) {
  const containerRef = useRef(null);
  const router = useTransitionRouter();
  const isGlassEnabled = useBreakpoint('lg');
  const [webglSupported, setWebglSupported] = useState(true);
  const [isInView, setIsInView] = useState(true);
  const [isHoveringCard, setIsHoveringCard] = useState(false);
  const pickRef = useRef(null);
  const state = useRef({ offset: 0, velocity: 0, dragging: false, autoplay, speed, reduce: false, intro: Boolean(onIntro), introT: null });
  state.current.autoplay = autoplay;
  state.current.speed = speed;

  const repeatedItems = useMemo(() => {
    const result = [];
    while (items.length && result.length < 12) result.push(...items);
    return result;
  }, [items]);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      if (!canvas.getContext('webgl2') && !canvas.getContext('webgl')) setWebglSupported(false);
    } catch {
      setWebglSupported(false);
    }
    state.current.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    if (!onIntro) return;
    const current = state.current;
    onIntro(() => {
      if (current.reduce) current.intro = false;
      else current.introT = 0;
    });
  }, [onIntro]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;
    let pointerStart = 0;
    let lastPointerX = 0;
    let lastTime = 0;
    const sensitivity = (delta) => delta / (state.current.wpx || 300) / (1 + (state.current.gap0 ?? 0.04));
    const onPointerDown = (event) => {
      state.current.dragging = true;
      state.current.velocity = 0;
      pointerStart = event.clientX;
      lastPointerX = event.clientX;
      lastTime = performance.now();
    };
    const onPointerMove = (event) => {
      const current = state.current;
      if (!current.dragging) {
        if (element.contains(event.target)) setIsHoveringCard(Boolean(pickRef.current?.(event.clientX, event.clientY)));
        return;
      }
      const now = performance.now();
      const movement = sensitivity(event.clientX - pointerStart);
      current.offset += movement;
      current.velocity = movement / Math.max(1, now - lastTime) * 1000 / 60;
      pointerStart = event.clientX;
      lastPointerX = event.clientX;
      lastTime = now;
    };
    const onPointerUp = () => { state.current.dragging = false; };
    const onClick = (event) => {
      if (Math.abs(event.clientX - lastPointerX) > 6) return;
      const slug = pickRef.current?.(event.clientX, event.clientY);
      if (slug) {
        const href = `/animations/${slug}`;
        if (router?.push) router.push(href);
        else window.location.assign(href);
      }
    };
    const onPointerLeave = () => setIsHoveringCard(false);
    let previousScrollY = window.scrollY;
    const onScroll = () => {
      const scrollY = window.scrollY;
      state.current.offset += 0.6 * sensitivity(scrollY - previousScrollY);
      previousScrollY = scrollY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    element.addEventListener('click', onClick);
    element.addEventListener('pointerleave', onPointerLeave);
    element.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    const observer = new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting), { rootMargin: '200px 0px' });
    observer.observe(element);

    return () => {
      element.removeEventListener('pointerdown', onPointerDown);
      element.removeEventListener('click', onClick);
      element.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      observer.disconnect();
    };
  }, [webglSupported]);

  if (!webglSupported) {
    return <Carousel3D items={items} autoplay={autoplay} speed={speed} className={className} />;
  }

  return (
    <div ref={containerRef} className={`relative h-full min-h-[320px] w-full touch-pan-y select-none ${isHoveringCard ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'} ${className}`}>
      <Canvas
        style={{ position: 'absolute', left: 0, top: '-35%', width: '100%', height: '170%', pointerEvents: 'none' }}
        frameloop={isInView ? 'always' : 'never'}
        dpr={[1, 1.5]}
        camera={{ fov: 40, near: 0.01, far: 20, position: [0, 0, 3.72] }}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
        onCreated={({ gl: renderer }) => {
          renderer.setClearColor(0, 0);
          renderer.domElement.addEventListener('webglcontextlost', (event) => event.preventDefault());
        }}
      >
        <CascadeScene ring={repeatedItems} state={state} glass={isGlassEnabled} pickRef={pickRef} active={isInView} />
      </Canvas>
      <ul className="sr-only">
        {items.map((item) => <li key={item.slug}><Link href={`/animations/${item.slug}`}>{item.title}</Link></li>)}
      </ul>
    </div>
  );
}
