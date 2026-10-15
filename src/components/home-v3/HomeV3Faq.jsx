'use client';

import React, { useEffect, useRef } from 'react';
import { t } from '@/libs/utils/i18n';
import FaqSection from '@/components/common/FaqSection';
import MinimalAccordion from '@/components/common/MinimalAccordion'; 
import TransitionLink from '@/components/navigation/Link';

/* Data */

const DEFAULT_FAQ_LINKS = [
  {
    'Every Annnimate tier': '/pricing',
  },
  {
    'Annnimate Studio': '/pricing',
  },
  {},
  {
    '14-day money-back guarantee': '/refund',
  },
  {
    'Next.js App Router': '/nextjs',
    'Nuxt ready': '/nuxt',
  },
  {
    'MCP server': '/docs/guides/mcp',
  },
  {
    'free Starter Pack': '/starter-pack',
    'live preview': '/animations',
  },
  {
    'Landmark Kit purchase': '/kits',
  },
];

export default function HomeV3Faq({
  ns = 'home-v3.faq',
  links = DEFAULT_FAQ_LINKS,
  vars = {},
  items = null,
}) {
  const interpolateText = (text) =>
    text.replace(/\{(\w+)\}/g, (match, key) =>
      key === 'cap' ? 25 : vars[key] ?? match,
    );

  const faqItems = (items ?? t(`${ns}.items`)).map(({ q, a }) => ({
    q: interpolateText(q),
    a: interpolateText(a),
  }));

  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const updateMinHeight = () => {
      const listEl = container.querySelector('.macc_list');
      const panelEls = [...container.querySelectorAll('.macc_panel')];

      if (!listEl || !panelEls.length) {
        return;
      }

      const closedListHeight =
        listEl.offsetHeight -
        panelEls.reduce((sum, panel) => sum + panel.offsetHeight, 0);
      const maxPanelHeight = Math.max(
        ...panelEls.map((panel) => panel.scrollHeight),
      );

      container.style.minHeight = `${closedListHeight + maxPanelHeight + 32}px`;
    };

    document.fonts?.ready.then(updateMinHeight);
    updateMinHeight();

    const resizeObserver = new ResizeObserver(updateMinHeight);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  const renderAnswerWithLinks = (answerText, itemLinks = {}) => {
    const matchedKeys = Object.keys(itemLinks).filter((key) =>
      answerText.includes(key),
    );

    if (!matchedKeys.length) {
      return answerText;
    }

    const escapedKeys = matchedKeys.map((key) =>
      key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    );

    return answerText
      .split(RegExp(`(${escapedKeys.join('|')})`))
      .map((part, partIndex) =>
        itemLinks[part] ? (
          <TransitionLink
            key={partIndex}
            href={itemLinks[part]}
            className="underline decoration-foreground/40 underline-offset-2 transition-[text-decoration-color] duration-200 hover:decoration-foreground"
          >
            {part}
          </TransitionLink>
        ) : (
          part
        ),
      );
  };

  return (
    <div className="v3-faq">
      <FaqSection
        faqs={faqItems}
        theme="dark"
        headline={t(`${ns}.headline`)}
        subtext={t(`${ns}.subtext`)}
        list={
          <div ref={containerRef}>
            <MinimalAccordion
              items={faqItems.map(({ q, a }, index) => ({
                question: q,
                answer: renderAnswerWithLinks(a, links[index]),
              }))}
              startOpen={null}
            />
          </div>
        }
      />
    </div>
  );
}
