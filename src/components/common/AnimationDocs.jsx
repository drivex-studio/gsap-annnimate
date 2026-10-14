'use client';
import { useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { toast } from 'sonner';
import CodeBlock from '@/components/animations/details/CodeSnippet';

const URL_REGEX = /(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])/g;

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function renderTextWithLinks(text) {
  if (typeof text !== 'string' || text.indexOf('http') === -1) {
    return text;
  }

  return text.split(URL_REGEX).map((part, index) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={index}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground underline decoration-foreground/30 underline-offset-2 transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:decoration-foreground"
      >
        {part.replace(/^https?:\/\//, '')}
      </a>
    ) : (
      part
    )
  );
}

function detectCodeLanguage(code) {
  if (!code) return 'plaintext';
  if (
    code.includes('data-anm-') ||
    code.includes('<div') ||
    code.includes('<button')
  ) {
    return 'html';
  }
  if (
    code.includes('{') &&
    (code.includes('animation') || code.includes('transform'))
  ) {
    return 'css';
  }
  if (code.includes('gsap.') || code.includes('function')) {
    return 'javascript';
  }
  return 'html';
}

function TipArticle({ item }) {
  if (typeof item === 'string') {
    return (
      <article>
        <p className="text-reading text-foreground-reading">
          {renderTextWithLinks(item)}
        </p>
      </article>
    );
  }

  const codeExample = item.code || item.code_example;
  const detectedLanguage = codeExample ? detectCodeLanguage(codeExample) : null;

  return (
    <article>
      {item.title && (
        <h3 className="text-body font-medium text-foreground">{item.title}</h3>
      )}
      {item.content && (
        <p className="text-reading mt-8 text-foreground-reading">
          {renderTextWithLinks(item.content)}
        </p>
      )}
      {codeExample && (
        <div className="mt-12">
          <CodeBlock language={detectedLanguage} copyable={true}>
            {codeExample}
          </CodeBlock>
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
    <>
      <div className="mt-16 flex flex-col gap-24">
        {visibleTips.map((tip, index) => (
          <TipArticle key={index} item={tip} />
        ))}
      </div>
      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-accent-xs mt-16 flex w-full items-center justify-center gap-6 border-t border-foreground/10 bg-foreground/[0.04] py-10 text-foreground-muted transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:text-foreground"
        >
          <CaretDown
            size={12}
            className={`transition-transform duration-(--duration-quick) ${isExpanded ? 'rotate-180' : ''}`}
          />
          {isExpanded ? 'Show less' : `Show ${hiddenCount} more`}
        </button>
      ) : null}
    </>
  );
}

function PresetVariationItem({ item, onApply = null }) {
  const displayName = item.displayName || item.name;
  const attributesOverride = item.attributes_override || {};

  const overrideBadges = (
    <span className="flex flex-wrap items-center gap-6">
      {Object.entries(attributesOverride).map(([attrKey, attrValue]) => (
        <code
          key={attrKey}
          className="bg-foreground/[0.06] px-8 py-2 font-mono text-[10px] text-foreground-muted"
        >
          {attrKey}="{attrValue}"
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
            onApply(attributesOverride);
            toast.success(`${displayName} applied`);
          }}
          className="group flex w-full items-baseline justify-between gap-12 border border-transparent px-8 py-6 text-left transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:bg-foreground/[0.04]"
        >
          <span className="flex flex-wrap items-baseline gap-x-12 gap-y-6">
            <span className="text-body-sm font-medium text-foreground">
              {displayName}
            </span>
            {overrideBadges}
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
      <span className="text-body-sm font-medium text-foreground">
        {displayName}
      </span>
      {overrideBadges}
    </li>
  );
}

function UseCaseItem({ item }) {
  if (typeof item === 'string') {
    return (
      <li className="text-reading flex gap-12 text-foreground-reading">
        <span
          aria-hidden="true"
          className="mt-[0.55em] block size-6 shrink-0 bg-brand"
        />
        <span>{item}</span>
      </li>
    );
  }

  const useCaseObj = item || {};

  return (
    <li className="flex gap-12">
      <span
        aria-hidden="true"
        className="mt-[0.55em] block size-6 shrink-0 bg-brand"
      />
      <div>
        {useCaseObj.title && (
          <span className="text-reading font-medium text-foreground">
            {useCaseObj.title}.{' '}
          </span>
        )}
        {useCaseObj.description && (
          <span className="text-reading text-foreground-reading">
            {useCaseObj.description}
          </span>
        )}
      </div>
    </li>
  );
}

export default function AnimationTipsAndUseCases({
  animation,
  onApplyPreset = null,
}) {
  const metadata = animation?.metadata || {};

  const combinedTips = [
    ...toArray(metadata.tips),
    ...toArray(metadata.troubleshooting).map((entry) => ({
      title: entry.title || entry.problem,
      content: entry.content || entry.solution,
      code: entry.code,
    })),
  ];

  const useCases = toArray(metadata.use_cases);

  const validVariations = toArray(metadata.variations).filter(
    (variation) =>
      variation &&
      variation.attributes_override &&
      Object.keys(variation.attributes_override).length > 0
  );

  if (
    combinedTips.length === 0 &&
    useCases.length === 0 &&
    validVariations.length === 0
  ) {
    return null;
  }

  return (
    <div className="flex flex-col gap-32">
      {combinedTips.length > 0 && (
        <section className="border-t border-foreground/10 pt-32">
          <span className="text-accent-xs text-foreground-muted">Tips</span>
          <h2 className="text-h4 mt-12 text-foreground">
            How to get it right.
          </h2>
          <TipsList tips={combinedTips} />

          {validVariations.length > 0 && (
            <div className="mt-24 border-t border-foreground/10 pt-16">
              <span className="text-accent-xs text-foreground-muted">
                Drop-in presets
              </span>
              {onApplyPreset ? (
                <p className="text-body-sm mt-6 text-foreground-muted">
                  Click one to apply it to the sliders.
                </p>
              ) : null}
              <ul className="mt-12 flex flex-col gap-4">
                {validVariations.map((variation, index) => (
                  <PresetVariationItem
                    key={index}
                    item={variation}
                    onApply={onApplyPreset}
                  />
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
            {useCases.map((useCase, index) => (
              <UseCaseItem key={index} item={useCase} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
