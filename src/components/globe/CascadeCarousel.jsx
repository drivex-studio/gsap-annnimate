"use client";

import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { gsap } from '@/libs/utils/vendor';

import TransitionRouterContext from '@/providers/TransitionRouterProvider';
import { loadSharedImage } from '@/libs/utils/loadSharedImage';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import CylinderCarousel from '@/animations/components/CylinderCarousel';
import Link from '@/components/navigation/Link';
import {
  CASCADE_VERTEX_SHADER,
  CASCADE_FRAGMENT_SHADER,
  CASCADE_POST_VERTEX_SHADER,
  CASCADE_POST_FRAGMENT_SHADER,
} from '@/components/globe/tree/cascadeShaders';

const ASPECT = 1280 / 804;
const VISIBLE_ANGLE = 86 * Math.PI / 180;
const MAX_ANGLE = 115 * Math.PI / 180;
const RADIUS = 2.28;
const BRAND_COLOR = new THREE.Color('#fb460d');

const INTRO_DISTANCE = 7;
const INTRO_DURATION = 1.6;
const INTRO_STAGGER = 0.08;
const INTRO_START = 3;

const easeOutExpo = gsap.parseEase('expo.out');

const planeGeometry = new THREE.PlaneGeometry(
  1,
  1 / ASPECT,
  48,
  1,
);

const curveState = {
  x: 0,
  z: 0,
  psi: 0,
};

function edgeScale(angle) {
  return 1 + 0.35 * Math.min(1, Math.abs(angle) / VISIBLE_ANGLE);
}

function angleToDistance(angle) {
  const factor = VISIBLE_ANGLE / Math.pow(2.28 * VISIBLE_ANGLE, 1);
  return factor * Math.pow(Math.abs(angle), 1);
}

let curvePoints = [];

function buildCurve(gapAt = () => 0.04) {
  const points = [{ x: 0, z: -2.28, psi: 0 }];

  let angle = 0;
  let x = 0;
  let z = -2.28;

  const stepAt = (value) => {
    const distance = angleToDistance(value);
    return edgeScale(distance) + gapAt(distance);
  };

  for (let index = 1; index <= 512; index++) {
    const step = stepAt(angle + 0.5 * stepAt(angle) / 64) / 64;
    const psi = angleToDistance(angle + step / 2);

    x += Math.cos(psi) * step;
    z += Math.sin(psi) * step;
    angle += step;

    points.push({
      x,
      z,
      psi: angleToDistance(angle),
    });
  }

  curvePoints = points;
}

buildCurve();

function getCurvePoint(value) {
  const position = Math.min(
    64 * Math.abs(value),
    curvePoints.length - 1.001,
  );

  const index = Math.floor(position);
  const fraction = position - index;

  const start = curvePoints[index];
  const end = curvePoints[index + 1];
  const direction = value < 0 ? -1 : 1;

  curveState.x = direction * (
    start.x + (end.x - start.x) * fraction
  );

  curveState.z = start.z + (end.z - start.z) * fraction;

  curveState.psi = direction * (
    start.psi + (end.psi - start.psi) * fraction
  );

  return curveState;
}

const edgePosition = new THREE.Vector3();

function getEdgePosition(angle, scale, offset, target) {
  const shiftedAngle = angle + offset / 2.28;

  const blend = THREE.MathUtils.smoothstep(
    Math.abs(angle) / 0.456140350877193,
    0,
    1,
  );

  const x = 2.28 * Math.sin(angle) + offset * Math.cos(angle);
  const z = -2.28 * Math.cos(angle) + offset * Math.sin(angle);

  target.x = x + (2.28 * Math.sin(shiftedAngle) - x) * blend;
  target.z = z + (-2.28 * Math.cos(shiftedAngle) - z) * blend;

  const visibleAngle = Math.abs(Math.atan2(target.x, -target.z));

  target.top = 0.5 / ASPECT * (
    1 + 0.35 * Math.min(1, visibleAngle / VISIBLE_ANGLE)
  );

  return target;
}

function createSlideMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: CASCADE_VERTEX_SHADER,
    fragmentShader: CASCADE_FRAGMENT_SHADER,
    transparent: true,
    uniforms: {
      uMap: { value: null },
      uOverlay: { value: null },
      uHasMap: { value: 0 },
      uHasOverlay: { value: 0 },
      uCrossed: { value: 0 },
      uAlpha: { value: 1 },
      uAspect: { value: ASPECT },
      uPsi: { value: 0 },
      uScale: { value: 1 },
      uR: { value: RADIUS },
      uEdgeScale: { value: 0.35 },
      uVisible: { value: VISIBLE_ANGLE },
      uBendReach: { value: 0.456140350877193 },
      uRadius: { value: 0 },
      uBrand: { value: BRAND_COLOR },
    },
  });
}

function createPostProcessing() {
  const renderTarget = new THREE.WebGLRenderTarget(1, 1, {
    depthBuffer: true,
  });

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

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    material,
  );

  const postScene = new THREE.Scene();
  postScene.add(mesh);

  return {
    rt: renderTarget,
    mat: material,
    postScene,
    postCam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
  };
}

function RingScene({
  ring,
  state,
  glass,
  pickRef,
  active,
}) {
  const { gl, camera, size, scene } = useThree();

  const meshes = useRef([]);
  const slideStates = useRef([]);
  const imageTextures = useRef([]);
  const videoElements = useRef([]);
  const videoActive = useRef([]);

  const materials = useMemo(
    () => ring.map(() => createSlideMaterial()),
    [ring],
  );

  const post = useMemo(() => createPostProcessing(), []);

  useEffect(() => {
    let gapAt = () => 0.04;
    let edgePsi = 0;
    let scale = 1;

    for (let iteration = 0; iteration < 4; iteration++) {
      buildCurve(gapAt);

      const psi = getCurvePoint(2).psi;

      edgePsi = psi - gapAt(psi) / 2 / 2.28;

      scale = 2.28 * Math.sin(edgePsi)
        / (3.72 + 2.28 * Math.cos(edgePsi))
        / 1.33;

      const width = size.width / 2 / scale;

      gapAt = (angle) => 8 / (
        width * (
          3.72 * Math.cos(angle) + 2.28
        ) / Math.pow(3.72 + 2.28 * Math.cos(angle), 2)
      );
    }

    buildCurve(gapAt);

    state.current.edgePsi = edgePsi;
    state.current.gap0 = gapAt(0);
    state.current.gapAt = gapAt;

    camera.fov = 2 * Math.atan(
      scale / (size.width / size.height),
    ) * 180 / Math.PI;

    camera.position.set(0, 0, 3.72);
    camera.updateProjectionMatrix();

    state.current.wpx = size.width / 2 * (1 / 6 / scale);

    const pixelRatio = gl.getPixelRatio();

    post.rt.setSize(
      Math.round(size.width * pixelRatio),
      Math.round(size.height * pixelRatio),
    );

    post.mat.uniforms.uRes.value.set(
      size.width * pixelRatio,
      size.height * pixelRatio,
    );
  }, [size, camera, gl, post, materials, state]);

  useEffect(() => {
    let mounted = true;

    document.fonts.ready.then(() => {
      if (!mounted) return;

      const span = document.createElement('span');
      span.style.fontFamily = 'var(--font-sans)';
      document.body.appendChild(span);

      const fontFamily = getComputedStyle(span).fontFamily
        || 'system-ui, sans-serif';

      document.body.removeChild(span);

      ring.forEach((item, index) => {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = Math.round(640 / ASPECT);

        const context = canvas.getContext('2d');

        const gradient = context.createLinearGradient(
          0,
          0.62 * canvas.height,
          0,
          canvas.height,
        );

        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.55)');

        context.fillStyle = gradient;
        context.fillRect(
          0,
          0.62 * canvas.height,
          640,
          0.38 * canvas.height,
        );

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

    ring.forEach(async (item, index) => {
      try {
        const image = await loadSharedImage(item.image, {
          maxWidth: 720,
        });

        if (!mounted) return;

        const texture = new THREE.Texture(image);
        texture.flipY = false;
        texture.colorSpace = THREE.NoColorSpace;
        texture.needsUpdate = true;

        imageTextures.current[index] = texture;

        if (!videoActive.current[index]) {
          materials[index].uniforms.uMap.value = texture;
          materials[index].uniforms.uHasMap.value = 1;
        }
      } catch {
      }
    });

    return () => {
      mounted = false;
    };
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
        videoActive.current[index] = true;
        materials[index].uniforms.uMap.value = texture;
        materials[index].uniforms.uHasMap.value = 1;
      }, { once: true });

      return { video, texture };
    });

    videoElements.current = videos;

    return () => {
      videos.forEach((entry) => {
        if (!entry) return;

        entry.video.pause();
        entry.video.removeAttribute('src');
        entry.video.load();
        entry.texture.dispose();
      });

      videoElements.current = [];
      videoActive.current = [];
    };
  }, [ring, materials]);

  useEffect(() => {
    if (active) return;

    videoElements.current.forEach((entry) => entry?.video.pause());
  }, [active]);

  useFrame((_, delta) => {
    const current = state.current;
    const frameScale = 60 * Math.min(delta, 0.1);

    if (current.autoplay && !current.reduce) {
      current.offset += current.speed * frameScale / 60;
    }

    if (current.intro && current.introT != null) {
      current.introT += Math.min(delta, 0.1);

      if (current.introT > INTRO_DURATION + 2 * INTRO_START * INTRO_STAGGER) {
        current.intro = false;
      }
    }

    if (!current.dragging && Math.abs(current.velocity) > 2e-5) {
      current.offset += current.velocity * frameScale;
      current.velocity *= Math.pow(0.94, frameScale);
    }

    const count = ring.length;
    let crossedSlide = null;

    meshes.current.forEach((mesh, index) => {
      if (!mesh) return;

      const position = THREE.MathUtils.euclideanModulo(
        index + current.offset + count / 2,
        count,
      ) - count / 2;

      let introOffset = 0;

      if (current.intro) {
        introOffset = current.introT == null
          ? INTRO_DISTANCE
          : INTRO_DISTANCE * (
            1 - easeOutExpo(THREE.MathUtils.clamp(
              (current.introT - (INTRO_START - position) * INTRO_STAGGER)
                / INTRO_DURATION,
              0,
              1,
            ))
          );
      }

      const adjustedPosition = position - introOffset;

      const left = getCurvePoint(adjustedPosition - 0.5).psi;
      const right = getCurvePoint(adjustedPosition + 0.5).psi;

      const center = (left + right) / 2;
      const distance = Math.abs(center);

      let visibleDuringIntro = true;

      if (current.intro) {
        const startAngle = Math.abs(
          getCurvePoint(position - 0.5).psi,
        );

        const endAngle = Math.abs(
          getCurvePoint(position + 0.5).psi,
        );

        visibleDuringIntro = position * (position + 1) <= 0
          || Math.min(startAngle, endAngle) < (current.edgePsi || 1.2);
      }

      const visible = distance <= MAX_ANGLE
        && adjustedPosition >= -count / 2
        && visibleDuringIntro;

      mesh.visible = visible;

      const width = Math.max(
        0.2,
        2.28 * (right - left) - (
          current.gapAt ? current.gapAt(center) : 0.04
        ),
      );

      const halfWidth = 0.5 * width / 2.28;

      slideStates.current[index] = {
        psi: center,
        half: halfWidth,
        on: visible,
      };

      const uniforms = materials[index].uniforms;

      uniforms.uAlpha.value = visible ? 1 : 0;
      uniforms.uPsi.value = center;
      uniforms.uScale.value = width;
      uniforms.uCrossed.value = THREE.MathUtils.clamp(
        (center + halfWidth) / (2 * halfWidth),
        0,
        1,
      );

      if (uniforms.uCrossed.value > 0 && uniforms.uCrossed.value < 1) {
        crossedSlide = { psi: center, scale: width };
      }

      const videoEntry = videoElements.current[index];

      if (videoEntry) {
        const shouldPlay = visible
          && distance - halfWidth < (current.edgePsi || 1.2) + 0.15
          && !current.reduce;

        if (shouldPlay && videoEntry.video.paused) {
          videoEntry.video.play().catch(() => {});
        } else if (!shouldPlay && !videoEntry.video.paused) {
          videoEntry.video.pause();
        }
      }
    });

    const uniforms = post.mat.uniforms;

    if (crossedSlide) {
      let low = -0.5 * crossedSlide.scale;
      let high = 0.5 * crossedSlide.scale;

      for (let iteration = 0; iteration < 20; iteration++) {
        const midpoint = (low + high) / 2;

        if (getEdgePosition(
          crossedSlide.psi,
          crossedSlide.scale,
          midpoint,
          edgePosition,
        ).x < 0) {
          low = midpoint;
        } else {
          high = midpoint;
        }
      }

      getEdgePosition(
        crossedSlide.psi,
        crossedSlide.scale,
        (low + high) / 2,
        edgePosition,
      );

      edgePosition.set(0, edgePosition.top, edgePosition.z).project(camera);

      uniforms.uHalfC.value = Math.min(0.5, edgePosition.y / 2);
    }

    uniforms.uGlass.value = Number(Boolean(glass));

    gl.setRenderTarget(post.rt);
    gl.clear();
    gl.render(scene, camera);

    gl.setRenderTarget(null);
    gl.clear();
    gl.render(post.postScene, post.postCam);
  }, 1);

  useEffect(() => {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    pickRef.current = (clientX, clientY) => {
      const bounds = gl.domElement.getBoundingClientRect();

      pointer.set(
        (clientX - bounds.left) / bounds.width * 2 - 1,
        -(2 * (clientY - bounds.top) / bounds.height) + 1,
      );

      raycaster.setFromCamera(pointer, camera);

      const { origin, direction } = raycaster.ray;

      const a = direction.x ** 2 + direction.z ** 2;
      const b = 2 * (origin.x * direction.x + origin.z * direction.z);

      const c = origin.x ** 2 + origin.z ** 2 - RADIUS ** 2;
      const discriminant = b ** 2 - 4 * a * c;

      if (discriminant < 0 || a === 0) return null;

      for (const distance of [
        (-b - Math.sqrt(discriminant)) / (2 * a),
        (-b + Math.sqrt(discriminant)) / (2 * a),
      ]) {
        if (distance <= 0) continue;

        const x = origin.x + direction.x * distance;
        const y = origin.y + direction.y * distance;
        const angle = Math.atan2(
          x,
          -(origin.z + direction.z * distance),
        );

        if (Math.abs(y) > 0.5 * edgeScale(angle) / ASPECT) continue;

        const index = slideStates.current.findIndex(
          (entry) => entry?.on && Math.abs(angle - entry.psi) <= entry.half,
        );

        if (index >= 0) return ring[index].slug;
      }

      return null;
    };

    return () => {
      pickRef.current = null;
    };
  }, [gl, camera, ring, pickRef]);

  return ring.map((item, index) => (
    <mesh
      key={`${item.slug}-${index}`}
      ref={(mesh) => {
        meshes.current[index] = mesh;
      }}
      geometry={planeGeometry}
      material={materials[index]}
      frustumCulled={false}
    />
  ));
}

export default function CascadeCarousel({
  items = [],
  autoplay = true,
  speed = 0.22,
  className = '',
  onIntro,
}) {
  const containerRef = useRef(null);
  const router = useContext(TransitionRouterContext);
  const glassEnabled = useBreakpoint('lg');

  const [webglSupported, setWebglSupported] = useState(true);
  const [inViewport, setInViewport] = useState(true);
  const [hovered, setHovered] = useState(false);

  const pickRef = useRef(null);
  const navigateRef = useRef(null);

  const state = useRef({
    offset: 0,
    velocity: 0,
    dragging: false,
    autoplay,
    speed,
    reduce: false,
    intro: Boolean(onIntro),
    introT: null,
  });

  state.current.autoplay = autoplay;
  state.current.speed = speed;

  navigateRef.current = (slug) => {
    const destination = `/animations/${slug}`;

    if (router?.push) {
      router.push(destination);
    } else {
      window.location.assign(destination);
    }
  };

  const ring = useMemo(() => {
    const result = [];

    while (items.length && result.length < 12) {
      result.push(...items);
    }

    return result;
  }, [items]);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');

      if (!canvas.getContext('webgl2') && !canvas.getContext('webgl')) {
        setWebglSupported(false);
      }
    } catch {
      setWebglSupported(false);
    }

    state.current.reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
  }, []);

  useEffect(() => {
    if (!onIntro) return;

    const current = state.current;

    onIntro(() => {
      if (current.reduce) {
        current.intro = false;
      } else {
        current.introT = 0;
      }
    });
  }, [onIntro]);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) return;

    let lastX = 0;
    let lastPointerX = 0;
    let lastTime = 0;

    const normalize = (distance) => (
      distance / (state.current.wpx || 300)
        / (1 + (state.current.gap0 ?? 0.04))
    );

    const onPointerDown = (event) => {
      state.current.dragging = true;
      state.current.velocity = 0;

      lastX = event.clientX;
      lastPointerX = event.clientX;
      lastTime = performance.now();
    };

    const onPointerMove = (event) => {
      const current = state.current;

      if (!current.dragging) {
        if (element.contains(event.target)) {
          setHovered(Boolean(pickRef.current?.(event.clientX, event.clientY)));
        }

        return;
      }

      const now = performance.now();
      const movement = normalize(event.clientX - lastX);

      current.offset += movement;
      current.velocity = movement / Math.max(1, now - lastTime) * (1000 / 60);

      lastX = event.clientX;
      lastTime = now;
    };

    const onPointerUp = () => {
      state.current.dragging = false;
    };

    const onClick = (event) => {
      if (Math.abs(event.clientX - lastPointerX) > 6) return;

      const slug = pickRef.current?.(event.clientX, event.clientY);

      if (slug) navigateRef.current(slug);
    };

    const onPointerLeave = () => setHovered(false);

    let previousScrollY = window.scrollY;

    const onScroll = () => {
      const scrollY = window.scrollY;

      state.current.offset += 0.6 * normalize(scrollY - previousScrollY);
      previousScrollY = scrollY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    element.addEventListener('click', onClick);
    element.addEventListener('pointerleave', onPointerLeave);
    element.addEventListener('pointerdown', onPointerDown);

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    const observer = new IntersectionObserver(([entry]) => {
      setInViewport(entry.isIntersecting);
    }, { rootMargin: '200px 0px' });

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
    return (
      <CylinderCarousel
        items={items}
        autoplay={autoplay}
        speed={speed}
        className={className}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative h-full min-h-[320px] w-full touch-pan-y select-none ${hovered ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'} ${className}`}
    >
      <Canvas
        style={{
          position: 'absolute',
          left: 0,
          top: '-35%',
          width: '100%',
          height: '170%',
          pointerEvents: 'none',
        }}
        frameloop={inViewport ? 'always' : 'never'}
        dpr={[1, 1.5]}
        camera={{
          fov: 40,
          near: 0.01,
          far: 20,
          position: [0, 0, 3.72],
        }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'low-power',
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0, 0);
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
          });
        }}
      >
        <RingScene
          ring={ring}
          state={state}
          glass={glassEnabled}
          pickRef={pickRef}
          active={inViewport}
        />
      </Canvas>

      <ul className="sr-only">
        {items.map((item) => (
          <li key={item.slug}>
            <Link href={`/animations/${item.slug}`}>
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
