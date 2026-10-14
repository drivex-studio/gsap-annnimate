import { useEffect, useMemo, useState } from 'react';

const VALID_TEMPLATES = new Set([
  'instant',
  'compact',
  'scroll-text',
  'scroll-cover',
  'menu',
  'shader',
  'shader-scroll',
  'full-page',
]);

const TIMELINE_INSPECTOR_TEMPLATE = `
<script>
(function () {
  'use strict';

  var MODE = '__ANM_TL_MODE__';

  // vars keys that are tween config, not animated properties
  var RESERVED = {
    duration: 1, delay: 1, ease: 1, easeReverse: 1, stagger: 1, repeat: 1,
    repeatDelay: 1, repeatRefresh: 1, yoyo: 1, yoyoEase: 1, paused: 1,
    overwrite: 1, force3D: 1, immediateRender: 1, lazy: 1, id: 1, data: 1,
    callbackScope: 1, onComplete: 1, onStart: 1, onUpdate: 1, onRepeat: 1,
    onReverseComplete: 1, onInterrupt: 1, onCompleteParams: 1,
    onStartParams: 1, onUpdateParams: 1, scrollTrigger: 1, parseTransform: 1,
    runBackwards: 1, startAt: 1, transformOrigin: 1, transformStyle: 1,
    autoRound: 1, clearProps: 1, keyframes: 1,
    // gsap injects these into vars when a tween is created via timeline.to()
    parent: 1, defaults: 1
  };
  var MARKER_WIDTH = 0.012;

  var captured = null;      // time-axis timeline instance (when axis === 'time')
  var demoTl = null;        // handle returned by the component's demo() pass
  var demoApi = null;       // the window.Anm api exposing demo() - loop re-invokes it
  var demoTried = false;
  var idlePosted = false;   // resting-affordance signal sent (once per capture)
  var loopWaitStart = 0;    // completion-stability clock for demo-driven loops
  var scanCount = 0;
  var axis = 'time';
  var lastSig = '';
  var rowsOut = null;
  var rowTargets = [];
  var parentWin = window.parent;
  var lastPosted = -1;
  var styleInjected = false;
  var loopOn = false;

  function isElement(t) {
    return t && t.nodeType === 1;
  }

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

  // Build one row from a tween/timeline child. offset+scale remap the
  // child's local position into the emitted axis (identity for time axis;
  // the trigger's scroll window for a scrubbed timeline). Returns null when
  // the child is omitted per the ADR rules.
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
        if (!els.length) return null; // unlabelled proxy target -> omit
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
    // order matters: demoTl + captured lead, live candidates follow, and
    // displacement is >= - so the NEWEST equal-size live instance wins
    // (rebuilt-per-open timelines keep the playhead on the live copy)
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
      if (!anim) continue; // callback-built timelines: not captured in v1
      // unrefreshed triggers sit at start === end === -1; a NEGATIVE start on
      // its own is legitimate (a 'top bottom' trigger near the page top) and
      // clamps to 0 below
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
          // all children omitted (proxy-driven scrub): an authored label on
          // the timeline itself earns one whole-span row
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
        // discrete trigger: the animation fires at start and runs on its own
        // clock -> a marker at the fire point (ADR-0011)
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
    // sort by axis position so the strip reads top-down in scroll order
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

  // NEVER auto-invoked outside a deliberate attract context (Julian,
  // 2026-07-30/31): a component must not animate itself with no user input.
  // Components whose interactions can't produce a capturable timeline
  // instead PRE-BUILD their demo() timeline PAUSED at init - the ordinary
  // scan captures it (rows on load, playhead parked) and only the member
  // transport or a real interaction ever plays anything.
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
      // a null return means "engaged right now, try me later" (the demo()
      // contract) - only a real handle burns the one-shot
      if (handle) demoTried = true;
    } catch (e) {
      demoTried = true; // a throwing demo must not be retried every scan
    }
  }

  // Resting affordance (2026-07-31): when scanning finds nothing but the
  // component IS inspectable (a demo() exists, so a capture will land on the
  // visitor's first interaction), tell the parent so TimelineStrip can render
  // its resting state instead of nothing. Never fires for self-driving or
  // scroll components (their capture arrives without interaction).
  function tryIdle() {
    if (idlePosted || rowsOut) return;
    if (window.__anmAutoDemo === true) return; // attract context runs demo instead
    if (!findDemoApi()) return;
    idlePosted = true;
    try {
      parentWin.postMessage({ type: 'anm:timeline:idle' }, '*');
    } catch (e) { /* cross-origin parent: nothing to do */ }
  }

  function scan() {
    scanCount++;

    var time = pickTimeMaster();
    var scroll = buildScrollRows();
    var timeCount = time ? time.built.rows.length : 0;
    var scrollCount = scroll && scroll.rows.length >= 2 ? scroll.rows.length : 0;
    if (timeCount < 2 && scrollCount < 2) {
      // nothing found on a complete scan: the component is interaction-
      // driven. After a short settle (so late-booting self-driving captures
      // still get first claim): an attract context runs demo(); everywhere
      // else the parent gets the idle signal for its resting affordance and
      // the capture waits for the visitor's first interaction.
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

    // re-point on every scan (fresh instances of the same shape keep the
    // playhead alive); re-emit only on a real structure change
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
        // full mode only: the cycle length in seconds so the member axis can
        // render real tick numbers (shape mode stays numberless)
        cycle: MODE === 'full' && tl ? Math.round(tl.duration() * 100) / 100 : null
      }, '*');
    } catch (e) { /* cross-origin parent: nothing to do */ }
  }

  // Fast scan while the component boots + builds (font gates, waitForGSAP,
  // ScrollTrigger refresh) AND, for interaction-driven components, until the
  // visitor's first interaction actually produces a timeline. The fast cadence
  // has to stay until then: gsap removes a completed animation from the global
  // timeline, so a 0.8s morph born and finished between two 1500ms scans would
  // be missed entirely and the strip would stay empty. Once rows exist the slow
  // cadence is enough to re-capture per-cycle and resize rebuilds. The cap
  // stops a component that never animates from polling at 200ms forever.
  var fastScans = 0;
  var fastTimer = setInterval(function () {
    scan();
    fastScans++;
    if (rowsOut || fastScans >= 300) {
      clearInterval(fastTimer);
      setInterval(scan, 1500);
    }
  }, 200);

  // A faithful replay rewinds <video> footage with the choreography.
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
        } catch (e) { /* removed node / no media: skip */ }
      }
    }
  }

  // Loop semantics differ by driver (ADR-0011 edge-case pass, 2026-07-28):
  // - self-driving choreographies restart their captured timeline in place
  //   (suppressEvents false so proxy onUpdate writes rewind the DOM);
  // - demo-driven components RE-INVOKE demo() for each cycle instead - a
  //   restart of the open timeline would collide with the demo's own
  //   scheduled close (the loop would end up looping the close graph), and
  //   a fresh pass rebuilds state/clones that destructive onCompletes
  //   removed. demo() re-fires only after a completion has held for 600ms
  //   (so a scheduled close still runs first; premature calls are no-ops -
  //   demo() implementations return null while engaged).
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
    } catch (e) { /* a broken demo must never break the loop */ }
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
        } catch (e) { /* ignore */ }
      }
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // Highlight = a fixed-position OVERLAY of rects, never an outline on the
  // targets themselves - targets often sit inside overflow-clipped mask
  // wrappers (SplitText masks) that chop an outline to bare vertical lines.
  // The overlay lives at the top layer, drawn from getBoundingClientRect,
  // re-positioned via rAF while active so transformed/scrolling targets track.
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

    // Scrub (2026-07-28, reverses the v1 read-only non-goal): the parent's
    // ruler drag drives the playhead. Time axis pauses the captured timeline
    // and sets progress directly (works on detached/completed instances -
    // explicit progress() renders regardless of parent ticking). Scroll axis
    // drives the real scroll position, so scrubbed triggers respond.
    if (d.type === 'anm:timeline:scrub') {
      var sp = Math.max(0, Math.min(Number(d.progress) || 0, 1));
      if (axis === 'scroll') {
        if (typeof ScrollTrigger !== 'undefined') {
          var smax = ScrollTrigger.maxScroll(window);
          // explicit 'instant' overrides the template's scroll-behavior:
          // smooth - a smooth scroll here makes the playhead snap back to
          // the in-flight position and ease to the target (the scrub must
          // track the pointer 1:1; the component's own scrub smoothing
          // still eases the VISUALS, which is the correct feel)
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

    // A freshly-(re)mounted parent (hot reload, client nav) asks for the
    // current rows - the sig gate would otherwise never re-post them. The
    // idle flag resets too so a still-idle capture re-signals its resting
    // state to the new parent.
    if (d.type === 'anm:timeline:resend') {
      lastSig = '';
      idlePosted = false;
      scan();
      return;
    }

    // Loop toggle: while on, the tick loop restarts the captured timeline
    // whenever it completes. Enabling on a completed timeline starts it.
    // suppressEvents must be FALSE on every rewind (restart/progress):
    // proxy tweens write the DOM inside onUpdate (clipGeo -> CSS vars), so
    // a suppressed rewind leaves their visuals frozen at the end state
    // (capsule-hero's capsule stayed open on loop, 2026-07-28).
    if (d.type === 'anm:timeline:loop') {
      loopOn = !!d.on;
      loopWaitStart = 0;
      if (loopOn && axis !== 'scroll' && !captured) {
        // Cached-graph case, same as playpause: enabling the loop is the
        // input - kick off the first demo pass; loopTick cycles from there.
        var lapi = findDemoApi();
        if (lapi) {
          demoApi = lapi;
          try {
            var lh2 = lapi.demo();
            if (lh2 && typeof lh2.progress === 'function') demoTl = lh2;
          } catch (e) { /* no-op */ }
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
          } catch (e) { /* no-op */ }
        } else {
          resetVideos();
          captured.restart(true, false);
        }
      }
      return;
    }

    // Play/pause toggle (button + spacebar in the parent). Time axis only -
    // on the scroll axis the scroll position drives playback.
    if (d.type === 'anm:timeline:playpause') {
      if (axis === 'scroll') return;
      if (!captured) {
        // The parent renders a CACHED graph (return visit to an interaction-
        // driven component) but nothing is captured yet, so there is nothing
        // to toggle. The visitor pressed PLAY - that IS user input: run the
        // demo() pass so the transport drives something real. (Pre-built
        // paused demo timelines never land here - they capture on load.)
        var papi = findDemoApi();
        if (!papi) return;
        demoApi = papi;
        try {
          var ph = papi.demo();
          if (ph && typeof ph.progress === 'function') demoTl = ph;
        } catch (e) { /* a broken demo must never break the preview */ }
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

TIMELINE_INSPECTOR_TEMPLATE.replace('__ANM_TL_MODE__', 'shape');

const FULL_TIMELINE_SCRIPT = TIMELINE_INSPECTOR_TEMPLATE.replace('__ANM_TL_MODE__', 'full');

const FORWARD_KEYS_SCRIPT = `
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

export async function inlinePreviewAssets(htmlCode) {
  if (!htmlCode) return htmlCode;

  const matches = [...htmlCode.matchAll(/(?:src|data-anm-image(?:-\d+)?)="(\/preview-assets\/[^"]+)"/g)];
  let resultHtml = htmlCode;

  for (const match of matches) {
    const assetUrl = match[1];
    const fullAttr = match[0];
    const attrName = fullAttr.split('=')[0];

    try {
      const response = await fetch(assetUrl);
      if (!response.ok) continue;

      const blob = await response.blob();
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });

      resultHtml = resultHtml.replace(fullAttr, `${attrName}="${dataUrl}"`);
    } catch (err) {
      console.warn(`Failed to convert image ${assetUrl} to base64:`, err);
    }
  }

  return resultHtml;
}

function resolveTemplateName({ metadata, category, animationName = '', compact = false } = {}) {
  const explicitTemplate = metadata?.previewTemplate || metadata?.sandbox_template;
  if (explicitTemplate && VALID_TEMPLATES.has(explicitTemplate)) return explicitTemplate;

  const lowerName = (animationName || '').toLowerCase();
  if (category === 'shader') {
    return lowerName.includes('scroll') ? 'shader-scroll' : 'shader';
  }
  if (category === 'scroll') {
    return lowerName.includes('text') ? 'scroll-text' : 'scroll-cover';
  }
  if (lowerName.includes('menu') || metadata?.type === 'menu') {
    return 'menu';
  }
  return compact ? 'compact' : 'instant';
}

function isPreviewFullWidth({ metadata, category } = {}) {
  if (typeof metadata?.previewFullWidth === 'boolean') return metadata.previewFullWidth;
  return category !== 'button';
}

const CDN_DEPENDENCY_MAP = {
  gsap: 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js',
  ScrollTrigger: 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollTrigger.min.js',
  three: 'https://cdn.jsdelivr.net/npm/three@0.169.0/+esm',
  ScrollSmoother: 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollSmoother.min.js',
  SplitText: 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/SplitText.min.js',
  Flip: 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/Flip.min.js',
  Draggable: 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/Draggable.min.js',
  InertiaPlugin: 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/InertiaPlugin.min.js',
  Observer: 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/Observer.min.js',
  MotionPathPlugin: 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/MotionPathPlugin.min.js',
  ScrollToPlugin: 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrollToPlugin.min.js',
  DrawSVGPlugin: 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/DrawSVGPlugin.min.js',
  MorphSVGPlugin: 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/MorphSVGPlugin.min.js',
  ScrambleTextPlugin: 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/ScrambleTextPlugin.min.js',
  CustomEase: 'https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/CustomEase.min.js',
};

function buildRunnerScripts({ jsCode, dependencies, category, forwardKeysScript }) {
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

  var dependencyMap = ${JSON.stringify(CDN_DEPENDENCY_MAP)};
  var requiredDeps = ${JSON.stringify(Array.isArray(dependencies) ? dependencies : [])};
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
${
  category === 'scroll'
    ? `  window.addEventListener('load', function () {
    var section = document.getElementById('animation-section');
    if (!section) return;
    setTimeout(function () { section.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 600);
  });`
    : ''
}
})();
</script>
${forwardKeysScript}${FULL_TIMELINE_SCRIPT}
`;
}

function assemblePreviewHtml({
  templateHtml,
  processedHtmlCode,
  cssCode,
  jsCode,
  dependencies,
  animationName,
  animationDescription,
  category,
  metadata,
}) {
  const fullWidth = isPreviewFullWidth({ metadata, category });
  let html = templateHtml;

  if (fullWidth) {
    html = html
      .replace('class="preview-container"', 'class="preview-container is-fullwidth"')
      .replace('class="animation-container"', 'class="animation-container is-fullwidth"')
      .replace('class="preview-animation"', 'class="preview-animation is-fullwidth"');
  }

  const scriptsBlock =
    jsCode && jsCode.trim() !== ''
      ? buildRunnerScripts({
          jsCode,
          dependencies,
          category,
          forwardKeysScript: FORWARD_KEYS_SCRIPT,
        })
      : `<script>console.log('[preview] CSS-only animation loaded');</script>${FORWARD_KEYS_SCRIPT}`;

  return html
    .replace(/\{\{ANIMATION_NAME\}\}/g, () => animationName)
    .replace(/\{\{ANIMATION_DESCRIPTION\}\}/g, () => animationDescription)
    .replace(/\{\{ANIMATION_HTML\}\}/g, () => processedHtmlCode || '<div class="demo-text">No preview available</div>')
    .replace(/\{\{ANIMATION_CSS\}\}/g, () => cssCode || '')
    .replace(/\{\{ANIMATION_SCRIPTS\}\}/g, () => scriptsBlock);
}

export function normalizeDependencies(deps) {
  if (!deps) return [];
  if (Array.isArray(deps)) return deps;
  if (typeof deps === 'object' && deps !== null) {
    const keys = Object.keys(deps);
    return keys.length > 0 ? keys : [];
  }
  if (typeof deps === 'string') {
    try {
      const parsed = JSON.parse(deps);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'object' && parsed !== null) {
        const keys = Object.keys(parsed);
        return keys.length > 0 ? keys : [];
      }
    } catch {
      return deps
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}

export function usePreviewSrcdoc({
  animationName = 'Animation Preview',
  animationDescription = '',
  category = 'instant',
  layout,
  htmlCode = '',
  cssCode = '',
  jsCode = '',
  dependencies = [],
  compact = false,
  metadata = null,
}) {
  const [templateHtml, setTemplateHtml] = useState('');
  const [processedHtmlCode, setProcessedHtmlCode] = useState('');
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(true);
  const [isProcessingAssets, setIsProcessingAssets] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function loadTemplate() {
      try {
        let templateName = resolveTemplateName({
          metadata,
          category,
          animationName,
          compact,
        });

        if (
          !metadata?.previewTemplate &&
          !metadata?.sandbox_template &&
          layout === 'full-viewport' &&
          (templateName === 'instant' || templateName === 'compact')
        ) {
          templateName = 'menu';
        }

        const response = await fetch(`/animations/templates/${templateName}.html`);
        const text = await response.text();
        if (!isCancelled) {
          setTemplateHtml(text);
        }
      } catch (err) {
        console.error('Failed to load template:', err);
        if (!isCancelled) {
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
        if (!isCancelled) {
          setIsLoadingTemplate(false);
        }
      }
    }

    loadTemplate();

    return () => {
      isCancelled = true;
    };
  }, [category, animationName, compact, layout, metadata?.previewTemplate, metadata?.sandbox_template, metadata?.type]);

  useEffect(() => {
    let isCancelled = false;

    async function processHtml() {
      setIsProcessingAssets(true);
      const inlined = await inlinePreviewAssets(htmlCode);
      if (!isCancelled) {
        setProcessedHtmlCode(inlined);
        setIsProcessingAssets(false);
      }
    }

    if (htmlCode) {
      processHtml();
    } else {
      setProcessedHtmlCode('');
      setIsProcessingAssets(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [htmlCode]);

  const srcdoc = useMemo(
    () =>
      templateHtml
        ? assemblePreviewHtml({
            templateHtml,
            processedHtmlCode,
            cssCode,
            jsCode,
            dependencies,
            animationName,
            animationDescription,
            category,
            metadata,
          })
        : '',
    [templateHtml, processedHtmlCode, cssCode, jsCode, animationName, animationDescription, dependencies, category, metadata]
  );

  return {
    srcdoc,
    isLoading: isLoadingTemplate || isProcessingAssets,
  };
}
