import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";

const PREVIEW_TEMPLATES = new Set([
  "instant",
  "compact",
  "scroll-text",
  "scroll-cover",
  "menu",
  "shader",
  "shader-scroll",
  "full-page"
]);

const DEPENDENCY_MAP = {
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
    } catch (err) {}
  });
})();
</script>
`;

const FULL_FRAME_SCRIPT = `
<script>
(function () {
  'use strict';

  var MODE = 'full';

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
</script>
`;

const FALLBACK_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{{ANIMATION_NAME}}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #0a0a0a;
      color: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      width: 100%;
    }
    .preview-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      width: 100%;
      padding: 2rem;
    }
    .preview-container.is-fullwidth {
      padding: 0;
    }
    {{ANIMATION_CSS}}
  </style>
</head>
<body>
  <div class="preview-container">
    {{ANIMATION_HTML}}
  </div>
  {{ANIMATION_SCRIPTS}}
</body>
</html>`;

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(url, key);
}

function parseDependencies(deps) {
  if (!deps) return [];
  if (Array.isArray(deps)) return deps;
  if (typeof deps === "object") {
    const keys = Object.keys(deps);
    return keys.length > 0 ? keys : [];
  }
  if (typeof deps === "string") {
    try {
      const parsed = JSON.parse(deps);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === "object" && parsed !== null) {
        return Object.keys(parsed);
      }
    } catch {
      return deps.split(",").map(d => d.trim()).filter(Boolean);
    }
  }
  return [];
}

function resolveTemplateName({ metadata, category, animationName, layout }) {
  const tpl = metadata?.previewTemplate || metadata?.sandbox_template;
  if (tpl && PREVIEW_TEMPLATES.has(tpl)) return tpl;

  const nameStr = (animationName || "").toLowerCase();
  let templateName = "instant";

  if (category === "shader") {
    templateName = nameStr.includes("scroll") ? "shader-scroll" : "shader";
  } else if (category === "scroll") {
    templateName = nameStr.includes("text") ? "scroll-text" : "scroll-cover";
  } else if (nameStr.includes("menu") || metadata?.type === "menu") {
    templateName = "menu";
  }

  if (
    !metadata?.previewTemplate &&
    !metadata?.sandbox_template &&
    layout === "full-viewport" &&
    (templateName === "instant" || templateName === "compact")
  ) {
    templateName = "menu";
  }

  return templateName;
}

async function loadTemplateHtml(templateName) {
  try {
    const filePath = path.join(process.cwd(), "public", "animations", "templates", `${templateName}.html`);
    return await fs.readFile(filePath, "utf-8");
  } catch {
    return FALLBACK_TEMPLATE;
  }
}

function buildScriptsBlock({ jsCode, dependencies, category, initialAttrs, defaultSelector, defaultApi }) {
  const requiredDeps = Array.isArray(dependencies) ? dependencies : [];

  const customizeAndInitScript = `
<script>
(function () {
  var initialAttrs = ${JSON.stringify(initialAttrs || {})};
  var defaultSelector = ${JSON.stringify(defaultSelector || null)};
  var defaultApi = ${JSON.stringify(defaultApi || null)};

  function normalizeAttrName(key) {
    return key.indexOf('data-anm-') === 0 ? key : 'data-anm-' + key;
  }

  function applyAttributes(selector, attrs, apiName) {
    if (!attrs || typeof attrs !== 'object') return;
    var targetSelector = selector || defaultSelector;
    var elements = [];

    if (targetSelector) {
      try {
        elements = Array.from(document.querySelectorAll(targetSelector));
      } catch (e) {}
    }

    if (!elements.length) {
      var fallbackEl = document.querySelector('[class*="anm-"], [data-anm-reveal], .preview-container > *');
      if (fallbackEl) elements = [fallbackEl];
    }

    elements.forEach(function (el) {
      Object.keys(attrs).forEach(function (key) {
        var val = attrs[key];
        var attrName = normalizeAttrName(key);
        if (val === null || val === undefined || val === false) {
          el.removeAttribute(attrName);
        } else {
          el.setAttribute(attrName, String(val));
        }
      });
    });

    var resolvedApi = apiName || defaultApi;
    if (window.Anm) {
      var apiObj = resolvedApi && window.Anm[resolvedApi] ? window.Anm[resolvedApi] : null;
      if (!apiObj) {
        var keys = Object.keys(window.Anm);
        if (keys.length > 0) apiObj = window.Anm[keys[0]];
      }
      if (apiObj) {
        if (typeof apiObj.init === 'function') apiObj.init();
        else if (typeof apiObj.demo === 'function') apiObj.demo();
      }
    }

    window.postMessage({ type: 'anm:timeline:resend' }, '*');
  }

  window.__applyInitialAnmAttrs = function () {
    if (initialAttrs && Object.keys(initialAttrs).length > 0) {
      applyAttributes(defaultSelector, initialAttrs, defaultApi);
    }
  };

  window.addEventListener('message', function (e) {
    var d = e && e.data;
    if (!d || d.type !== 'anm:customize') return;
    applyAttributes(d.selector, d.attrs, d.api);
  });
})();
</script>`;

  if (!jsCode || jsCode.trim() === "") {
    return `${customizeAndInitScript}\n<script>window.__applyInitialAnmAttrs && window.__applyInitialAnmAttrs();</script>\n${SHORTCUT_SCRIPT}`;
  }

  return `
${customizeAndInitScript}
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

  var dependencyMap = ${JSON.stringify(DEPENDENCY_MAP)};
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
    if (typeof window.__applyInitialAnmAttrs === 'function') {
      window.__applyInitialAnmAttrs();
    }
    ${jsCode}
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

export async function GET(request, context) {
  try {
    const resolvedParams = await Promise.resolve(context.params);
    const rawSlug = resolvedParams?.slug;

    if (!rawSlug) {
      return new NextResponse("Missing animation slug", { status: 400 });
    }

    const slug = decodeURIComponent(rawSlug);
    const { searchParams } = new URL(request.url);
    const rawAttrs = searchParams.get("attrs");

    let initialAttrs = {};
    if (rawAttrs) {
      try {
        initialAttrs = JSON.parse(rawAttrs);
      } catch {
        initialAttrs = {};
      }
    }

    const supabase = getSupabaseServerClient();
    const { data: animation, error } = await supabase
      .from("animations")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !animation) {
      return new NextResponse(
        `<!DOCTYPE html><html><body style="background:#0a0a0a;color:#888;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;">Animation not found: ${slug}</body></html>`,
        {
          status: 404,
          headers: { "Content-Type": "text/html; charset=utf-8" }
        }
      );
    }

    const htmlCode = animation.html_code ?? animation.code_html ?? "";
    const cssCode = animation.css_code ?? animation.webflow_css_code ?? "";
    const jsCode = animation.js_code ?? animation.gsap_code ?? "";
    const metadata = animation.metadata || {};
    const category = animation.category || "instant";
    const layout = animation.layout || "centered";
    const dependencies = parseDependencies(animation.dependencies);

    const templateName = resolveTemplateName({
      metadata,
      category,
      animationName: animation.title,
      layout
    });

    let templateHtml = await loadTemplateHtml(templateName);

    const isFullWidth =
      typeof metadata?.previewFullWidth === "boolean"
        ? metadata.previewFullWidth
        : category !== "button";

    if (isFullWidth) {
      templateHtml = templateHtml
        .replace('class="preview-container"', 'class="preview-container is-fullwidth"')
        .replace('class="animation-container"', 'class="animation-container is-fullwidth"')
        .replace('class="preview-animation"', 'class="preview-animation is-fullwidth"');
    }

    const scriptsBlock = buildScriptsBlock({
      jsCode,
      dependencies,
      category,
      initialAttrs,
      defaultSelector: metadata?.customizeSelector || null,
      defaultApi: metadata?.customizeApi || null
    });

    const finalHtml = templateHtml
      .replace(/\{\{ANIMATION_NAME\}\}/g, () => animation.title || "Animation Preview")
      .replace(/\{\{ANIMATION_DESCRIPTION\}\}/g, () => animation.description || "")
      .replace(/\{\{ANIMATION_HTML\}\}/g, () => htmlCode || '<div class="demo-text">No preview available</div>')
      .replace(/\{\{ANIMATION_CSS\}\}/g, () => cssCode || "")
      .replace(/\{\{ANIMATION_SCRIPTS\}\}/g, () => scriptsBlock);

    return new NextResponse(finalHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, max-age=0"
      }
    });
  } catch (err) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="background:#0a0a0a;color:#ef4444;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:monospace;">Server Error: ${err.message}</body></html>`,
      {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" }
      }
    );
  }
}
