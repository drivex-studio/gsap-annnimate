let transitionTarget = null

const ROUTE_LABELS = {
  "/": "Home",
  "/pricing": "Pricing",
  "/animations": "Library",
  "/animations/saved": "Saved",
  "/faq": "FAQs",
  "/contact": "Contact",
  "/docs": "Documentation",
  "/changelog": "Changelog",
  "/roadmap": "Roadmap",
  "/whats-new": "What's New",
  "/kits": "Kits",
  "/platform": "Platform",
}

export function getTransitionLabel() {
  const target = transitionTarget
  if (!target || typeof target !== "string") {
    return ""
  }

  let pathname = target
  try {
    pathname = new URL(target, "http://local").pathname
  } catch {
    pathname = target.split("?")[0].split("#")[0]
  }

  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1)
  }

  if (ROUTE_LABELS[pathname]) {
    return ROUTE_LABELS[pathname]
  }

  const segment = pathname.split("/").filter(Boolean).pop()
  return segment
    ? segment.replace(/[-_]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
    : "Home"
}

export function getTransitionTarget() {
  return transitionTarget
}

export function setTransitionTarget(target) {
  transitionTarget = target || null
}