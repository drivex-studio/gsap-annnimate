"use client";

// module id: 113861 (PreviewBlock)
// module id: 747198 (AttributesSection)
// module id: 799422 (PresetsSection)

import React, { useState, useRef, useEffect, useMemo, useCallback, Fragment } from 'react';
import { createPortal } from 'react-dom';

// Icons imported directly from @phosphor-icons/react as requested
import { 
  ArrowsOut, 
  DeviceTablet, 
  Laptop, 
  Desktop, 
  FrameCorners, 
  Check, 
  CaretUp, 
  CaretDown, 
  ArrowClockwise, 
  X, 
  DeviceMobile
} from '@phosphor-icons/react';

import Select from '@/components/ui/Select'; // module id: 977805
import { toast } from 'sonner'; // module id: 846696
import CodeSnippet from './CodeSnippet'; // module id: 317840

// --- PreviewBlock Helpers (113861) --- //

const PREVIEW_TEMPLATES = new Set(["instant", "compact", "scroll-text", "scroll-cover", "menu", "shader", "shader-scroll", "full-page"]);

// The iframe proxy script is preserved exactly as it drives the preview environment logic
const FRAME_SCRIPT = `
<script>
(function () {
  'use strict';

  var MODE = '__ANM_TL_MODE__';

  var RESERVED = {
    duration: 1, delay: 1, ease: 1, easeReverse: 1, stagger: 1, repeat: 1,
    repeatDelay: 1, repeatRefresh: 1, yoyo: 1, yoyoEase: 1, paused: 1,
    overwrite: 1, force3D: 1, immediateRender: 1, lazy: 1, id: 1, data: 1,
    callbackScope: 1, onComplete: 1, onStart: 1, onUpdate: 1, onRepeat: 1,
    onReverseComplete: 1, onInterrupt: 1, onCompleteParams: 1,
    onStartParams: 1, onUpdateParams: 1, scrollTrigger: 1, parseTransform: 1,
    runBackwards: 1, startAt: 1, transformOrigin: 1, transformStyle: 1,
    autoRound: 1, clearProps: 1, keyframes: 1,
    parent: 1, defaults: 1
  };
  var MARKER_WIDTH = 0.012;

  var captured = null;
  var demoTl = null;
  var demoApi = null;
  var demoTried = false;
  var idlePosted = false;
  var loopWaitStart = 0;
  var scanCount = 0;
  var axis = 'time';
  var lastSig = '';
  var rowsOut = null;
  var rowTargets = [];
  var parentWin = window.parent;
  var lastPosted = -1;
  var styleInjected = false;
  var loopOn = false;

  function isElement(t) { return t && t.nodeType === 1; }

  function elementLabel(el) {
    if (el.classList && el.classList.length) return '.' + el.classList[0];
    var tag = (el.tagName || '').toLowerCase();
    return tag || null;
  }

  function authoredLabel(anim) {
    return anim && anim.data && anim.data.label ? String(anim.data.label) : null;
  }

  function animatedProps(vars) {
    var props = [];
    for (var k in vars) {
      if (!RESERVED[k] && vars.hasOwnProperty(k) && k.indexOf('on') !== 0) {
        props.push(k);
      }
    }
    return props;
  }

  function staggerEach(vars, count) {
    if (!vars || !vars.stagger || count < 2) return 0;
    var st = vars.stagger;
    if (typeof st === 'number') return st;
    if (typeof st === 'object') {
      if (typeof st.each === 'number') return st.each;
      if (typeof st.amount === 'number') return st.amount / (count - 1);
    }
    return 0;
  }

  function easeName(vars) {
    if (!vars || !vars.ease) return null;
    if (typeof vars.ease === 'string') return vars.ease;
    return 'custom';
  }

  function firstDescendantElement(tl) {
    var kids = tl.getChildren(true, true, false);
    for (var i = 0; i < kids.length; i++) {
      var ts = typeof kids[i].targets === 'function' ? kids[i].targets() : [];
      for (var j = 0; j < ts.length; j++) {
        if (isElement(ts[j])) return ts[j];
      }
    }
    return null;
  }

  function childRow(child, containerDur, offset, scale, kind) {
    var isTl = typeof child.getChildren === 'function';
    var childDur = child.duration();
    if (!childDur || childDur <= 0) return null;
    if (!isFinite(childDur)) childDur = containerDur;

    var label = authoredLabel(child);
    var els = [];
    var props = [];
    var count = 0;
    var each = 0;

    if (isTl) {
      var probe = firstDescendantElement(child);
      if (!label) label = probe ? elementLabel(probe) : null;
      if (!label) return null;
      if (probe) els = [probe];
    } else {
      var targets = typeof child.targets === 'function' ? child.targets() : [];
      for (var j = 0; j < targets.length; j++) {
        if (isElement(targets[j])) els.push(targets[j]);
      }
      count = targets.length;
      if (!label) {
        if (!els.length) return null;
        label = elementLabel(els[0]) || 'element';
      }
      props = animatedProps(child.vars || {});
      each = staggerEach(child.vars, count);
    }

    var spread = each > 0 ? Math.min((each * (count - 1)) / childDur, 1) : 0;
    var startFrac = offset + (child.startTime() / containerDur) * scale;
    var widthFrac = (childDur / containerDur) * scale;
    var row = {
      label: label,
      kind: kind || (isTl ? 'nested' : 'tween'),
      start: Math.max(0, Math.min(startFrac, 1)),
      width: Math.max(0.005, Math.min(widthFrac, 1)),
      props: props,
      targetCount: count,
      staggerSpread: spread
    };
    if (MODE === 'full' && !isTl) {
      row.full = {
        startSec: Math.round(child.startTime() * 100) / 100,
        durSec: Math.round(childDur * 100) / 100,
        ease: easeName(child.vars),
        staggerSec: each ? Math.round(each * 1000) / 1000 : 0
      };
    }
    return { row: row, els: els };
  }

  function buildTimeRows(tl) {
    var cycle = tl.duration();
    if (!cycle || !isFinite(cycle)) return null;
    var children = tl.getChildren(false, true, true);
    var rows = [];
    var targets = [];
    for (var i = 0; i < children.length; i++) {
      var r = childRow(children[i], cycle, 0, 1, null);
      if (!r) continue;
      rows.push(r.row);
      targets.push(r.els);
    }
    return rows.length ? { rows: rows, targets: targets } : null;
  }

  function isScrollDriven(tl) {
    return !!(tl.scrollTrigger || (tl.vars && tl.vars.scrollTrigger));
  }

  function pickTimeMaster() {
    if (typeof gsap === 'undefined') return null;
    var candidates = [];
    if (demoTl) candidates.push(demoTl);
    if (captured && captured !== demoTl) candidates.push(captured);
    var live = gsap.globalTimeline.getChildren(false, false, true);
    for (var i = 0; i < live.length; i++) {
      if (!isScrollDriven(live[i]) && candidates.indexOf(live[i]) === -1) {
        candidates.push(live[i]);
      }
    }

    var best = null;
    var bestBuilt = null;
    for (var c = 0; c < candidates.length; c++) {
      var built = buildTimeRows(candidates[c]);
      if (!built || built.rows.length < 2) continue;
      if (!best || built.rows.length >= bestBuilt.rows.length) {
        best = candidates[c];
        bestBuilt = built;
      }
    }
    return best ? { tl: best, built: bestBuilt } : null;
  }

  function buildScrollRows() {
    if (typeof ScrollTrigger === 'undefined') return null;
    var max = ScrollTrigger.maxScroll(window);
    if (!max || max <= 0) return null;
    var all = ScrollTrigger.getAll();
    var rows = [];
    var targets = [];
    for (var i = 0; i < all.length; i++) {
      var st = all[i];
      var anim = st.animation;
      if (!anim) continue;
      if (st.end <= st.start) continue;
      var startFrac = Math.max(0, Math.min(st.start / max, 1));
      var endFrac = Math.max(0, Math.min(st.end / max, 1));
      var span = endFrac - startFrac;
      var scrubbed = !!(st.vars && st.vars.scrub);
      var isTl = typeof anim.getChildren === 'function';

      if (scrubbed && span > 0) {
        if (isTl) {
          var dur = anim.duration();
          if (!dur || !isFinite(dur)) continue;
          var children = anim.getChildren(false, true, true);
          var got = false;
          for (var k = 0; k < children.length; k++) {
            var r = childRow(children[k], dur, startFrac, span, 'scrub');
            if (!r) continue;
            rows.push(r.row);
            targets.push(r.els);
            got = true;
          }
          if (!got && authoredLabel(anim)) {
            rows.push({
              label: authoredLabel(anim), kind: 'scrub',
              start: startFrac, width: Math.max(span, 0.005),
              props: [], targetCount: 0, staggerSpread: 0
            });
            targets.push([]);
          }
        } else {
          var single = childRow(anim, anim.duration() || 1, startFrac, span, 'scrub');
          if (single) {
            single.row.start = startFrac;
            single.row.width = Math.max(span, 0.005);
            rows.push(single.row);
            targets.push(single.els);
          }
        }
      } else {
        var probeEl = isTl ? firstDescendantElement(anim) : null;
        if (!isTl) {
          var ts = typeof anim.targets === 'function' ? anim.targets() : [];
          for (var m = 0; m < ts.length; m++) {
            if (isElement(ts[m])) { probeEl = ts[m]; break; }
          }
        }
        var label = authoredLabel(anim) || (probeEl ? elementLabel(probeEl) : null);
        if (!label) continue;
        rows.push({
          label: label, kind: 'marker',
          start: startFrac, width: MARKER_WIDTH,
          props: [], targetCount: 0, staggerSpread: 0
        });
        targets.push(probeEl ? [probeEl] : []);
      }
    }
    if (!rows.length) return null;
    var order = rows.map(function (r, i) { return i; });
    order.sort(function (a, b) { return rows[a].start - rows[b].start; });
    return {
      rows: order.map(function (i) { return rows[i]; }),
      targets: order.map(function (i) { return targets[i]; })
    };
  }

  function sigOf(ax, rows) {
    var s = ax + ':';
    for (var i = 0; i < rows.length; i++) {
      s += rows[i].label + '|' + rows[i].kind + '|' + rows[i].start.toFixed(3) +
           '|' + rows[i].width.toFixed(3) + ';';
    }
    return s;
  }

  function findDemoApi() {
    var anm = window.Anm;
    if (!anm) return null;
    for (var key in anm) {
      var api = anm[key];
      if (api && typeof api.demo === 'function') return api;
    }
    return null;
  }

  function tryDemo() {
    if (window.__anmAutoDemo !== true) return;
    if (demoTried || rowsOut) return;
    var api = findDemoApi();
    if (!api) return;
    demoApi = api;
    try {
      var handle = api.demo();
      if (handle && typeof handle.progress === 'function') demoTl = handle;
      if (handle) demoTried = true;
    } catch (e) {
      demoTried = true;
    }
  }

  function tryIdle() {
    if (idlePosted || rowsOut) return;
    if (window.__anmAutoDemo === true) return;
    if (!findDemoApi()) return;
    idlePosted = true;
    try {
      parentWin.postMessage({ type: 'anm:timeline:idle' }, '*');
    } catch (e) { }
  }

  function scan() {
    scanCount++;

    var time = pickTimeMaster();
    var scroll = buildScrollRows();
    var timeCount = time ? time.built.rows.length : 0;
    var scrollCount = scroll && scroll.rows.length >= 2 ? scroll.rows.length : 0;
    if (timeCount < 2 && scrollCount < 2) {
      if (scanCount >= 3) {
        tryDemo();
        tryIdle();
      }
      return;
    }

    var nextAxis, built, tl = null;
    if (scrollCount >= timeCount) {
      nextAxis = 'scroll';
      built = scroll;
    } else {
      nextAxis = 'time';
      built = time.built;
      tl = time.tl;
    }

    axis = nextAxis;
    captured = tl;
    rowTargets = built.targets;
    var sig = sigOf(nextAxis, built.rows);
    if (sig === lastSig) return;
    lastSig = sig;
    rowsOut = built.rows;
    lastPosted = -1;
    try {
      parentWin.postMessage({
        type: 'anm:timeline:rows',
        axis: axis,
        rows: rowsOut,
        cycle: MODE === 'full' && tl ? Math.round(tl.duration() * 100) / 100 : null
      }, '*');
    } catch (e) { }
  }

  var fastScans = 0;
  var fastTimer = setInterval(function () {
    scan();
    fastScans++;
    if (rowsOut || fastScans >= 300) {
      clearInterval(fastTimer);
      setInterval(scan, 1500);
    }
  }, 200);

  function resetVideos() {
    for (var i = 0; i < rowTargets.length; i++) {
      var els = rowTargets[i];
      for (var j = 0; j < els.length; j++) {
        var el = els[j];
        try {
          if (el.tagName === 'VIDEO') el.currentTime = 0;
          else if (el.querySelectorAll) {
            var vids = el.querySelectorAll('video');
            for (var k = 0; k < vids.length; k++) vids[k].currentTime = 0;
          }
        } catch (e) { }
      }
    }
  }

  function loopTick() {
    if (!loopOn || axis === 'scroll' || !captured) { loopWaitStart = 0; return; }
    if (captured.paused() || captured.progress() < 1) { loopWaitStart = 0; return; }
    if (!demoApi) {
      resetVideos();
      captured.restart(true, false);
      return;
    }
    var now = Date.now();
    if (!loopWaitStart) { loopWaitStart = now; return; }
    if (now - loopWaitStart < 600) return;
    loopWaitStart = 0;
    try {
      var handle = demoApi.demo();
      if (handle && typeof handle.progress === 'function') demoTl = handle;
    } catch (e) { }
  }

  function currentProgress() {
    if (axis === 'scroll') {
      if (typeof ScrollTrigger === 'undefined') return null;
      var max = ScrollTrigger.maxScroll(window);
      if (!max || max <= 0) return null;
      var y = window.pageYOffset || document.documentElement.scrollTop || 0;
      return Math.max(0, Math.min(y / max, 1));
    }
    return captured ? captured.progress() : null;
  }

  function tick() {
    loopTick();
    if (rowsOut) {
      var p = currentProgress();
      if (p != null && Math.abs(p - lastPosted) > 0.002) {
        lastPosted = p;
        try {
          parentWin.postMessage({
            type: 'anm:timeline:playhead',
            progress: p,
            active: axis === 'scroll' ? true : !!(captured && captured.isActive())
          }, '*');
        } catch (e) { }
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  var hlEls = [];
  var hlBoxes = [];
  var hlRaf = null;

  function ensureStyle() {
    if (styleInjected) return;
    styleInjected = true;
    var st = document.createElement('style');
    st.textContent = '.anm-tl-hl-box { position: fixed; border: 1px solid #fd551d; pointer-events: none; z-index: 2147483000; }';
    document.head.appendChild(st);
  }

  function positionBoxes() {
    for (var i = 0; i < hlEls.length; i++) {
      var r = hlEls[i].getBoundingClientRect();
      var b = hlBoxes[i].style;
      b.left = (r.left - 2) + 'px';
      b.top = (r.top - 2) + 'px';
      b.width = (r.width + 4) + 'px';
      b.height = (r.height + 4) + 'px';
    }
    hlRaf = requestAnimationFrame(positionBoxes);
  }

  function clearHighlight() {
    if (hlRaf) { cancelAnimationFrame(hlRaf); hlRaf = null; }
    for (var i = 0; i < hlBoxes.length; i++) {
      if (hlBoxes[i].parentNode) hlBoxes[i].parentNode.removeChild(hlBoxes[i]);
    }
    hlEls = [];
    hlBoxes = [];
  }

  window.addEventListener('message', function (e) {
    var d = e && e.data;
    if (!d) return;

    if (d.type === 'anm:timeline:scrub') {
      var sp = Math.max(0, Math.min(Number(d.progress) || 0, 1));
      if (axis === 'scroll') {
        if (typeof ScrollTrigger !== 'undefined') {
          var smax = ScrollTrigger.maxScroll(window);
          if (smax > 0) {
            window.scrollTo({ top: sp * smax, left: 0, behavior: 'instant' });
          }
        }
      } else if (captured) {
        captured.pause();
        captured.progress(sp, false);
      }
      return;
    }

    if (d.type === 'anm:timeline:resend') {
      lastSig = '';
      idlePosted = false;
      scan();
      return;
    }

    if (d.type === 'anm:timeline:loop') {
      loopOn = !!d.on;
      loopWaitStart = 0;
      if (loopOn && axis !== 'scroll' && !captured) {
        var lapi = findDemoApi();
        if (lapi) {
          demoApi = lapi;
          try {
            var lh2 = lapi.demo();
            if (lh2 && typeof lh2.progress === 'function') demoTl = lh2;
          } catch (e) { }
          scan();
        }
        return;
      }
      if (loopOn && axis !== 'scroll' && captured &&
          captured.progress() >= 1 && !captured.paused()) {
        if (demoApi) {
          try {
            var lh = demoApi.demo();
            if (lh && typeof lh.progress === 'function') demoTl = lh;
          } catch (e) { }
        } else {
          resetVideos();
          captured.restart(true, false);
        }
      }
      return;
    }

    if (d.type === 'anm:timeline:playpause') {
      if (axis === 'scroll') return;
      if (!captured) {
        var papi = findDemoApi();
        if (!papi) return;
        demoApi = papi;
        try {
          var ph = papi.demo();
          if (ph && typeof ph.progress === 'function') demoTl = ph;
        } catch (e) { }
        scan();
        return;
      }
      if (captured.paused() || !captured.isActive()) {
        if (captured.progress() >= 1) {
          resetVideos();
          captured.restart(true, false);
        } else {
          captured.play();
        }
      } else {
        captured.pause();
      }
      return;
    }

    if (d.type !== 'anm:timeline:highlight') return;
    clearHighlight();
    if (d.index == null) return;
    var els = rowTargets[d.index] || [];
    if (!els.length) return;
    ensureStyle();
    for (var i = 0; i < els.length; i++) {
      var box = document.createElement('div');
      box.className = 'anm-tl-hl-box';
      document.body.appendChild(box);
      hlEls.push(els[i]);
      hlBoxes.push(box);
    }
    positionBoxes();
  });
})();
</script>`;

FRAME_SCRIPT.replace("__ANM_TL_MODE__", "shape");
const FULL_FRAME_SCRIPT = FRAME_SCRIPT.replace("__ANM_TL_MODE__", "full");

const SHORTCUT_SCRIPT = `
<script>
(function () {
  'use strict';
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    var key = null;
    if (e.key === 'Escape') key = 'Escape';
    else if (e.key === 'f' || e.key === 'F') key = 'f';
    else if (e.key === 'r' || e.key === 'R') key = 'r';
    if (!key) return;
    try {
      window.parent.postMessage({ type: 'annnimate-shortcut', key: key }, '*');
    } catch (err) {
      // not framed, or a cross-origin parent: nothing to forward to
    }
  });
})();
</script>
`;

async function convertImagesToBase64(html) {
  if (!html) return html;
  const matches = [...html.matchAll(/(?:src|data-anm-image(?:-\d+)?)="(\/preview-assets\/[^"]+)"/g)];
  let output = html;

  for (const match of matches) {
    const url = match[1];
    const fullMatch = match[0];
    const attrName = fullMatch.split("=")[0];
    
    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      
      const blob = await response.blob();
      const base64 = await new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      
      output = output.replace(fullMatch, `${attrName}="${base64}"`);
    } catch (e) {
      console.warn(`Failed to convert image ${url} to base64:`, e);
    }
  }
  return output;
}

const VIEWPORT_OPTIONS = [
  { id: "full", label: "Full", w: null, Icon: FrameCorners },
  { id: "mobile", label: "Mobile", w: 375, Icon: DeviceMobile },
  { id: "tablet", label: "Tablet", w: 768, Icon: DeviceTablet },
  { id: "laptop", label: "Laptop", w: 1024, Icon: Laptop },
  { id: "desktop", label: "Desktop", w: 1440, Icon: Desktop }
];

const DEFAULT_VIEWPORT_WIDTH = VIEWPORT_OPTIONS.find(o => o.id === "desktop")?.w ?? null;

function IframeWrapper({ srcdoc, src, reloadKey, title, renderWidth, scale, stageHeight }) {
  return (
    <div style={{ width: renderWidth * scale, height: stageHeight, flexShrink: 0 }}>
      <div
        style={{
          width: renderWidth,
          height: stageHeight / scale,
          transform: `scale(${scale})`,
          transformOrigin: "top left"
        }}
      >
        <iframe
          {...(src ? { src } : { srcDoc: srcdoc })}
          title={title}
          key={reloadKey}
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
          style={{ width: "100%", height: "100%", border: 0, display: "block" }}
        />
      </div>
    </div>
  );
}

export function PreviewBlock({ animation, codeState, previewSrcOverride = null, customize = null }) {
  const [viewportWidth, setViewportWidth] = useState(DEFAULT_VIEWPORT_WIDTH);
  const [reloadKey, setReloadKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const updateWidth = () => setContainerWidth(el.clientWidth);
    
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(el);
    
    return () => observer.disconnect();
  }, []);

  const htmlCode = codeState?.html ?? animation.html_code ?? "";
  const cssCode = codeState?.css ?? animation.css_code ?? "";
  const jsCode = codeState?.js ?? animation.js_code ?? animation.gsap_code ?? "";
  const hasAuthoredCode = !previewSrcOverride && !!(htmlCode || cssCode || jsCode);
  const committedAttrs = customize?.committed;

  const sandboxApiUrl = useMemo(() => {
    const base = `/api/sandbox/iframe/${encodeURIComponent(animation.slug)}`;
    if (committedAttrs && Object.keys(committedAttrs).length !== 0) {
      return `${base}?attrs=${encodeURIComponent(JSON.stringify(committedAttrs))}`;
    }
    return base;
  }, [animation.slug, committedAttrs]);

  const iframeSrc = previewSrcOverride || (hasAuthoredCode ? undefined : sandboxApiUrl);

  const parsedDependencies = useMemo(() => {
    const deps = animation.dependencies;
    if (!deps) return [];
    if (Array.isArray(deps)) return deps;
    if (typeof deps === "object" && deps !== null) {
      const keys = Object.keys(deps);
      return keys.length > 0 ? keys : [];
    }
    if (typeof deps === "string") {
      try {
        const parsed = JSON.parse(deps);
        if (Array.isArray(parsed)) return parsed;
        if (typeof parsed === "object" && parsed !== null) {
          const keys = Object.keys(parsed);
          return keys.length > 0 ? keys : [];
        }
      } catch {
        return deps.split(",").map(d => d.trim()).filter(Boolean);
      }
    }
    return [];
  }, [animation.dependencies]);

  const { srcdoc, isLoading } = usePreviewGenerator({
    animationName: animation.title,
    animationDescription: animation.description,
    category: animation.category,
    layout: animation.layout,
    htmlCode,
    cssCode,
    jsCode,
    dependencies: parsedDependencies,
    metadata: animation.metadata
  });

  const isBuilding = !!hasAuthoredCode && isLoading;

  const customizeValues = customize?.values;

  useEffect(() => {
    if (hasAuthoredCode || !customize || !customizeValues || Object.keys(customizeValues).length === 0) return;

    const timer = setTimeout(() => {
      const iframe = containerRef.current?.querySelector("iframe");
      iframe?.contentWindow?.postMessage({
        type: "anm:customize",
        selector: customize.selector,
        attrs: customizeValues,
        api: customize.api
      }, "*");
    }, 200);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customizeValues, hasAuthoredCode, reloadKey]);

  const triggerReload = useCallback(() => setReloadKey(prev => prev + 1), []);
  const exitFullscreen = useCallback(() => setIsFullscreen(false), []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target;
      
      if (!(target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable || target?.closest?.(".cm-editor"))) {
        if (e.key === "f" || e.key === "F") {
          e.preventDefault();
          setIsFullscreen(prev => !prev);
        } else if (e.key === "r" || e.key === "R") {
          e.preventDefault();
          triggerReload();
        } else if (e.key === "Escape" && isFullscreen) {
          e.preventDefault();
          exitFullscreen();
        }
      }
    }
    
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen, triggerReload, exitFullscreen]);

  useEffect(() => {
    function handleMessage(e) {
      if (e?.data?.type !== "annnimate-shortcut") return;
      const key = e.data.key;
      
      if (key === "f") setIsFullscreen(prev => !prev);
      else if (key === "r") triggerReload();
      else if (key === "Escape") setIsFullscreen(false);
    }
    
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [triggerReload]);

  const renderWidth = viewportWidth ?? (containerWidth || 0);
  const scale = renderWidth > containerWidth && containerWidth > 0 ? containerWidth / renderWidth : 1;
  const scalePercent = Math.round(scale * 100);
  const stageHeight = Math.max(360, Math.round((containerWidth || 0) * 0.625));
  const activeViewportId = VIEWPORT_OPTIONS.find(o => (viewportWidth ?? null) === o.w)?.id;

  return (
    <section className="flex flex-col gap-12">
      <div className="bg-foreground/[0.04] p-12">
        <div 
          ref={containerRef} 
          className="relative flex w-full justify-center overflow-hidden bg-background" 
          style={{ height: stageHeight }}
        >
          {isBuilding || !renderWidth ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-body-sm text-foreground-muted">Loading preview...</p>
            </div>
          ) : (
            <IframeWrapper
              srcdoc={hasAuthoredCode ? srcdoc : undefined}
              src={iframeSrc}
              reloadKey={reloadKey}
              title={`${animation.title} preview`}
              renderWidth={renderWidth}
              scale={scale}
              stageHeight={stageHeight}
            />
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap items-center justify-between gap-12">
        <div className="hidden lg:block">
          <Select
            value={activeViewportId}
            onChange={val => {
              const option = VIEWPORT_OPTIONS.find(o => o.id === val);
              if (option) setViewportWidth(option.w);
            }}
            options={VIEWPORT_OPTIONS.map(o => ({
              value: o.id,
              label: o.label,
              icon: o.Icon // Select component will handle Phosphor icons internally
            }))}
            size="sm"
            labelSize="xs"
            ariaLabel="Viewport size"
          />
        </div>
        
        <div className="flex items-center gap-8">
          {scale < 0.999 && (
            <span 
              className="text-accent-2xs flex h-32 items-center bg-foreground/[0.06] px-8 text-foreground-muted"
              title={`Rendering at ${renderWidth}px, scaled to fit ${containerWidth}px container`}
            >
              {scalePercent}% scale
            </span>
          )}
          
          <button
            type="button"
            onClick={triggerReload}
            aria-label="Replay"
            title="Replay (R)"
            className="text-accent-2xs flex h-32 items-center gap-6 bg-foreground px-10 text-background transition-opacity duration-(--duration-quick) ease-(--ease-expo-out) hover:opacity-90"
          >
            <ArrowClockwise size={14} />
            <span className="hidden lg:inline">Replay</span>
            <kbd className="text-[9px] ml-4 hidden bg-background/15 px-4 py-1 font-mono text-background/80 lg:inline-block">
              R
            </kbd>
          </button>
          
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            aria-label="Fullscreen"
            title="Fullscreen (F)"
            className="text-accent-2xs flex h-32 items-center gap-6 border border-foreground/15 px-10 text-foreground-muted transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:border-foreground/40 hover:text-foreground"
          >
            <ArrowsOut size={14} />
            <span className="hidden lg:inline">Fullscreen</span>
            <kbd className="text-[9px] ml-4 hidden border border-foreground/15 px-4 py-1 font-mono text-foreground-muted lg:inline-block">
              F
            </kbd>
          </button>
        </div>
      </div>
      
      {isFullscreen && isMounted && createPortal(
        <div 
          role="dialog" 
          aria-modal="true" 
          aria-label={`${animation.title} fullscreen preview`}
          className="fixed inset-0 z-[400] bg-background"
        >
          <div className="absolute bottom-16 right-16 z-10 flex items-center gap-8">
            <button
              type="button"
              onClick={triggerReload}
              aria-label="Replay"
              title="Replay (R)"
              className="text-accent-2xs flex h-32 items-center gap-6 border border-white/20 bg-[#0a0a0a]/85 px-10 text-white backdrop-blur-md transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:bg-[#0a0a0a]"
            >
              <ArrowClockwise size={14} />
              <span>Replay</span>
              <kbd className="text-[9px] ml-4 border border-white/20 px-4 py-1 font-mono text-white/80">
                R
              </kbd>
            </button>
            
            <button
              type="button"
              onClick={exitFullscreen}
              aria-label="Exit fullscreen"
              title="Close (Esc)"
              className="text-accent-2xs flex h-32 items-center gap-6 border border-white/20 bg-[#0a0a0a]/85 px-10 text-white backdrop-blur-md transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:bg-[#0a0a0a]"
            >
              <X size={14} />
              <span>Close</span>
              <kbd className="text-[9px] ml-4 border border-white/20 px-4 py-1 font-mono text-white/80">
                Esc
              </kbd>
            </button>
          </div>
          
          {!isBuilding && (
            <iframe
              key={`fs-${reloadKey}`}
              {...(hasAuthoredCode ? { srcDoc: srcdoc } : { src: iframeSrc })}
              title={`${animation.title} fullscreen preview`}
              sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
              style={{ width: "100%", height: "100%", border: 0, display: "block" }}
            />
          )}
        </div>,
        document.body
      )}
    </section>
  );
}

// Hook logic extracted from the main component body
function usePreviewGenerator({
  animationName = "Animation Preview",
  animationDescription = "",
  category = "instant",
  layout,
  htmlCode = "",
  cssCode = "",
  jsCode = "",
  dependencies = [],
  compact = false,
  metadata = null
}) {
  const [templateHtml, setTemplateHtml] = useState("");
  const [processedHtmlCode, setProcessedHtmlCode] = useState("");
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
  const [isProcessingHtml, setIsProcessingHtml] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    async function loadTemplate() {
      try {
        const getTemplateName = ({ metadata, category, animationName, compact }) => {
          const tpl = metadata?.previewTemplate || metadata?.sandbox_template;
          if (tpl && PREVIEW_TEMPLATES.has(tpl)) return tpl;
          
          const nameStr = (animationName || "").toLowerCase();
          if (category === "shader") return nameStr.includes("scroll") ? "shader-scroll" : "shader";
          if (category === "scroll") return nameStr.includes("text") ? "scroll-text" : "scroll-cover";
          if (nameStr.includes("menu") || metadata?.type === "menu") return "menu";
          if (compact) return "compact";
          return "instant";
        };
        
        let templateName = getTemplateName({ metadata, category, animationName, compact });
        
        // Safety fallback logic from original source
        if (!metadata?.previewTemplate && !metadata?.sandbox_template && layout === "full-viewport" && (templateName === "instant" || templateName === "compact")) {
          templateName = "menu";
        }

        const response = await fetch(`/animations/templates/${templateName}.html`);
        const text = await response.text();
        
        if (isMounted) setTemplateHtml(text);
      } catch (e) {
        console.error("Failed to load template:", e);
        if (isMounted) {
          setTemplateHtml(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Animation Preview</title>
  <style>
    body { background:#0a0a0a; color:#fafafa; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; padding:3rem; display:flex; align-items:center; justify-content:center; min-height:100vh; }
    {{ANIMATION_CSS}}
  </style>
</head>
<body>
  {{ANIMATION_HTML}}
  {{ANIMATION_SCRIPTS}}
</body>
</html>`);
        }
      } finally {
        if (isMounted) setIsLoadingTemplate(false);
      }
    }
    
    loadTemplate();
    return () => { isMounted = false; };
  }, [category, animationName, compact, layout, metadata?.previewTemplate, metadata?.sandbox_template, metadata?.type]);

  useEffect(() => {
    let isMounted = true;
    
    async function processHtml() {
      setIsProcessingHtml(true);
      const converted = await convertImagesToBase64(htmlCode);
      if (isMounted) {
        setProcessedHtmlCode(converted);
        setIsProcessingHtml(false);
      }
    }
    
    if (htmlCode) {
      processHtml();
    } else {
      setProcessedHtmlCode("");
      setIsProcessingHtml(false);
    }
    
    return () => { isMounted = false; };
  }, [htmlCode]);

  const finalSrcDoc = useMemo(() => {
    if (!templateHtml) return "";
    
    const isFullWidth = typeof metadata?.previewFullWidth === "boolean" 
      ? metadata.previewFullWidth 
      : category !== "button";
      
    let html = templateHtml;
    
    if (isFullWidth) {
      html = html
        .replace('class="preview-container"', 'class="preview-container is-fullwidth"')
        .replace('class="animation-container"', 'class="animation-container is-fullwidth"')
        .replace('class="preview-animation"', 'class="preview-animation is-fullwidth"');
    }

    const scripts = (jsCode && jsCode.trim() !== "") 
      ? generateScriptsTag({ jsCode, dependencies, category }) 
      : `<script>console.log('[preview] CSS-only animation loaded');</script>\n${SHORTCUT_SCRIPT}`;

    return html
      .replace(/\{\{ANIMATION_NAME\}\}/g, () => animationName)
      .replace(/\{\{ANIMATION_DESCRIPTION\}\}/g, () => animationDescription)
      .replace(/\{\{ANIMATION_HTML\}\}/g, () => processedHtmlCode || '<div class="demo-text">No preview available</div>')
      .replace(/\{\{ANIMATION_CSS\}\}/g, () => cssCode || "")
      .replace(/\{\{ANIMATION_SCRIPTS\}\}/g, () => scripts);
      
  }, [templateHtml, processedHtmlCode, cssCode, jsCode, animationName, animationDescription, dependencies, category, metadata]);

  return { srcdoc: finalSrcDoc, isLoading: isLoadingTemplate || isProcessingHtml };
}

function generateScriptsTag({ jsCode, dependencies, category }) {
  const dependencyMap = {
    gsap: "https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js",
    ScrollTrigger: "https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js",
    three: "https://cdn.jsdelivr.net/npm/three@0.169.0/+esm",
    ScrollSmoother: "https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollSmoother.min.js",
    SplitText: "https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/SplitText.min.js",
    Flip: "https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/Flip.min.js",
    Draggable: "https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/Draggable.min.js",
    InertiaPlugin: "https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/InertiaPlugin.min.js",
    Observer: "https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/Observer.min.js",
    MotionPathPlugin: "https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/MotionPathPlugin.min.js",
    ScrollToPlugin: "https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollToPlugin.min.js",
    DrawSVGPlugin: "https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/DrawSVGPlugin.min.js",
    MorphSVGPlugin: "https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/MorphSVGPlugin.min.js",
    ScrambleTextPlugin: "https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrambleTextPlugin.min.js",
    CustomEase: "https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/CustomEase.min.js"
  };
  
  const requiredDeps = Array.isArray(dependencies) ? dependencies : [];
  
  return `
<script>
(function () {
  var origLog = console.log, origErr = console.error;
  function sendConsole(type, args) {
    var message = Array.from(args).map(function (a) {
      if (typeof a === 'object') { try { return JSON.stringify(a, null, 2); } catch (e) { return String(a); } }
      return String(a);
    }).join(' ');
    try { window.parent.postMessage({ type: 'console', level: type, message: message, timestamp: new Date().toISOString() }, '*'); } catch (e) {}
  }
  console.log = function () { sendConsole('log', arguments); origLog.apply(console, arguments); };
  console.error = function () { sendConsole('error', arguments); origErr.apply(console, arguments); };

  var dependencyMap = ${JSON.stringify(dependencyMap)};
  var requiredDeps = ${JSON.stringify(requiredDeps)};
  var depsToLoad = ['gsap'];
  requiredDeps.forEach(function (d) { if (d !== 'gsap' && !depsToLoad.includes(d)) depsToLoad.push(d); });

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src; s.onload = resolve;
      s.onerror = function () { reject(new Error('Failed: ' + src)); };
      document.head.appendChild(s);
    });
  }
  function loadModule(url, globalName) {
    return new Promise(function (resolve, reject) {
      var eventId = 'anm-esm-' + globalName;
      var s = document.createElement('script');
      s.type = 'module';
      s.textContent = 'import * as m from "' + url + '"; window.' + globalName + ' = m; window.dispatchEvent(new CustomEvent("' + eventId + '"));';
      window.addEventListener(eventId, resolve, { once: true });
      setTimeout(function () { reject(new Error('ESM timeout: ' + url)); }, 20000);
      document.head.appendChild(s);
    });
  }
  async function loadDependencies() {
    var esmDeps = { three: 'THREE' };
    try {
      for (var i = 0; i < depsToLoad.length; i++) {
        var dep = depsToLoad[i];
        var url = dependencyMap[dep];
        if (!url) continue;
        if (esmDeps[dep]) await loadModule(url, esmDeps[dep]);
        else await loadScript(url);
      }
      return true;
    } catch (e) {
      console.error('Failed to load dependencies:', e);
      return false;
    }
  }
  function waitForGSAP(cb, attempts) {
    attempts = attempts || 0;
    if (typeof gsap === 'undefined') {
      if (attempts < 50) setTimeout(function () { waitForGSAP(cb, attempts + 1); }, 100);
      else console.error('GSAP failed to load');
      return;
    }
    var pluginsToRegister = [];
    ['ScrollTrigger','ScrollSmoother','SplitText','Flip','Draggable','InertiaPlugin','Observer','MotionPathPlugin','ScrollToPlugin','DrawSVGPlugin','MorphSVGPlugin','ScrambleTextPlugin','CustomEase']
      .forEach(function (name) { if (typeof window[name] !== 'undefined') pluginsToRegister.push(window[name]); });
    if (pluginsToRegister.length) gsap.registerPlugin.apply(gsap, pluginsToRegister);
    cb();
  }
  function runAnimation() {
    ${jsCode || "console.log('No animation code provided');"}
  }
  loadDependencies().then(function (success) {
    if (!success) return;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { waitForGSAP(runAnimation); });
    } else {
      waitForGSAP(runAnimation);
    }
  });
${category === "scroll" ? `  window.addEventListener('load', function () {
    var section = document.getElementById('animation-section');
    if (!section) return;
    setTimeout(function () { section.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 600);
  });` : ""}
})();
</script>
${SHORTCUT_SCRIPT}
${FULL_FRAME_SCRIPT}
`;
}

// --- AttributesSection (747198) --- //

function AttributeItem({ attr }) {
  const attributeName = attr.name || attr.attribute || "";
  const nameToCopy = attributeName.startsWith("data-anm-") ? attributeName : `data-anm-${attributeName}`;
  const [copiedName, setCopiedName] = useState(null);
  const timeoutRef = useRef(null);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setCopiedName(text);
      toast.success(`Copied: ${text}`);
      timeoutRef.current = setTimeout(() => setCopiedName(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const isCopied = copiedName === nameToCopy;
  
  let defaultDisplay = "—";
  if (attr.default != null) {
    if (typeof attr.default === "boolean") {
      defaultDisplay = attr.default ? "true" : "false";
    } else if (typeof attr.default === "string" && attr.default === "") {
      defaultDisplay = '""';
    } else {
      defaultDisplay = String(attr.default);
    }
  }

  return (
    <li className="flex flex-col gap-8 px-16 py-12 md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)_minmax(0,0.6fr)_minmax(0,2fr)] md:items-start md:gap-12">
      <div className="flex flex-wrap items-center gap-8">
        <button
          type="button"
          onClick={() => copyToClipboard(nameToCopy)}
          title="Click to copy"
          className="text-[11px] flex items-center gap-6 bg-foreground/[0.06] px-8 py-4 font-mono normal-case text-foreground transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:bg-foreground/[0.10]"
        >
          {isCopied ? (
            <Fragment>
              <span>Copied</span>
              <Check size={12} className="text-brand" />
            </Fragment>
          ) : (
            <span>{nameToCopy}</span>
          )}
        </button>
        {attr.required && (
          <span className="text-accent-2xs bg-brand px-6 py-2 font-medium text-[#141314]">
            Required
          </span>
        )}
      </div>
      <span className="text-accent-2xs normal-case text-foreground-muted md:pt-8">
        {attr.type || "string"}
      </span>
      <span className="text-[11px] font-mono text-foreground-muted md:pt-8">
        {defaultDisplay}
      </span>
      <p className="text-body-sm leading-relaxed text-foreground-muted">
        {attr.description}
      </p>
    </li>
  );
}

function AttributesTable({ attributes = [] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!attributes || attributes.length === 0) return null;

  const visibleAttrs = isExpanded ? attributes : attributes.slice(0, 5);
  const hasMore = attributes.length > 5;
  const moreCount = attributes.length - 5;

  return (
    <div className="border border-foreground/10">
      <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)_minmax(0,0.6fr)_minmax(0,2fr)] gap-12 border-b border-foreground/10 bg-foreground/[0.04] px-16 py-10 md:grid">
        <span className="text-accent-xs text-foreground-muted">Attribute</span>
        <span className="text-accent-xs text-foreground-muted">Type</span>
        <span className="text-accent-xs text-foreground-muted">Default</span>
        <span className="text-accent-xs text-foreground-muted">Description</span>
      </div>
      <ul className="m-0 list-none divide-y divide-foreground/10 p-0">
        {visibleAttrs.map((attr, idx) => (
          <AttributeItem key={`${attr.name || attr.attribute}-${idx}`} attr={attr} />
        ))}
      </ul>
      {hasMore && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-accent-xs flex w-full items-center justify-center gap-6 border-t border-foreground/10 bg-foreground/[0.04] py-10 text-foreground-muted transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:text-foreground"
        >
          {isExpanded ? (
            <Fragment>
              <CaretUp size={12} /> Show less
            </Fragment>
          ) : (
            <Fragment>
              <CaretDown size={12} /> Show {moreCount} more
            </Fragment>
          )}
        </button>
      )}
    </div>
  );
}

export function AttributesSection({ animation }) {
  const attrsNode = animation?.attributes;
  const finalAttributes = attrsNode 
    ? Array.isArray(attrsNode) 
      ? attrsNode 
      : [
          ...(attrsNode?.attributes?.selectors || attrsNode?.selectors || []),
          ...(attrsNode?.attributes?.configurables || attrsNode?.configurables || [])
        ]
    : [];

  if (finalAttributes.length === 0) return null;

  return (
    <section className="border-t border-foreground/10 pt-32">
      <span className="text-accent-xs text-foreground-muted">Attributes</span>
      <h2 className="text-h4 mt-12 text-foreground">Tune it.</h2>
      <div className="mt-16">
        <AttributesTable attributes={finalAttributes} />
      </div>
    </section>
  );
}


// --- PresetsSection (799422) --- //

function asArray(val) {
  return Array.isArray(val) ? val : [];
}

const URL_REGEX = /(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])/g;

function parseLinks(text) {
  if (typeof text !== "string" || text.indexOf("http") === -1) return text;
  
  return text.split(URL_REGEX).map((part, i) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline decoration-foreground/30 underline-offset-2 transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:decoration-foreground"
        >
          {part.replace(/^https?:\/\//, "")}
        </a>
      );
    }
    return part;
  });
}

function TipArticle({ item }) {
  if (typeof item === "string") {
    return (
      <article>
        <p className="text-reading text-foreground-reading">{parseLinks(item)}</p>
      </article>
    );
  }
  
  const codeContent = item.code || item.code_example;
  
  // Basic language inference
  const lang = codeContent 
    ? (codeContent.includes("data-anm-") || codeContent.includes("<div") || codeContent.includes("<button")) ? "html" 
      : (codeContent.includes("{") && (codeContent.includes("animation") || codeContent.includes("transform"))) ? "css" 
      : (codeContent.includes("gsap.") || codeContent.includes("function")) ? "javascript" 
      : "html"
    : "plaintext";

  return (
    <article>
      {item.title && (
        <h3 className="text-body font-medium text-foreground">{item.title}</h3>
      )}
      {item.content && (
        <p className="text-reading mt-8 text-foreground-reading">
          {parseLinks(item.content)}
        </p>
      )}
      {codeContent && (
        <div className="mt-12">
          <CodeSnippet language={lang} copyable={true}>
            {codeContent}
          </CodeSnippet>
        </div>
      )}
    </article>
  );
}

function TipsList({ tips }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleTips = isExpanded ? tips : tips.slice(0, 1);
  const hiddenCount = tips.length - 1;

  return (
    <Fragment>
      <div className="mt-16 flex flex-col gap-24">
        {visibleTips.map((tip, idx) => (
          <TipArticle key={idx} item={tip} />
        ))}
      </div>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setIsExpanded(prev => !prev)}
          className="text-accent-xs mt-16 flex w-full items-center justify-center gap-6 border-t border-foreground/10 bg-foreground/[0.04] py-10 text-foreground-muted transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:text-foreground"
        >
          <CaretDown
            size={12}
            className={`transition-transform duration-(--duration-quick) ${isExpanded ? "rotate-180" : ""}`}
          />
          {isExpanded ? "Show less" : `Show ${hiddenCount} more`}
        </button>
      )}
    </Fragment>
  );
}

function PresetItem({ item, onApply = null }) {
  const label = item.displayName || item.name;
  const overrides = item.attributes_override || {};
  
  const codeLabels = (
    <span className="flex flex-wrap items-center gap-6">
      {Object.entries(overrides).map(([key, val]) => (
        <code key={key} className="bg-foreground/[0.06] px-8 py-2 font-mono text-[10px] text-foreground-muted">
          {key}="{val}"
        </code>
      ))}
    </span>
  );

  if (onApply) {
    return (
      <li>
        <button
          type="button"
          onClick={() => {
            onApply(overrides);
            toast.success(`${label} applied`);
          }}
          className="group flex w-full items-baseline justify-between gap-12 border border-transparent px-8 py-6 text-left transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:bg-foreground/[0.04]"
        >
          <span className="flex flex-wrap items-baseline gap-x-12 gap-y-6">
            <span className="text-body-sm font-medium text-foreground">{label}</span>
            {codeLabels}
          </span>
          <span className="text-accent-xs shrink-0 self-center text-foreground-muted opacity-0 transition-opacity duration-(--duration-quick) group-hover:opacity-100">
            Apply
          </span>
        </button>
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-baseline gap-x-12 gap-y-6 px-8 py-6">
      <span className="text-body-sm font-medium text-foreground">{label}</span>
      {codeLabels}
    </li>
  );
}

function UseCaseItem({ item }) {
  if (typeof item === "string") {
    return (
      <li className="text-reading flex gap-12 text-foreground-reading">
        <span aria-hidden="true" className="mt-[0.55em] block size-6 shrink-0 bg-brand" />
        <span>{item}</span>
      </li>
    );
  }
  
  return (
    <li className="flex gap-12">
      <span aria-hidden="true" className="mt-[0.55em] block size-6 shrink-0 bg-brand" />
      <div>
        {item.title && (
          <span className="text-reading font-medium text-foreground">
            {item.title}.{" "}
          </span>
        )}
        {item.description && (
          <span className="text-reading text-foreground-reading">
            {item.description}
          </span>
        )}
      </div>
    </li>
  );
}

export function PresetsSection({ animation, onApplyPreset = null }) {
  const metadata = animation?.metadata || {};
  
  const tipsData = [
    ...asArray(metadata.tips),
    ...asArray(metadata.troubleshooting).map(item => ({
      title: item.title || item.problem,
      content: item.content || item.solution,
      code: item.code
    }))
  ];
  
  const useCases = asArray(metadata.use_cases);
  const presets = asArray(metadata.variations).filter(v => v && v.attributes_override && Object.keys(v.attributes_override).length > 0);

  if (tipsData.length === 0 && useCases.length === 0 && presets.length === 0) return null;

  return (
    <div className="flex flex-col gap-32">
      {tipsData.length > 0 && (
        <section className="border-t border-foreground/10 pt-32">
          <span className="text-accent-xs text-foreground-muted">Tips</span>
          <h2 className="text-h4 mt-12 text-foreground">How to get it right.</h2>
          <TipsList tips={tipsData} />
          
          {presets.length > 0 && (
            <div className="mt-24 border-t border-foreground/10 pt-16">
              <span className="text-accent-xs text-foreground-muted">Drop-in presets</span>
              {onApplyPreset && (
                <p className="text-body-sm mt-6 text-foreground-muted">
                  Click one to apply it to the sliders.
                </p>
              )}
              <ul className="mt-12 flex flex-col gap-4">
                {presets.map((preset, idx) => (
                  <PresetItem key={idx} item={preset} onApply={onApplyPreset} />
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
      
      {useCases.length > 0 && (
        <section className="border-t border-foreground/10 pt-32">
          <span className="text-accent-xs text-foreground-muted">Good for</span>
          <h2 className="text-h4 mt-12 text-foreground">Where it fits.</h2>
          <ul className="mt-16 flex flex-col gap-12">
            {useCases.map((useCase, idx) => (
              <UseCaseItem key={idx} item={useCase} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
