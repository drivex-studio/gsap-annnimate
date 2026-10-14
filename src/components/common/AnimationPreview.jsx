'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowClockwise,
  ArrowsOut,
  Desktop,
  DeviceMobile,
  DeviceTablet,
  FrameCorners,
  Laptop,
  X,
} from '@phosphor-icons/react';

import { normalizeDependencies, usePreviewSrcdoc } from '@/components/animations/utils/previewSrcdoc';
import SegmentedControl from '@/animations/shared/SegmentedControl';

const VIEWPORT_OPTIONS = [
  { id: 'full', label: 'Full', w: null, Icon: FrameCorners },
  { id: 'mobile', label: 'Mobile', w: 375, Icon: DeviceMobile },
  { id: 'tablet', label: 'Tablet', w: 768, Icon: DeviceTablet },
  { id: 'laptop', label: 'Laptop', w: 1024, Icon: Laptop },
  { id: 'desktop', label: 'Desktop', w: 1440, Icon: Desktop },
];

const DEFAULT_VIEWPORT_WIDTH = VIEWPORT_OPTIONS.find((opt) => opt.id === 'desktop')?.w ?? null;

function ScaledIframeStage({ srcdoc, src, reloadKey, title, renderWidth, scale, stageHeight }) {
  return (
    <div style={{ width: renderWidth * scale, height: stageHeight, flexShrink: 0 }}>
      <div
        style={{
          width: renderWidth,
          height: stageHeight / scale,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <iframe
          key={reloadKey}
          {...(src ? { src } : { srcDoc: srcdoc })}
          title={title}
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
          style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
        />
      </div>
    </div>
  );
}

export default function AnimationPreview({
  animation,
  codeState,
  previewSrcOverride = null,
  customize = null,
}) {
  const [viewportWidth, setViewportWidth] = useState(DEFAULT_VIEWPORT_WIDTH);
  const [reloadKey, setReloadKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const stageContainerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!stageContainerRef.current) return;
    const stageEl = stageContainerRef.current;
    const updateWidth = () => setContainerWidth(stageEl.clientWidth);
    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(stageEl);
    return () => observer.disconnect();
  }, []);

  const htmlCode = codeState?.html ?? animation.html_code ?? '';
  const cssCode = codeState?.css ?? animation.css_code ?? '';
  const jsCode = codeState?.js ?? animation.js_code ?? animation.gsap_code ?? '';
  const hasInlineCode = !previewSrcOverride && Boolean(htmlCode || cssCode || jsCode);
  const committedAttrs = customize?.committed;

  const defaultIframeUrl = useMemo(() => {
    const baseUrl = `/api/sandbox/iframe/${encodeURIComponent(animation.slug)}`;
    return committedAttrs && Object.keys(committedAttrs).length !== 0
      ? `${baseUrl}?attrs=${encodeURIComponent(JSON.stringify(committedAttrs))}`
      : baseUrl;
  }, [animation.slug, committedAttrs]);

  const iframeSrc = previewSrcOverride || (hasInlineCode ? undefined : defaultIframeUrl);

  const { srcdoc, isLoading: isLoadingSrcdoc } = usePreviewSrcdoc({
    animationName: animation.title,
    animationDescription: animation.description,
    category: animation.category,
    layout: animation.layout,
    htmlCode,
    cssCode,
    jsCode,
    dependencies: normalizeDependencies(animation.dependencies),
    metadata: animation.metadata,
  });

  const showLoadingState = Boolean(hasInlineCode) && isLoadingSrcdoc;
  const liveValues = customize?.values;

  useEffect(() => {
    if (hasInlineCode || !customize || !liveValues || Object.keys(liveValues).length === 0) return;

    const timerId = setTimeout(() => {
      const iframeEl = stageContainerRef.current?.querySelector('iframe');
      iframeEl?.contentWindow?.postMessage(
        {
          type: 'anm:customize',
          selector: customize.selector,
          attrs: liveValues,
          api: customize.api,
        },
        '*'
      );
    }, 200);

    return () => clearTimeout(timerId);
  }, [liveValues, hasInlineCode, reloadKey]);

  const handleReplay = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  const handleCloseFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  useEffect(() => {
    function onKeyDown(evt) {
      if (evt.metaKey || evt.ctrlKey || evt.altKey) return;
      const target = evt.target;
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable ||
        target?.closest?.('.cm-editor')
      ) {
        return;
      }

      if (evt.key === 'f' || evt.key === 'F') {
        evt.preventDefault();
        setIsFullscreen((prev) => !prev);
      } else if (evt.key === 'r' || evt.key === 'R') {
        evt.preventDefault();
        handleReplay();
      } else if (evt.key === 'Escape' && isFullscreen) {
        evt.preventDefault();
        handleCloseFullscreen();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen, handleReplay, handleCloseFullscreen]);

  useEffect(() => {
    function onMessage(evt) {
      if (evt?.data?.type !== 'annnimate-shortcut') return;
      const key = evt.data.key;
      if (key === 'f') {
        setIsFullscreen((prev) => !prev);
      } else if (key === 'r') {
        handleReplay();
      } else if (key === 'Escape') {
        setIsFullscreen(false);
      }
    }

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [handleReplay]);

  const renderWidth = viewportWidth ?? (containerWidth || 0);
  const scale = renderWidth > containerWidth && containerWidth > 0 ? containerWidth / renderWidth : 1;
  const scalePercent = Math.round(100 * scale);
  const stageHeight = Math.max(360, Math.round(0.625 * (containerWidth || 0)));
  const activeViewportId = VIEWPORT_OPTIONS.find((opt) => (viewportWidth ?? null) === opt.w)?.id;

  return (
    <section className="flex flex-col gap-12">
      <div className="bg-foreground/[0.04] p-12">
        <div
          ref={stageContainerRef}
          className="relative flex w-full justify-center overflow-hidden bg-background"
          style={{ height: stageHeight }}
        >
          {showLoadingState || !renderWidth ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-body-sm text-foreground-muted">Loading preview...</p>
            </div>
          ) : (
            <ScaledIframeStage
              srcdoc={hasInlineCode ? srcdoc : undefined}
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
          <SegmentedControl
            value={activeViewportId}
            onChange={(selectedId) => {
              const matched = VIEWPORT_OPTIONS.find((opt) => opt.id === selectedId);
              if (matched) {
                setViewportWidth(matched.w);
              }
            }}
            options={VIEWPORT_OPTIONS.map((opt) => ({
              value: opt.id,
              label: opt.label,
              icon: opt.Icon,
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
            onClick={handleReplay}
            aria-label="Replay"
            className="text-accent-2xs flex h-32 items-center gap-6 bg-foreground px-10 text-background transition-opacity duration-(--duration-quick) ease-(--ease-expo-out) hover:opacity-90"
            title="Replay (R)"
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
            className="text-accent-2xs flex h-32 items-center gap-6 border border-foreground/15 px-10 text-foreground-muted transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:border-foreground/40 hover:text-foreground"
            title="Fullscreen (F)"
          >
            <ArrowsOut size={14} />
            <span className="hidden lg:inline">Fullscreen</span>
            <kbd className="text-[9px] ml-4 hidden border border-foreground/15 px-4 py-1 font-mono text-foreground-muted lg:inline-block">
              F
            </kbd>
          </button>
        </div>
      </div>

      {isFullscreen &&
        isMounted &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${animation.title} fullscreen preview`}
            className="fixed inset-0 z-[400] bg-background"
          >
            <div className="absolute bottom-16 right-16 z-10 flex items-center gap-8">
              <button
                type="button"
                onClick={handleReplay}
                aria-label="Replay"
                title="Replay (R)"
                className="text-accent-2xs flex h-32 items-center gap-6 border border-white/20 bg-[#0a0a0a]/85 px-10 text-white backdrop-blur-md transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:bg-[#0a0a0a]"
              >
                <ArrowClockwise size={14} />
                <span>Replay</span>
                <kbd className="text-[9px] ml-4 border border-white/20 px-4 py-1 font-mono text-white/80">R</kbd>
              </button>

              <button
                type="button"
                onClick={handleCloseFullscreen}
                aria-label="Exit fullscreen"
                title="Close (Esc)"
                className="text-accent-2xs flex h-32 items-center gap-6 border border-white/20 bg-[#0a0a0a]/85 px-10 text-white backdrop-blur-md transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:bg-[#0a0a0a]"
              >
                <X size={14} />
                <span>Close</span>
                <kbd className="text-[9px] ml-4 border border-white/20 px-4 py-1 font-mono text-white/80">Esc</kbd>
              </button>
            </div>

            {!showLoadingState && (
              <iframe
                key={`fs-${reloadKey}`}
                {...(hasInlineCode ? { srcDoc: srcdoc } : { src: iframeSrc })}
                title={`${animation.title} fullscreen preview`}
                sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
                style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
              />
            )}
          </div>,
          document.body
        )}
    </section>
  );
}
