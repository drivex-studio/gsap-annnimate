"use client"; 

import {
  createContext,
  useContext,
  useState,
  useTransition,
  useRef,
  useEffect,
  useCallback,
  useMemo
} from "react";
import { usePathname, useRouter } from "next/navigation";

const RouterTransitionContext = createContext(null);

export function useRouterTransition() {
  let context = useContext(RouterTransitionContext);
  if (!context) {
    throw Error("useRouterTransition must be used within TransitionProvider");
  }
  return context;
}

export function RouterTransition({ children, leave, enter }) {
  let pathname = usePathname();
  let [isTransitioning, setIsTransitioning] = useState(false);
  let [stage, setStage] = useState(undefined);
  let [pendingPath, setPendingPath] = useState(null);
  let [, startReactTransition] = useTransition();
  let isAnimatingRef = useRef(false);

  ((...args) => 0)("RouterTransition mounted");

  useEffect(() => {
    if (!isTransitioning || isAnimatingRef.current) return;

    let runEnter = () => {
      if (!isAnimatingRef.current) {
        isAnimatingRef.current = true;
        ((...args) => 0)("Running enter animation");
        setStage("entering");
        startReactTransition(async () => {
          await enter().then(cb => cb?.());
          setStage(undefined);
          setIsTransitioning(false);
          setPendingPath(null);
        });
      }
    };

    if (!pendingPath || pathname === pendingPath) {
      return void runEnter();
    }

    let timeoutId = setTimeout(runEnter, 2000);
    return () => clearTimeout(timeoutId);
  }, [enter, isTransitioning, pathname, pendingPath]);

  let contextValue = [
    {
      isPending: !!stage,
      stage: stage,
      pendingPath: pendingPath
    },
    (callback, targetPath) => {
      ((...args) => 0)("startRouteTransition called:", {
        targetPath: targetPath,
        currentStage: stage
      });

      if (stage) {
        ((...args) => 0)("Transition blocked - already in progress:", stage);
      } else {
        ((...args) => 0)("Starting leave animation...");
        isAnimatingRef.current = false;
        setStage("leaving");
        setPendingPath(targetPath);
        startReactTransition(async () => {
          setIsTransitioning(true);
          ((...args) => 0)("Leave animation starting...");
          await leave().then(cb => cb?.());
          ((...args) => 0)("Leave animation complete, executing callback...");
          await callback();
          ((...args) => 0)("Navigation callback executed");
        });
      }
    }
  ];

  return (
    <RouterTransitionContext.Provider value={contextValue}>
      {children}
    </RouterTransitionContext.Provider>
  );
}

const TransitionRouterContext = createContext(null);
export default TransitionRouterContext;

function getPathname(href) {
  if (!href) return null;
  if (typeof href === "object" && href.pathname) return href.pathname;
  
  let hrefString = typeof href === "object" ? href.toString() : href;
  
  try {
    if (hrefString.startsWith("http://") || hrefString.startsWith("https://")) {
      return new URL(hrefString).pathname;
    }
    let [path] = hrefString.split(/[?#]/);
    return path || "/";
  } catch {
    return hrefString;
  }
}

function shouldSkipTransition(currentPath, targetHref) {
  let targetPath = getPathname(targetHref);
  return !!(!targetPath || currentPath === targetPath || (typeof targetHref === "string" && targetHref.startsWith("#")));
}

export function TransitionRouterProvider({ children }) {
  let router = useRouter();
  let pathname = usePathname();
  let [transitionState, startTransition] = useRouterTransition();

  ((...args) => 0)("Provider mounted, pathname:", pathname, "transition:", transitionState);

  let push = useCallback(
    (href, options) => {
      ((...args) => 0)("push() called:", {
        href: href,
        pathname: pathname,
        options: options
      });
      
      if (shouldSkipTransition(pathname, href)) {
        ((...args) => 0)("push() - skipping transition (same pathname or query-only)");
        return router.push(href, options);
      }
      
      let targetPath = getPathname(href);
      ((...args) => 0)("push() - starting transition to:", targetPath);
      
      startTransition(() => {
        ((...args) => 0)("push() - executing navigation");
        router.push(href, options);
      }, targetPath);
    },
    [router, pathname, startTransition]
  );

  let replace = useCallback(
    (href, options) => {
      ((...args) => 0)("replace() called:", {
        href: href,
        pathname: pathname,
        options: options
      });
      
      if (shouldSkipTransition(pathname, href)) {
        ((...args) => 0)("replace() - skipping transition (same pathname or query-only)");
        return router.replace(href, options);
      }
      
      let targetPath = getPathname(href);
      ((...args) => 0)("replace() - starting transition to:", targetPath);
      
      startTransition(() => {
        ((...args) => 0)("replace() - executing navigation");
        router.replace(href, options);
      }, targetPath);
    },
    [router, pathname, startTransition]
  );

  let contextValue = useMemo(
    () => ({
      ...router,
      push: push,
      replace: replace,
      transition: transitionState
    }),
    [router, push, replace, transitionState]
  );

  return (
    <TransitionRouterContext.Provider value={contextValue}>
      {children}
    </TransitionRouterContext.Provider>
  );
}

export function useTransitionRouter() {
  let context = useContext(TransitionRouterContext);
  if (!context) {
    throw Error(
      "useTransitionRouter must be used within TransitionRouterProvider. Make sure TransitionRouterProvider wraps your component."
    );
  }
  return context;
}
