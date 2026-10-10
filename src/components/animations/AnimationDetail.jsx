'use client';

import { useState } from 'react';
import Link from '@/components/navigation/Link';
import { ArrowLeft } from '@phosphor-icons/react';
import { cn } from '@/libs/utils/className';
import { getProvenanceLine } from '@/libs/utils/provenance';

const CODE_TABS = [
  { key: 'code_react', label: 'React' },
  { key: 'code_vue', label: 'Vue' },
  { key: 'code_html', label: 'HTML' },
];

export default function AnimationDetail({ animation }) {
  const tabs = CODE_TABS.filter((t) => animation[t.key]);
  const [active, setActive] = useState(tabs[0]?.key ?? null);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(animation[active]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {}
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] px-16 pb-96 pt-120 lg:px-32 lg:pt-160">
      <Link
        href="/animations"
        className="text-accent-base mb-24 inline-flex items-center gap-8 text-foreground-muted hover:text-foreground"
      >
        <ArrowLeft className="size-14" aria-hidden="true" /> Library
      </Link>

      <h1 className="text-h1 text-foreground">{animation.title}</h1>
      <p className="text-accent-base mt-12 text-foreground-muted">
        {animation.category} · {getProvenanceLine(animation)}
      </p>

      <div className="relative mt-32 aspect-[16/9] w-full overflow-hidden bg-surface">
        {animation.preview_video_url ? (
          <video
            src={animation.preview_video_url}
            poster={animation.preview_image_url || undefined}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 size-full object-cover"
          />
        ) : animation.preview_image_url ? (
          <img
            src={animation.preview_image_url}
            alt={animation.title}
            className="absolute inset-0 size-full object-cover"
          />
        ) : null}
      </div>

      {animation.description && (
        <p className="text-body-lg mt-32 max-w-[60ch] text-foreground-muted">{animation.description}</p>
      )}

      {tabs.length > 0 && (
        <section className="mt-48">
          <div className="flex items-center justify-between gap-16 border-b border-foreground/15">
            <div className="flex gap-4">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActive(t.key)}
                  className={cn(
                    'text-accent-base cursor-pointer border-0 border-b-2 bg-transparent px-12 py-8 transition-colors',
                    active === t.key
                      ? 'border-brand text-foreground'
                      : 'border-transparent text-foreground-muted hover:text-foreground'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={copy}
              className="text-accent-base cursor-pointer border-0 bg-transparent px-12 py-8 text-foreground-muted hover:text-foreground"
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="text-mono-sm overflow-x-auto bg-surface p-16 text-foreground">
            <code>{animation[active]}</code>
          </pre>
        </section>
      )}
    </div>
  );
}
