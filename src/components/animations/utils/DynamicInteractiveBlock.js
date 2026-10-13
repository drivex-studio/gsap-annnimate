"use client";

import React from 'react';
import dynamic from 'next/dynamic'; 

const EasingGraph = dynamic(() => import('@/components/animations/interactive/EasingGraph'), { ssr: false });
const Stagger = dynamic(() => import('@/components/animations/interactive/Stagger'), { ssr: false });
const SplitTextReveal = dynamic(() => import('@/components/animations/interactive/SplitTextReveal'), { ssr: false });
const ScrubSim = dynamic(() => import('@/components/animations/interactive/ScrubSim'), { ssr: false });

const COMPONENTS_MAP = {
  "easing-graph": EasingGraph,
  "stagger": Stagger,
  "split-text": SplitText,
  "scrub-sim": ScrubSim
};

export default function DynamicInteractiveBlock({
  kind,
  caption,
  options
}) {
  let Component = COMPONENTS_MAP[kind];
  
  return Component ? <Component caption={caption} options={options} /> : null;
}
