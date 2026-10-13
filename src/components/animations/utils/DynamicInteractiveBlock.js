"use client";

import React from 'react';
import dynamic from 'next/dynamic'; // module id: 770703

// Dynamically import interactive components with SSR disabled 
// (since they likely rely heavily on GSAP/Window APIs)
// TODO: source not present in bundle for these components
const EasingGraph = dynamic(() => import('@/components/interactive/EasingGraph'), { ssr: false }); // module id: 318968
const Stagger = dynamic(() => import('@/components/interactive/Stagger'), { ssr: false }); // module id: 919926
const SplitText = dynamic(() => import('@/components/interactive/SplitText'), { ssr: false }); // module id: 432247
const ScrubSim = dynamic(() => import('@/components/interactive/ScrubSim'), { ssr: false }); // module id: 978787

const COMPONENTS_MAP = { // original mangled: r
  "easing-graph": EasingGraph,
  "stagger": Stagger,
  "split-text": SplitText,
  "scrub-sim": ScrubSim
};

// module id: 45119
export default function DynamicInteractiveBlock({
  kind, // original mangled: e
  caption, // original mangled: n
  options // original mangled: a
}) {
  let Component = COMPONENTS_MAP[kind]; // original mangled: i
  
  return Component ? <Component caption={caption} options={options} /> : null;
}
