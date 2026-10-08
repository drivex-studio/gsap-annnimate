"use client";

import {
  RouterTransition,
  TransitionRouterProvider,
} from "@/providers/TransitionRouterProvider";

let activeAnimation = null;

async function leave() {
  activeAnimation?.cancel();
  activeAnimation = document.body.animate(
    [{ opacity: 1 }, { opacity: 0 }],
    { duration: 300, easing: "ease-in", fill: "forwards" }
  );
  await activeAnimation.finished;
}

async function enter() {
  window.scrollTo(0, 0);
  activeAnimation?.cancel();
  activeAnimation = document.body.animate(
    [{ opacity: 0 }, { opacity: 1 }],
    { duration: 300, easing: "ease-out" }
  );
  await activeAnimation.finished;
  activeAnimation = null;
}

export default function TransitionProviders({ children }) {
  return (
    <RouterTransition leave={leave} enter={enter}>
      <TransitionRouterProvider>{children}</TransitionRouterProvider>
    </RouterTransition>
  );
}
