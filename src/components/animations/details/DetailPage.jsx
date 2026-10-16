"use client";
import React, { useRef, useEffect, useState, useMemo, useCallback, Fragment } from 'react';

import { analytics } from '@/libs/utils/analytics';
import { useUser } from '@/providers/UserProvider';
import CodeViewer from '@/components/animations/details/CodeViewer';
import ServerData, { effectiveCyclePrice } from '@/libs/auth/data/ServerData';
import StarterPack from '@/components/paywall/PaywallBlock';
import FreeChip from '@/components/ui/FreeChip';
import StarterPackThumbs from '@/components/paywall/StarterPackThumbs';
import Link from '@/components/navigation/Link';
import SaveButton from '@/components/ui/SaveButton';
import FormatSelect from '@/components/animations/details/FormatSelect';
import ProvenanceChip from '@/components/ui/ProvenanceChip';
import TimelineStrip from '@/components/animations/details/TimelineStrip';
import { getProvenance, getProvenanceSite, getProvenanceBody } from '@/libs/utils/provenance';
import { formatInline, ContentBlock } from '@/components/animations/details/ContentBlock';
import { Tag } from '@/components/animations/details/TimelineStrip';

import AnimationPreview from '@/components/common/AnimationPreview'; 
import AnimationAttributes from '@/components/common/AnimationAttributes';
import AnimationDocs from '@/components/common/AnimationDocs'; 
import AnimationGrid from '@/animations/components/AnimationCard';
import { useOnboarding } from '@/providers/OnboardingProvider';
import { STACK_OPTIONS, ONBOARDING_EVENTS } from '@/libs/config/onboarding';
import MobileCapture from '@/components/animations/details/MobileCapture';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import CaptureForm from '@/components/ui/NewsletterEyebrow';
import { useCategories } from '@/providers/CategoryProvider';
import { cn } from '@/libs/utils/className';
import Customizer from '@/components/common/AnimationControls';
import { Copy, Check, Brain, CaretDown, CaretUp, X, ArrowSquareOut, Lock } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { sendUserEvent } from '@/libs/utils/events';
import PlatformSelect, { PLATFORM_LABEL } from '@/components/animations/details/PlatformSelect';
import CodeSnippet from '@/components/animations/details/CodeSnippet';
import { stripComments, stripLangFor } from '@/components/animations/utils/CodeUtilities';
import FAQ from '@/components/animations/FAQ';
import { 
  countUsableConfigurables, 
  CUSTOMIZE_MIN_CONFIGURABLES, 
  getPrimaryAttribute, 
  getConfigurables, 
  getAnmApiName, 
  applyValuesToHtml, 
  applyValuesToReact, 
  applyValuesToVue 
} from '@/libs/utils/CONFIGURABLES';
import AnimatedButton from '@/animations/components/AnimatedButton';

function Tracker({ animation }) {
  const viewedRef = useRef(false);

  useEffect(() => {
    if (!animation?.id || viewedRef.current) return;
    viewedRef.current = true;

    analytics.animation.viewed(
      animation.id,
      animation.title || animation.name,
      animation.category?.name || animation.category || 'unknown',
      animation.animation_tags?.map(t => t.tag?.name).filter(Boolean) || []
    );

    const storageKey = `anm_viewed_${animation.id}`;
    try {
      const lastViewed = Number(localStorage.getItem(storageKey) || 0);
      if (Date.now() - lastViewed < 86400000) return;
      localStorage.setItem(storageKey, String(Date.now()));
    } catch {}

    fetch('/api/animations/view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        animationId: animation.id
      })
    }).catch(e => {
      console.warn('Failed to track view:', e);
    });
  }, [animation]);

  return null;
}

function AccessWrapper({
  hasAccess,
  loading = false,
  isAuthenticated = false,
  animation,
  starterPack = null,
  children
}) {
  if (!loading && hasAccess) {
    return <Fragment>{children}</Fragment>;
  }

  return (
    <div className="relative min-h-[420px] overflow-hidden bg-background lg:min-h-0 lg:h-full">
      <div className="pointer-events-none absolute inset-0 select-none opacity-50 blur-md" aria-hidden="true">
        <Skeleton />
      </div>
      {!loading && (
        <div className="relative flex flex-col items-center justify-start gap-24 bg-background/70 px-24 py-40 backdrop-blur-md lg:absolute lg:inset-0 lg:py-0 lg:pt-16">
          <StarterPack animation={animation} isAuthenticated={isAuthenticated} starterPack={starterPack} />
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  const indents = {
    0: 'ml-0',
    1: 'ml-16',
    2: 'ml-32'
  };

  const lines = [
    { w: 'w-3/4', indent: 0 },
    { w: 'w-full', indent: 0 },
    { w: 'w-1/2', indent: 1 },
    { w: 'w-2/3', indent: 1 },
    { w: 'w-5/12', indent: 2 },
    { w: 'w-full', indent: 0 },
    { w: 'w-3/5', indent: 1 },
    { w: 'w-4/5', indent: 0 },
    { w: 'w-1/3', indent: 1 },
    { w: 'w-full', indent: 0 },
    { w: 'w-5/6', indent: 0 },
    { w: 'w-1/2', indent: 1 },
    { w: 'w-2/5', indent: 2 },
    { w: 'w-full', indent: 0 },
    { w: 'w-3/4', indent: 1 }
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-foreground/10 p-12">
        <div className="flex gap-8 bg-foreground/[0.06] p-2">
          <div className="h-20 w-48 bg-foreground/15" />
          <div className="h-20 w-48 bg-foreground/[0.08]" />
          <div className="h-20 w-48 bg-foreground/[0.08]" />
          <div className="h-20 w-48 bg-foreground/[0.08]" />
        </div>
      </div>
      <div className="flex items-center justify-between border-b border-foreground/10 px-12 py-10">
        <div className="h-12 w-96 bg-foreground/15" />
        <div className="h-16 w-80 bg-foreground/[0.08]" />
      </div>
      <div className="min-h-0 flex-1 space-y-8 overflow-hidden p-16">
        {lines.map((line, i) => (
          <div key={i} className={`h-10 bg-foreground/15 ${line.w} ${indents[line.indent]}`} />
        ))}
      </div>
    </div>
  );
}

function DetailHeader({
  animation,
  isSaved,
  availableFormats = null,
  totalCount = null
}) {
  const { isAuthenticated } = useUser();
  
  let formats = availableFormats;
  if (!formats) {
    formats = [];
    if (animation?.html_code || animation?.css_code || animation?.js_code || animation?.gsap_code) {
      formats.push('html');
    }
    if (animation?.react_code) {
      formats.push('react');
    }
    if (animation?.vue_code) {
      formats.push('vue');
    }
    if (animation?.webflow_code) {
      formats.push('webflow');
    }
  }

  return (
    <header className="flex flex-col gap-8">
      <div className="flex flex-col gap-16">
        <h1 className="text-h1 max-w-[20ch] text-foreground">
          {animation.title}
        </h1>
        <div className="flex flex-col gap-16 lg:flex-row lg:items-end lg:justify-between lg:gap-32">
          {animation.description && (
            <p className="text-body-sm max-w-[72ch] text-foreground-muted lg:text-body">
              {animation.description}
            </p>
          )}
          <div className="flex shrink-0 flex-col gap-16 lg:items-end">
            <div className="flex items-end gap-12">
              <FormatSelect animation={animation} availableFormats={formats} compact={true} />
              <SaveButton animation={animation} initialIsSaved={isSaved} isAuthenticated={isAuthenticated} variant="inline" />
            </div>
          </div>
        </div>
        {(totalCount || animation.is_free || animation.inspiration_source) && (
          <div className="flex flex-wrap items-baseline justify-between gap-x-32 gap-y-12">
            {totalCount ? (
              <p className="text-body-sm text-foreground-muted">
                One of{' '}
                <Link
                  href="/animations"
                  onClick={() =>
                    analytics.track(
                      'detail_browse_used',
                      { action: 'orientation_link', from_slug: animation.slug },
                      { transport: 'sendBeacon' }
                    )
                  }
                  className="text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors duration-(--duration-quick) hover:decoration-brand"
                >
                  {totalCount} GSAP components
                </Link>{' '}
                in React, Vue and HTML.
              </p>
            ) : null}
            {(animation.is_free || animation.inspiration_source) && (
              <div className="ml-auto flex items-center gap-16">
                {animation.is_free && (
                  <span className="text-accent-2xs bg-brand px-8 py-4 font-medium text-[#141314]">
                    Free
                  </span>
                )}
                {animation.inspiration_source && (
                  <a
                    href={animation.inspiration_source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-6 text-body-sm text-foreground-muted transition-colors duration-(--duration-quick) hover:text-foreground"
                  >
                    <span>
                      Inspired by{' '}
                      {animation.metadata?.inspiration_label ||
                        new URL(animation.inspiration_source).hostname.replace(/^www\./, '').split('.')[0]}
                    </span>
                    <ArrowSquareOut size={14} />
                  </a>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

function ProvenanceSection({ animation }) {
  const provenance = getProvenance(animation);
  const site = getProvenanceSite(animation);

  if (!provenance?.body && !site) return null;

  const bodyText = getProvenanceBody(animation);

  return (
    <section className="pt-16">
      <ProvenanceChip animation={animation} size="default" />
      <h2 className="text-h4 mt-12 text-foreground">Where this component came from.</h2>
      <p className="text-body mt-16 leading-relaxed text-foreground-reading">{bodyText}</p>
    </section>
  );
}

function CraftSection({ animation }) {
  const blocks = animation?.metadata?.teaching?.blocks;
  const contentBlocks = Array.isArray(blocks) ? blocks : [];

  if (contentBlocks.length === 0) return null;

  return (
    <section className="pt-16">
      <span className="text-accent-xs text-foreground-muted">The craft</span>
      <h2 className="text-h4 mt-12 text-foreground">How it's built.</h2>
      <div className="mt-16 flex flex-col gap-16">
        {contentBlocks.map((block, index) =>
          block?.type === 'prose' ? (
            <p
              key={index}
              className="text-body leading-relaxed text-foreground-reading"
              dangerouslySetInnerHTML={{ __html: formatInline(block.text || '') }}
            />
          ) : (
            <ContentBlock key={index} block={block} />
          )
        )}
      </div>
    </section>
  );
}

const DEP_LABELS = {
  gsap: 'GSAP'
};

function RequirementsSection({ animation, concepts = [] }) {
  const deps = Array.isArray(animation?.dependencies) ? animation.dependencies : [];
  const conceptList = Array.isArray(concepts) ? concepts : [];

  if (deps.length === 0 && conceptList.length === 0) return null;

  return (
    <section className="border-t border-foreground/10 pt-32">
      <span className="text-accent-xs text-foreground-muted">Required</span>
      <h2 className="text-h4 mt-12 text-foreground">What you'll need.</h2>
      <div className="mt-16 grid grid-cols-3 gap-x-12 gap-y-16">
        {deps.length > 0 && (
          <div>
            <p className="text-mono-sm mb-8 text-foreground-muted">Install</p>
            <ul className="flex flex-wrap items-center gap-8 m-0 p-0 list-none">
              {deps.map(dep => (
                <li
                  key={dep}
                  className="text-accent-xs bg-foreground/[0.06] px-8 py-4 normal-case text-foreground"
                >
                  {DEP_LABELS[dep] ?? dep}
                </li>
              ))}
            </ul>
          </div>
        )}
        {conceptList.length > 0 && (
          <div>
            <p className="text-mono-sm mb-8 text-foreground-muted">Concepts</p>
            <ul className="flex flex-wrap items-center gap-8 m-0 p-0 list-none">
              {conceptList.map(concept => (
                <li key={`${concept.category}/${concept.slug}`}>
                  <Tag category={concept.category} slug={concept.slug}>
                    {concept.title}
                  </Tag>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function RelatedSection({
  animation,
  relatedAnimations = [],
  isAuthenticated = false,
  savedAnimationIds = []
}) {
  if (!relatedAnimations || relatedAnimations.length === 0) return null;

  const site = getProvenanceSite(animation);
  const siteMatches = site ? relatedAnimations.filter(a => getProvenanceSite(a) === site).length : 0;
  const isFromSameBuild = site && siteMatches >= 2;
  const heading = isFromSameBuild ? `More from the ${site} build.` : 'Related components.';

  return (
    <section data-theme="dark" className="v2-container border-t border-foreground/10 py-32 lg:py-64">
      <div className="grid grid-cols-12 gap-x-24 gap-y-32 lg:gap-y-0">
        <div className="col-span-12 mb-32 flex flex-wrap items-baseline justify-between gap-12 lg:mb-48">
          <div>
            <span className="text-accent-xs text-foreground-muted">
              {isFromSameBuild ? 'Build' : 'Related'}
            </span>
            <h2 className="text-h4 mt-12 text-foreground">{heading}</h2>
          </div>
        </div>
        {relatedAnimations.slice(0, 3).map(related => (
          <div key={related.id} className="col-span-12 md:col-span-6 lg:col-span-4">
            <AnimationGrid
              animation={related}
              viewMode="grid"
              isAuthenticated={isAuthenticated}
              initialIsSaved={savedAnimationIds.includes(related.id)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function OnboardingMessage({ slug, platform }) {
  const { active, steps, starterSlug } = useOnboarding();
  const [dismissed, setDismissed] = useState(false);

  if (!active || dismissed || slug !== starterSlug || steps.copy) return null;

  const platformLabel = STACK_OPTIONS.find(opt => opt.value === platform)?.label || null;

  return (
    <div className="v2-container pt-24">
      <div className="flex items-center gap-12 border border-foreground/10 bg-foreground/[0.04] px-16 py-12">
        <span className="size-8 shrink-0 bg-brand" />
        <p className="text-body-sm flex-1 text-foreground">
          Your first component.{' '}
          <span className="text-foreground-muted">
            Copy it{platformLabel ? ` in ${platformLabel}` : ''}, then drop it into your project - the panel tells you exactly where it goes.
          </span>
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="flex size-24 shrink-0 items-center justify-center text-foreground-muted transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:text-foreground"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

function MobilePrompt({
  animation,
  isAuthenticated = false,
  hasAccess = false,
  starterPack = null
}) {
  const isLargeScreen = useBreakpoint('lg');
  const trackedRef = useRef(false);
  const [copied, setCopied] = useState(false);

  const audience = hasAccess ? 'member' : isAuthenticated ? 'authed_no_access' : 'anon';

  useEffect(() => {
    if (!isLargeScreen && !trackedRef.current) {
      trackedRef.current = true;
      analytics.track('mobile_capture_shown', {
        animation_slug: animation.slug,
        animation_name: animation.title || animation.name,
        audience
      });
    }
  }, [isLargeScreen, animation, audience]);

  if (isLargeScreen) return null;

  return (
    <div className="border border-foreground/10 bg-background p-24">
      <p className="text-accent-xs text-foreground-muted">On mobile</p>
      {hasAccess ? (
        <div className="mt-12 flex flex-col gap-16">
          <p className="text-body font-medium text-foreground">
            Copying is a desktop job. Send this to your desktop.
          </p>
          <AnimatedButton
            theme="surface"
            size="sm"
            onClick={() => {
              try {
                const url = window.location.href;
                navigator.clipboard?.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
                analytics.track('mobile_capture_link_copied', {
                  animation_slug: animation.slug,
                  audience
                });
              } catch (e) {}
            }}
          >
            {copied ? 'Link copied' : 'Copy link'}
          </AnimatedButton>
        </div>
      ) : (
        <div className="mt-12 flex flex-col gap-16">
          {animation?.is_free_preview ? (
            <Fragment>
              <div>
                <FreeChip />
              </div>
              <p className="text-body font-medium text-foreground">
                {animation.title || animation.name} is in the free Starter Pack.
              </p>
              <p className="text-body-sm text-foreground-muted">
                This exact component in React, Vue and HTML, in your inbox, ready when you're back at your desk. No card, no trial.
              </p>
            </Fragment>
          ) : (
            <Fragment>
              <p className="text-body font-medium text-foreground">
                Take the free components with you.
              </p>
              <StarterPackThumbs items={starterPack} />
              <p className="text-body-sm text-foreground-muted">
                In React, Vue and HTML, in your inbox, ready when you're back at your desk.
              </p>
            </Fragment>
          )}
          <CaptureForm
            source="mobile-detail"
            idPrefix="mobile-detail"
            buttonLabel="Send it to me"
            buttonSize="xs"
            wantedComponent={animation?.slug}
          />
        </div>
      )}
    </div>
  );
}

function CategorySection({ currentCategory, slug }) {
  const categories = useCategories();

  if (!categories || categories.length === 0) return null;

  return (
    <section data-theme="dark" className="v2-container border-t border-foreground/10 py-32">
      <div className="flex flex-wrap items-center gap-x-24 gap-y-16">
        <span className="text-accent-xs text-foreground-muted">Browse by category</span>
        <ul className="flex flex-wrap gap-8">
          {categories.map(cat => {
            const isActive = cat.slug === currentCategory;
            return (
              <li key={cat.slug}>
                <Link
                  href={`/animations?category=${cat.slug}`}
                  onClick={() => {
                    analytics.track(
                      'detail_browse_used',
                      { action: 'category', from_slug: slug, category: cat.slug },
                      { transport: 'sendBeacon' }
                    );
                  }}
                  className={cn(
                    'text-accent-xs flex items-center gap-8 bg-foreground/[0.06] px-12 py-8 text-foreground transition-colors duration-(--duration-fast) ease-(--ease-expo-out) hover:bg-foreground/10'
                  )}
                >
                  {isActive && <span aria-hidden="true" className="size-8 bg-brand" />}
                  <span>{cat.name}</span>
                  <span className="text-foreground-muted">{cat.count}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function resolvePlatform(codeState, preferred) {
  const available = {
    react: !!codeState?.react,
    vue: !!codeState?.vue,
    html: !!(codeState?.html || codeState?.css || codeState?.js)
  };

  if (preferred && available[preferred]) return preferred;
  if (available.react) return 'react';
  if (available.vue) return 'vue';
  return 'html';
}

function getCodeForPlatform(codeState, platform) {
  if (platform === 'react') {
    return { code: codeState?.react || '', lang: 'jsx' };
  }
  if (platform === 'vue') {
    return { code: codeState?.vue || '', lang: 'vue' };
  }

  const htmlParts = [];
  if (codeState?.html) {
    htmlParts.push(`<!-- HTML -->\n${codeState.html.trim()}`);
  }
  if (codeState?.css) {
    htmlParts.push(`<style>\n${codeState.css.trim()}\n</style>`);
  }
  if (codeState?.js) {
    htmlParts.push(`<script>\n${codeState.js.trim()}\n</script>`);
  }

  return { code: htmlParts.join('\n\n'), lang: 'html' };
}

function generateAiPrompt({ animation, code, platform, lang }) {
  const name = animation.title || animation.name || 'this component';
  const sourceUrl = `https://annnimate.com/animations/${animation.slug}`;
  const blocks = animation.metadata?.teaching?.blocks;
  const contextText = blocks?.map(b => b.text).filter(Boolean).join('\n\n');

  const lines = [
    `# ${name}`,
    animation.description || ''
  ];

  if (contextText) {
    lines.push(`## How it works\n\n${contextText}`);
  }

  lines.push(
    `## Code (${platform})`,
    '```' + lang + '\n' + code.trim() + '\n```',
    `Source: ${sourceUrl} - a production GSAP component from Annnimate. Keep the data-anm-* attributes; they configure the animation.`
  );

  return lines.filter(Boolean).join('\n\n');
}

function SidebarActions({
  animation,
  codeState,
  hasAccess,
  userLoading = false,
  preferredPlatform = null
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAi, setCopiedAi] = useState(false);

  const availablePlatforms = useMemo(() => {
    const list = [];
    if (codeState?.react) list.push('react');
    if (codeState?.vue) list.push('vue');
    if (codeState?.html || codeState?.css || codeState?.js) list.push('html');
    return list;
  }, [codeState]);

  const [platform, setPlatform] = useState(() => resolvePlatform(codeState, preferredPlatform));

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('anm-docs-framework');
      if (saved && availablePlatforms.includes(saved)) {
        setPlatform(saved);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (availablePlatforms.length && !availablePlatforms.includes(platform)) {
      setPlatform(availablePlatforms[0]);
    }
  }, [availablePlatforms, platform]);

  if (userLoading) return null;

  const scrollToCode = () => {
    const panels = Array.from(document.querySelectorAll('[data-detail-capture]'));
    const visiblePanel = panels.find(p => p.offsetParent !== null) || panels[0];
    visiblePanel?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="flex w-full flex-col gap-8">
      {availablePlatforms.length > 1 && (
        <PlatformSelect
          platforms={availablePlatforms}
          activePlatform={platform}
          onChange={p => {
            setPlatform(p);
            try {
              window.localStorage.setItem('anm-docs-framework', p);
            } catch {}
          }}
          idPrefix="sidebar-stack"
          className="w-full"
        />
      )}
      <div className="flex w-full gap-8">
        <AnimatedButton
          theme="light"
          size="sm"
          className="flex-1"
          icon={copiedCode ? <Check size={14} /> : <Copy size={14} />}
          onClick={() => {
            if (!hasAccess) return scrollToCode();
            
            const { code } = getCodeForPlatform(codeState, platform);
            if (!code) return;

            navigator.clipboard.writeText(code);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);

            const toastMsg = `${PLATFORM_LABEL[platform]} code copied`;
            const toastOpts = platform === 'html' ? undefined : {
              description: `You also need ${animation.slug}.css. Grab it${codeState?.[`${platform}Usage`] ? ', and a usage example,' : ''} from the code under the preview.`
            };
            toast.success(toastMsg, toastOpts);

            const name = animation.title || animation.name;
            analytics.animation.copied(
              animation.id,
              name,
              platform,
              animation.category?.name || animation.category || 'unknown'
            );
            
            sendUserEvent('animation_copied', {
              animation_id: animation.id,
              animation_name: name,
              category: animation.category?.slug || animation.category?.name || 'unknown',
              platform
            });
            
            window.dispatchEvent(
              new CustomEvent(ONBOARDING_EVENTS.copied, {
                detail: { slug: animation.slug, platform }
              })
            );
          }}
        >
          {copiedCode ? 'Copied' : 'Copy code'}
        </AnimatedButton>
        <AnimatedButton
          theme="surface"
          size="sm"
          className="flex-1"
          icon={copiedAi ? <Check size={14} /> : <Brain size={14} />}
          onClick={() => {
            if (!hasAccess) return scrollToCode();
            
            const { code, lang } = getCodeForPlatform(codeState, platform);
            if (code) {
              const prompt = generateAiPrompt({ animation, code, platform, lang });
              navigator.clipboard.writeText(prompt);
              
              setCopiedAi(true);
              setTimeout(() => setCopiedAi(false), 2000);
              
              toast.success('Copied with context - paste into your AI assistant');
              
              analytics.track('copy_for_ai', {
                animation_id: animation.id,
                platform,
                source: 'sidebar'
              });
            }
          }}
        >
          {copiedAi ? 'Copied' : 'Copy for AI'}
        </AnimatedButton>
      </div>
    </div>
  );
}

const DEFAULT_SNIPPET = [
  'import gsap from "gsap";',
  'import { useGSAP } from "@gsap/react";',
  '',
  'export function init(root) {',
  '  const items = root.querySelectorAll("[data-anm-item]");',
  '  const tl = gsap.timeline({ paused: true });',
  '',
  '  tl.from(items, {',
  '    yPercent: 120,',
  '    opacity: 0,',
  '    duration: 0.8,',
  '    stagger: 0.06,',
  '    ease: "expo.out",',
  '  });',
  '',
  '  root.addEventListener("mouseenter", () => tl.play());',
  '  root.addEventListener("mouseleave", () => tl.reverse());',
  '',
  '  return { play: () => tl.restart() };',
  '}'
];

const LANG_MAP = {
  react: 'JSX',
  vue: 'Vue',
  html: 'HTML'
};

const SNIPPET_LANG = {
  react: 'jsx',
  vue: 'html',
  html: 'html'
};

function ExpandToggleButton({ icon, label, onClick, topBorder = true }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-6 py-8 text-[13px] font-sans text-foreground-muted transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:text-foreground ${topBorder ? 'border-t border-foreground/10' : ''}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function InlineCodePreview({
  animation,
  codeState,
  onCodeChange,
  hasAccess,
  userLoading = false,
  preferredPlatform = null,
  isAuthenticated = false,
  starterPack = null
}) {
  const [expanded, setExpanded] = useState(false);
  const trackedRef = useRef(false);

  const platform = useMemo(() => resolvePlatform(codeState, preferredPlatform), [codeState, preferredPlatform]);
  
  const previewText = useMemo(() => {
    const rawCode = platform === 'react' ? codeState?.react : platform === 'vue' ? codeState?.vue : codeState?.html;
    const stripToken = LANG_MAP[platform];
    const stripped = stripComments(rawCode || '', stripLangFor(platform, stripToken));
    return stripped.split('\n').slice(0, 10).join('\n');
  }, [codeState, platform]);

  if (userLoading) return null;

  if (hasAccess) {
    if (expanded) {
      return (
        <div className="flex flex-col border border-foreground/10">
          <div className="h-[520px]">
            <CodeViewer
              codeState={codeState}
              animation={animation}
              onCodeChange={onCodeChange}
              defaultPlatform={preferredPlatform}
              flush={true}
              hideCopyActions={true}
            />
          </div>
          <ExpandToggleButton icon={<CaretUp size={12} />} label="Collapse code" onClick={() => setExpanded(false)} />
        </div>
      );
    }

    return (
      <div className="flex flex-col overflow-hidden border border-foreground/10">
        <div className="pointer-events-none relative max-h-[190px] select-none overflow-hidden">
          <CodeSnippet
            language={SNIPPET_LANG[platform]}
            copyable={false}
            headerless={true}
            maxHeight="190px"
            fontSize="13px"
          >
            {previewText}
          </CodeSnippet>
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, transparent 30%, var(--background) 96%)' }}
          />
        </div>
        <ExpandToggleButton icon={<CaretDown size={12} />} label="View code" onClick={() => setExpanded(true)} />
      </div>
    );
  }

  if (expanded) {
    return (
      <div className="flex flex-col border border-foreground/10">
        <div className="relative overflow-hidden">
          <pre
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre p-20 font-mono text-[12px] leading-[1.7] text-foreground/[0.09] select-none"
          >
            {DEFAULT_SNIPPET.join('\n')}
          </pre>
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, transparent, var(--background) 62%)' }}
          />
          <div className="relative flex justify-center px-24 py-40">
            <StarterPack
              animation={animation}
              isAuthenticated={isAuthenticated}
              starterPack={starterPack}
              trackShown={false}
            />
          </div>
        </div>
        <ExpandToggleButton icon={<CaretUp size={12} />} label="Close" onClick={() => setExpanded(false)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col overflow-hidden border border-foreground/10 bg-foreground/[0.02]">
      <div className="flex h-80 items-center justify-center">
        <div className="flex items-center gap-10 text-foreground-muted">
          <Lock size={14} />
          <span className="text-body-sm">The full source for {animation.title || 'this component'} is locked.</span>
        </div>
      </div>
      <ExpandToggleButton
        icon={<CaretDown size={12} />}
        label="Get the code"
        onClick={() => {
          setExpanded(true);
          if (!trackedRef.current) {
            trackedRef.current = true;
            analytics.track('locked_code_opened', {
              animation_slug: animation.slug,
              animation_name: animation.title || animation.name
            });
          }
        }}
      />
    </div>
  );
}

function UpgradePrompt({ isAuthenticated }) {
  const soloPlan = ServerData.stripe?.landingPlans?.find(p => p.key === 'solo');
  const price = effectiveCyclePrice(soloPlan?.quarterly);

  return (
    <section className="border-t border-foreground/10 pt-32">
      <div className="flex flex-col items-start gap-12 bg-foreground/[0.04] p-20">
        <span className="flex size-32 items-center justify-center bg-foreground/10">
          <Lock size={14} className="text-foreground" />
        </span>
        <div className="flex flex-col gap-8">
          <p className="text-body font-medium text-foreground">
            Attributes, tips, use cases and full code are part of access.
          </p>
          <p className="text-body-sm text-foreground-reading">
            The preview and provenance stay public. Tune-it docs, the data-anm-* attribute table, real-world use cases and the copy-ready code unlock the moment you sign in.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-24 gap-y-12">
          <AnimatedButton href="/pricing" theme="light" size="sm">
            Get access
          </AnimatedButton>
          <span className="text-accent-xs text-foreground-muted">
            {price ? `From €${price}/mo` : 'From €29/mo'}
          </span>
        </div>
      </div>
    </section>
  );
}

export default function DetailPage({
  animation,
  isSaved,
  relatedAnimations,
  currentUserSavedAnimations = [],
  conceptsInComponent = [],
  availableFormats = null,
  totalCount = null,
  starterPack = null,
  faq = []
}) {
  const { hasAccess, isAuthenticated, loading, profile } = useUser();
  
  const [codeState, setCodeState] = useState({
    html: animation.html_code || '',
    css: animation.css_code || '',
    js: animation.js_code || animation.gsap_code || '',
    react: animation.react_code || '',
    vue: animation.vue_code || '',
    reactUsage: animation.demo_react_code || '',
    vueUsage: animation.demo_vue_code || '',
    webflow: animation.webflow_code || '',
    webflowCss: animation.webflow_css_code || ''
  });

  const handleCodeChange = useCallback((value, view, tab) => {
    let key;
    if (view === 'webflow' && tab === 'CSS') key = 'webflowCss';
    else if (tab === 'CSS') key = 'css';
    else if (tab === 'JS' || tab === 'Javascript') key = 'js';
    else if (tab === 'HTML') key = 'html';
    else if (tab === 'JSX') key = 'react';
    else if (tab === 'Vue') key = 'vue';
    else if (tab === 'Usage') key = view === 'vue' ? 'vueUsage' : 'reactUsage';
    else if (tab === 'JSON' || tab === 'Webflow') key = 'webflow';
    else key = 'html';

    setCodeState(prev => ({ ...prev, [key]: value }));
  }, []);

  const hasConfigurables = countUsableConfigurables(animation) >= CUSTOMIZE_MIN_CONFIGURABLES;
  const primaryAttribute = useMemo(() => getPrimaryAttribute(animation), [animation]);
  const configurables = useMemo(() => getConfigurables(animation), [animation]);
  const apiName = useMemo(() => getAnmApiName(animation.slug), [animation.slug]);

  const [customValues, setCustomValues] = useState({});
  const [committedValues, setCommittedValues] = useState({});

  const handleCustomizerChange = useCallback((key, val) => {
    setCustomValues(prev => ({ ...prev, [key]: val }));
  }, []);

  const handleCustomizerCommit = useCallback((key, val) => {
    setCommittedValues(prev => ({ ...prev, [key]: val }));
  }, []);

  const handleApplyPreset = useCallback((preset) => {
    const entries = Object.entries(preset || {});
    if (entries.length !== 0) {
      setCustomValues(prev => {
        const next = { ...prev };
        for (const [k, v] of entries) next[k] = v;
        return next;
      });
      setCommittedValues(prev => {
        const next = { ...prev };
        for (const [k, v] of entries) next[k] = v;
        return next;
      });
      analytics.track('customize_preset_applied', {
        animation_slug: animation.slug,
        attrs: entries.map(([k]) => k)
      });
    }
  }, [animation.slug]);

  const handleCustomizerReset = useCallback(() => {
    setCustomValues({});
    setCommittedValues({});
    setCodeState(prev => ({
      ...prev,
      html: animation.html_code || '',
      react: animation.react_code || '',
      vue: animation.vue_code || ''
    }));
  }, [animation.html_code, animation.react_code, animation.vue_code]);

  useEffect(() => {
    if (hasConfigurables && hasAccess && Object.keys(committedValues).length !== 0) {
      setCodeState(prev => ({
        ...prev,
        html: applyValuesToHtml(prev.html, committedValues, primaryAttribute),
        react: applyValuesToReact(prev.react, committedValues, configurables),
        vue: applyValuesToVue(prev.vue, committedValues, configurables)
      }));
    }
  }, [committedValues, hasConfigurables, hasAccess, primaryAttribute, configurables]);

  const savedIds = (currentUserSavedAnimations || []).map(a => a.animation_id || a.id);
  const paywallTrackedRef = useRef(false);

  useEffect(() => {
    if (!loading && !hasAccess && !paywallTrackedRef.current) {
      paywallTrackedRef.current = true;
      analytics.track('copy_blocked_paywall', {
        animation_id: animation.id,
        animation_name: animation.title || animation.name,
        animation_slug: animation.slug,
        category: animation.category?.slug || animation.category?.name || 'unknown',
        authenticated: isAuthenticated
      });
    }
  }, [loading, hasAccess, isAuthenticated, animation]);

  const sidebarRef = useRef(null);

  useEffect(() => {
    const el = sidebarRef.current;
    if (!el) return;
    
    let rafId = 0;
    const updateHeight = () => {
      rafId = 0;
      const top = el.getBoundingClientRect().top;
      el.style.height = `${Math.max(360, Math.round(window.innerHeight - top - 24))}px`;
    };
    
    const onResize = () => {
      if (!rafId) rafId = requestAnimationFrame(updateHeight);
    };

    updateHeight();
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      window.removeEventListener('resize', onResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div data-theme="dark" data-transition-content="" className="min-h-screen bg-background text-foreground">
      <Tracker animation={animation} />
      <OnboardingMessage slug={animation.slug} platform={profile?.preferred_platform} />
      
      <section className="v2-container pt-96 pb-16 lg:pb-24">
        <div className="grid grid-cols-12 gap-x-24">
          <div className="col-span-12 lg:col-span-10 lg:col-start-3">
            <DetailHeader
              animation={animation}
              isSaved={isSaved}
              availableFormats={availableFormats}
              totalCount={totalCount}
            />
          </div>
        </div>
      </section>
      
      <section className="v2-container pb-32 lg:pb-64">
        <div className="grid grid-cols-12 gap-x-24">
          <div className="col-span-12 flex flex-col gap-24 lg:col-span-7 lg:col-start-3 lg:gap-32">
            <AnimationPreview
              animation={animation}
              codeState={codeState}
              customize={
                hasConfigurables && !hasAccess
                  ? { values: customValues, committed: committedValues, selector: `[${primaryAttribute}]`, api: apiName }
                  : null
              }
            />
            <TimelineStrip animation={animation} hasAccess={hasAccess} />
            {hasConfigurables && (
              <InlineCodePreview
                animation={animation}
                codeState={codeState}
                onCodeChange={handleCodeChange}
                hasAccess={hasAccess}
                userLoading={loading}
                preferredPlatform={profile?.preferred_platform}
                isAuthenticated={isAuthenticated}
                starterPack={starterPack}
              />
            )}
            <div data-detail-capture={true}>
              <MobilePrompt
                animation={animation}
                isAuthenticated={isAuthenticated}
                hasAccess={hasAccess}
                starterPack={starterPack}
              />
            </div>
            <ProvenanceSection animation={animation} />
            <div className="-mb-8">
              <ProvenanceChip animation={animation} size="default" />
            </div>
            <CraftSection animation={animation} />
            <RequirementsSection animation={animation} concepts={conceptsInComponent} />
            
            {hasAccess ? (
              <Fragment>
                {!hasConfigurables && <AnimationAttributes animation={animation} />}
                <AnimationDocs
                  animation={animation}
                  onApplyPreset={hasConfigurables && hasAccess ? handleApplyPreset : null}
                />
              </Fragment>
            ) : loading ? null : (
              <UpgradePrompt isAuthenticated={isAuthenticated} />
            )}
            
            <FAQ items={faq} heading="Frequently asked" />
          </div>

          {hasConfigurables ? (
            <aside className="col-span-12 mt-48 lg:col-span-3 lg:col-start-10 lg:mt-0">
              <div className="flex h-full flex-col gap-24">
                <div className="lg:sticky lg:top-[var(--v2-sticky-top)] lg:pb-72 has-[[aria-expanded=true]]:z-10">
                  {animation.is_free_preview && !hasAccess && !isAuthenticated && !loading && (
                    <div data-detail-capture={true} className="hidden border-b border-foreground/10 pb-24 mb-24 lg:block">
                      <StarterPack
                        animation={animation}
                        isAuthenticated={isAuthenticated}
                        showCheckout={false}
                      />
                    </div>
                  )}
                  <Customizer
                    animation={animation}
                    values={customValues}
                    onChange={handleCustomizerChange}
                    onCommit={handleCustomizerCommit}
                    onReset={handleCustomizerReset}
                    locked={!hasAccess && !loading}
                  />
                </div>
                <div className="flex flex-col gap-24 lg:sticky lg:bottom-16 lg:mt-auto lg:bg-background lg:pt-16">
                  {hasAccess && (
                    <SidebarActions
                      animation={animation}
                      codeState={codeState}
                      hasAccess={hasAccess}
                      userLoading={loading}
                      preferredPlatform={profile?.preferred_platform}
                    />
                  )}
                  {!hasAccess && !loading && !(animation.is_free_preview && !isAuthenticated) && (
                    <div data-detail-capture={true} className="hidden border-t border-foreground/10 pt-20 lg:block">
                      <StarterPack animation={animation} isAuthenticated={isAuthenticated} />
                    </div>
                  )}
                </div>
              </div>
            </aside>
          ) : (
            <aside className="col-span-12 mt-48 lg:col-span-3 lg:col-start-10 lg:mt-0">
              <div
                ref={sidebarRef}
                className="sticky top-[var(--v2-sticky-top)] flex h-[calc(100dvh_-_var(--v2-sticky-top)_-_2rem)] flex-col bg-background"
              >
                <div className="min-h-0 flex-1">
                  <AccessWrapper
                    hasAccess={hasAccess}
                    loading={loading}
                    isAuthenticated={isAuthenticated}
                    animation={animation}
                    starterPack={starterPack}
                  >
                    <CodeViewer
                      codeState={codeState}
                      animation={animation}
                      onCodeChange={handleCodeChange}
                      defaultPlatform={profile?.preferred_platform}
                      flush={true}
                    />
                  </AccessWrapper>
                </div>
                {!hasAccess && <CodeViewer.InstallNote showMcp={false} />}
              </div>
            </aside>
          )}
        </div>
      </section>
      
      <RelatedSection
        animation={animation}
        relatedAnimations={relatedAnimations}
        isAuthenticated={isAuthenticated}
        savedAnimationIds={savedIds}
      />
      <CategorySection currentCategory={animation.category} slug={animation.slug} />
      <MobileCapture isAuthenticated={isAuthenticated} />
    </div>
  );
}
