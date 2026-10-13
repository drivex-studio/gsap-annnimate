// module id: 343931 (CodeViewer Main UI)
import React, { useState, useRef, useMemo, useEffect, useCallback, Fragment } from 'react';

import Link from '@/components/navigation/Link';
import { EditorState, EditorView, basicSetup } from '@codemirror/basic-setup'; // TODO: derived from 115080, 693125, 459643 (CodeMirror setup)
import { keymap } from '@codemirror/view'; 
import { indentWithTab } from '@codemirror/commands'; // TODO: derived from 781044
import { html } from '@codemirror/lang-html'; // TODO: derived from 724433
import { css } from '@codemirror/lang-css'; // TODO: derived from 73840
import { javascript } from '@codemirror/lang-javascript'; // TODO: derived from 837153
import { LanguageSupport } from '@codemirror/language'; // TODO: derived from 998540 (JSON setup via LRParser omitted for brevity, represented by language support)

import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/Tooltip';
import { SmartTooltipGroup, SmartTooltip } from '@/components/ui/SmartTooltip';
import { Info, Eye, Copy, Check, ChatText, Brain } from '@phosphor-icons/react';

import PlatformSelect from './PlatformSelect';
import { toast } from 'sonner';
import { analytics } from '@/libs/utils/analytics';
import { sendUserEvent } from '@/libs/utils/events';
import { cn } from '@/libs/utils/className';
import { ONBOARDING_EVENTS } from '@/libs/config/onboarding';
import { useOnboarding } from '@/providers/OnboardingProvider';
import { parseAttributesFromJs, createAnmAutocomplete, anmThemeExtensions } from '@/libs/editor/setup'; // TODO: derived from module id 412715
import { stripComments, stripLangFor } from '@/components/animations/utils/CodeUtilities';

function getTabsForPlatform(platform, animation) {
  const hasJsOrGsap = animation.js_code || animation.gsap_code;
  const hasWebflowCss = !!animation.webflow_css_code;

  switch (platform) {
    case 'html':
      return hasJsOrGsap ? ['HTML', 'CSS', 'JS'] : ['HTML', 'CSS'];
    case 'react':
      return animation.demo_react_code ? ['JSX', 'CSS', 'Usage'] : ['JSX', 'CSS'];
    case 'vue':
      return animation.demo_vue_code ? ['Vue', 'CSS', 'Usage'] : ['Vue', 'CSS'];
    case 'webflow': {
      const tabs = ['JSON'];
      if (hasJsOrGsap) tabs.push('JS');
      if (hasWebflowCss) tabs.push('CSS');
      return tabs;
    }
    default:
      return [];
  }
}

function InstallNote({ showMcp = false }) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild={true}>
          <button type="button" className="text-accent-xs mt-12 inline-flex items-center gap-6 text-foreground-muted transition-colors duration-(--duration-quick) hover:text-foreground">
            <Info size={13} />
            Needs GSAP
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" sideOffset={8} className="max-w-[34ch]">
          <p className="text-body-sm font-sans normal-case leading-relaxed text-foreground">
            This component needs GSAP.{' '}
            <Link href="/docs/getting-started/installation" className="text-foreground underline underline-offset-4">
              See installation.
            </Link>
            {showMcp ? (
              <Fragment>
                {' '}Or{' '}
                <Link href="/docs/guides/mcp" className="text-foreground underline underline-offset-4">
                  connect the MCP
                </Link>
                {' '}to pull components straight from your editor.
              </Fragment>
            ) : null}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function WebflowCopyState({ onCopy, copied }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-20 bg-foreground/[0.04] p-32 text-center">
      <div className="flex flex-col items-center gap-12">
        <div className="flex size-56 items-center justify-center border border-foreground/10 bg-background">
          {copied ? (
            <Check size={20} className="text-brand" />
          ) : (
            <Copy size={20} className="text-foreground-muted" />
          )}
        </div>
        <div>
          <p className="text-body font-medium text-foreground">
            {copied ? 'Copied to clipboard' : 'Ready to paste into Webflow'}
          </p>
          <p className="text-body-sm mt-6 max-w-[28ch] text-foreground-muted">
            {copied
              ? 'Paste directly into Webflow with Cmd or Ctrl + V.'
              : 'Webflow needs the JSON copied as application/json - this button handles that.'}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onCopy}
        className={`text-accent-xs flex items-center gap-8 px-14 py-8 transition-opacity duration-(--duration-quick) ease-(--ease-expo-out) ${copied ? 'bg-brand text-[#141314]' : 'bg-foreground text-background hover:opacity-90'}`}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
        <span>{copied ? 'Copied' : 'Copy JSON'}</span>
      </button>
    </div>
  );
}

export default function CodeViewer({
  codeState,
  animation,
  onCodeChange,
  defaultPlatform,
  flush = false,
  hideCopyActions = false
}) {
  const initialPlatform = defaultPlatform || 'react';
  const [platform, setPlatform] = useState(initialPlatform);
  const [activeTab, setActiveTab] = useState(() => getTabsForPlatform(initialPlatform, animation)[0] || 'HTML');
  const [isCopied, setIsCopied] = useState(false);
  const [displayMode, setDisplayMode] = useState('focused');
  const [isAiCopied, setIsAiCopied] = useState(false);

  const { active, steps } = useOnboarding();
  const isOnboardingActive = active && !steps.copy;

  const editorContainerRef = useRef(null);
  const editorViewRef = useRef(null);
  const debounceRef = useRef(null);
  const isUpdatingRef = useRef(false);

  const availablePlatforms = useMemo(() => {
    const list = [];
    if (animation.html_code || animation.css_code || animation.js_code || animation.gsap_code) list.push('html');
    if (animation.react_code) list.push('react');
    if (animation.vue_code) list.push('vue');
    if (animation.webflow_code) list.push('webflow');
    
    // Assuming PLATFORM_ORDER is provided by PlatformSelect module
    const PLATFORM_ORDER = ['react', 'vue', 'html', 'webflow']; 
    return PLATFORM_ORDER.filter(p => list.includes(p));
  }, [animation]);

  useEffect(() => {
    if (availablePlatforms.length && !availablePlatforms.includes(platform)) {
      const firstAvailable = availablePlatforms[0];
      setPlatform(firstAvailable);
      setActiveTab(getTabsForPlatform(firstAvailable, animation)[0]);
    }
  }, [availablePlatforms]);

  const currentTabs = useMemo(() => getTabsForPlatform(platform, animation), [platform, animation]);

  const currentRawCode = useMemo(() => {
    const keyMap = {
      webflow: activeTab === 'CSS' ? 'webflowCss' : undefined,
      CSS: 'css',
      JS: 'js',
      Javascript: 'js',
      HTML: 'html',
      JSX: 'react',
      Vue: 'vue',
      Usage: platform === 'vue' ? 'vueUsage' : 'reactUsage',
      JSON: 'webflow',
      Webflow: 'webflow'
    };
    const key = (platform === 'webflow' && activeTab === 'CSS') 
      ? 'webflowCss' 
      : (keyMap[activeTab] || 'html');
      
    return codeState[key] || '';
  }, [codeState, platform, activeTab]);

  const getFileName = (plat, tab, slug = 'component') => {
    if (plat === 'webflow' && tab === 'CSS') return 'custom-code.css';
    if (tab === 'HTML') return `${slug}.html`;
    if (tab === 'CSS') return `${slug}.css`;
    if (tab === 'JS' || tab === 'Javascript') return `${slug}.js`;
    if (tab === 'JSX') return `${slug}.jsx`;
    if (tab === 'Vue') return `${slug}.vue`;
    if (tab === 'Usage') return plat === 'vue' ? 'example.vue' : 'example.jsx';
    if (tab === 'JSON') return 'animation.json';
    return 'code';
  };

  const currentFileName = getFileName(platform, activeTab, animation.slug);
  const currentLang = stripLangFor(platform, activeTab);

  const displayedCode = useMemo(() => {
    return displayMode === 'focused' ? stripComments(currentRawCode, currentLang) : currentRawCode;
  }, [displayMode, currentRawCode, currentLang]);

  const editorLanguage = useMemo(() => {
    if (activeTab === 'CSS') return css();
    if (activeTab === 'JS' || activeTab === 'Javascript') return javascript();
    if (activeTab === 'JSON') return new LanguageSupport(); // JSON support mocked here
    if (platform === 'react' && (activeTab === 'JSX' || activeTab === 'Usage')) return javascript({ jsx: true });
    return html();
  }, [platform, activeTab]);

  const autocompleteExt = useMemo(() => {
    const jsText = animation.js_code || animation.gsap_code || '';
    const attrs = parseAttributesFromJs(jsText);
    return createAnmAutocomplete(attrs);
  }, [animation.js_code, animation.gsap_code]);

  const hasTrackedEdit = useRef(false);

  const handleCodeChange = useCallback((newCode) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    debounceRef.current = setTimeout(() => {
      onCodeChange?.(newCode, platform, activeTab);
      
      if (!hasTrackedEdit.current) {
        hasTrackedEdit.current = true;
        analytics.track('code_edited', { animation_slug: animation.slug, platform });
      }
      
      window.dispatchEvent(
        new CustomEvent(ONBOARDING_EVENTS.tuned, { detail: { slug: animation.slug } })
      );
    }, 300);
  }, [onCodeChange, platform, activeTab, animation.slug]);

  useEffect(() => {
    if (!editorContainerRef.current) return;
    
    if (editorViewRef.current) {
      editorViewRef.current.destroy();
      editorViewRef.current = null;
    }
    
    const state = EditorState.create({
      doc: displayedCode,
      extensions: [
        basicSetup,
        editorLanguage,
        keymap.of([indentWithTab]),
        EditorView.lineWrapping,
        ...anmThemeExtensions,
        autocompleteExt,
        EditorView.updateListener.of(update => {
          if (update.docChanged && !isUpdatingRef.current) {
            // Check if it was a user edit (not remote)
            const isUserEdit = !update.transactions.find(tr => tr.annotation('remote'));
            if (isUserEdit) {
              handleCodeChange(update.state.doc.toString());
            }
          }
        })
      ]
    });
    
    editorViewRef.current = new EditorView({
      state,
      parent: editorContainerRef.current
    });
    
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [platform, activeTab, editorLanguage]);

  useEffect(() => {
    if (!editorViewRef.current) return;
    
    const currentEditorDoc = editorViewRef.current.state.doc.toString();
    if (currentEditorDoc !== displayedCode) {
      isUpdatingRef.current = true;
      const transaction = editorViewRef.current.state.update({
        changes: { from: 0, to: currentEditorDoc.length, insert: displayedCode },
        annotations: ['remote'] // Used string annotation as fallback representation
      });
      editorViewRef.current.dispatch(transaction);
      isUpdatingRef.current = false;
    }
  }, [displayedCode]);

  useEffect(() => {
    if (animation?.id) {
      analytics.feature.codeViewerOpened(animation.id, platform);
    }
  }, [animation?.id]);

  const handleCopy = () => {
    if (platform === 'webflow' && activeTab === 'JSON') {
      const copyHandler = (e) => {
        e.clipboardData.setData('application/json', currentRawCode);
        e.preventDefault();
        document.removeEventListener('copy', copyHandler);
      };
      document.addEventListener('copy', copyHandler);
      document.execCommand('copy');
    } else {
      navigator.clipboard.writeText(displayedCode);
    }
    
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast.success(`${currentFileName} copied`);
    
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
  };

  const isWebflowJson = platform === 'webflow' && activeTab === 'JSON';

  return (
    <div className={cn("flex h-full flex-col overflow-hidden bg-background", flush ? "" : "border border-foreground/10")}>
      <div className="flex items-center gap-12 border-b border-foreground/10 p-12">
        <div className="min-w-0 flex-1">
          <PlatformSelect
            platforms={availablePlatforms}
            activePlatform={platform}
            onChange={(p) => {
              setPlatform(p);
              setActiveTab(getTabsForPlatform(p, animation)[0]);
              analytics.track('code_viewer_tab_switched', { animation_id: animation.id, platform: p });
            }}
          />
        </div>
        {!isWebflowJson && (
          <SmartTooltipGroup delayDuration={250} side="bottom" sideOffset={8}>
            <div className="flex shrink-0 items-stretch gap-2 self-stretch bg-foreground/[0.06] p-2">
              <SmartTooltip id="code-mode-focused" content="Focused - comments hidden">
                <button
                  type="button"
                  onClick={() => setDisplayMode('focused')}
                  aria-pressed={displayMode === 'focused'}
                  aria-label="Focused - comments hidden"
                  className={cn(
                    "flex h-full w-full items-center justify-center px-10 transition-colors duration-(--duration-quick) ease-(--ease-expo-out)",
                    displayMode === 'focused' ? "bg-foreground text-background" : "text-foreground-muted hover:text-foreground"
                  )}
                >
                  <Eye size={14} />
                </button>
              </SmartTooltip>
              <SmartTooltip id="code-mode-full" content="Full - all comments (good for AI)">
                <button
                  type="button"
                  onClick={() => setDisplayMode('full')}
                  aria-pressed={displayMode === 'full'}
                  aria-label="Full - all comments"
                  className={cn(
                    "flex h-full w-full items-center justify-center px-10 transition-colors duration-(--duration-quick) ease-(--ease-expo-out)",
                    displayMode === 'full' ? "bg-foreground text-background" : "text-foreground-muted hover:text-foreground"
                  )}
                >
                  <ChatText size={14} />
                </button>
              </SmartTooltip>
            </div>
          </SmartTooltipGroup>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-12 border-b border-foreground/10 px-12 py-10">
        <span className="text-accent-xs text-foreground-muted">{currentFileName}</span>
        <div className="flex items-center gap-8">
          {currentTabs.length > 1 && (
            <div className="flex items-center gap-2 bg-foreground/[0.06] p-2">
              {currentTabs.map(tab => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`text-accent-xs px-8 py-4 transition-colors duration-(--duration-quick) ease-(--ease-expo-out) ${isActive ? 'bg-foreground text-background' : 'text-foreground-muted hover:text-foreground'}`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          )}
          {hideCopyActions && !isWebflowJson && (
            <button
              type="button"
              onClick={handleCopy}
              aria-label={`Copy ${currentFileName}`}
              className="text-accent-xs flex items-center gap-4 bg-foreground/[0.06] px-8 py-6 text-foreground-muted transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:text-foreground"
            >
              {isCopied ? <Check size={12} /> : <Copy size={12} />}
              <span>{isCopied ? 'Copied' : 'Copy'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {isWebflowJson ? (
          <WebflowCopyState onCopy={handleCopy} copied={isCopied} />
        ) : (
          <div ref={editorContainerRef} className="h-full overflow-auto" style={{ fontSize: '13px' }} data-lenis-prevent={true} />
        )}
      </div>

      {!isWebflowJson && hideCopyActions && (
        <div className="shrink-0 border-t border-foreground/10 p-12">
          <InstallNote showMcp={true} />
        </div>
      )}

      {!isWebflowJson && !hideCopyActions && (
        <div className="flex shrink-0 flex-col gap-10 border-t border-foreground/10 p-12">
          <div className="flex gap-8">
            <button
              type="button"
              onClick={handleCopy}
              aria-label={isCopied ? 'Copied' : 'Copy code'}
              className={cn(
                "flex flex-1 items-center justify-center gap-6 py-10 text-body-sm font-medium transition-opacity duration-(--duration-quick) ease-(--ease-expo-out)",
                isCopied ? "bg-brand text-[#141314]" : "bg-foreground text-background hover:opacity-90",
                isOnboardingActive && !isCopied ? "outline outline-2 -outline-offset-2 outline-brand" : ""
              )}
            >
              {isCopied ? <Check size={14} /> : <Copy size={14} />}
              <span>{isCopied ? 'Copied' : 'Copy code'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const name = animation.title || animation.name || 'this component';
                const url = `https://annnimate.com/animations/${animation.slug}`;
                const instructions = animation.metadata?.teaching?.blocks?.map(b => b.text).filter(Boolean).join('\n\n');
                const prompt = [
                  `# ${name}`,
                  animation.description || '',
                  instructions ? `## How it works\n\n${instructions}` : '',
                  `## Code (${platform})`,
                  '```' + currentLang + '\n' + currentRawCode.trim() + '\n```',
                  `Source: ${url} - a production GSAP component from Annnimate. Keep the data-anm-* attributes; they configure the animation.`
                ].filter(Boolean).join('\n\n');
                
                navigator.clipboard.writeText(prompt);
                setIsAiCopied(true);
                setTimeout(() => setIsAiCopied(false), 2000);
                toast.success('Copied with context - paste into your AI assistant');
                analytics.track('copy_for_ai', { animation_id: animation.id, platform });
              }}
              aria-label="Copy for AI"
              className="flex flex-1 items-center justify-center gap-6 border border-foreground/10 bg-foreground/[0.04] py-10 text-body-sm font-medium text-foreground-muted transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:text-foreground"
            >
              {isAiCopied ? <Check size={13} /> : <Brain size={13} />}
              <span>{isAiCopied ? 'Copied' : 'Copy for AI'}</span>
            </button>
          </div>
          <InstallNote showMcp={true} />
        </div>
      )}
    </div>
  );
}
