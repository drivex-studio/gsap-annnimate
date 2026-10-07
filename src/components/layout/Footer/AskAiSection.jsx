import React from 'react';
import { analytics } from '@/libs/utils/analytics';
import { translate } from '@/libs/utils/i18n';

const aiQuery = encodeURIComponent(
  'What does Annnimate (https://annnimate.com), the production-ready GSAP component library for React, Vue and HTML, offer - and how do I add a component to my project?'
);

const aiBots = [
  {
    name: 'Claude',
    href: `https://claude.ai/new?q=${aiQuery}`,
    Icon: function (props) {
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          {...props}
        >
          <path
            d="m2.35 7.98 2.36-1.33.04-.11-.04-.06H4.6l-.4-.03-1.34-.04-1.17-.04L.55 6.3l-.28-.07L0 5.9l.03-.17.24-.16.34.03.76.05 1.14.08.83.04 1.22.13h.2l.02-.08-.07-.05-.05-.04-1.18-.8-1.27-.85-.67-.48-.36-.25L1 3.11l-.08-.5.33-.36.44.03.1.03.46.34.95.74 1.24.91.19.16.07-.06v-.03l-.07-.14-.68-1.22-.72-1.25-.33-.51-.08-.31a2 2 0 0 1-.05-.37l.37-.5.2-.07.5.07.22.18.3.7.5 1.12.78 1.52.23.44.12.42.05.13h.08V4.5l.06-.85.12-1.05.12-1.34.04-.38.18-.46.38-.24.29.14.24.34-.03.22-.15.93-.28 1.45-.18.97h.1l.13-.12.5-.66.82-1.03.36-.4.43-.46.27-.22h.52l.38.57-.17.58-.53.68-.45.57-.63.85-.4.68.04.05h.1L9.8 5l.77-.14.92-.16.41.2.05.2-.16.4-.99.24-1.15.23-1.72.4-.02.02.02.03.78.08.33.01h.8l1.52.12.4.26.23.32-.04.24-.6.3-.83-.19-1.91-.45-.66-.17h-.09v.06l.55.53 1 .9 1.26 1.17.06.3-.16.22-.17-.02-1.1-.83-.43-.38-.96-.8h-.07v.08l.22.32 1.18 1.76.06.54-.09.18-.3.1-.33-.05-.7-.97-.7-1.08L6.62 8l-.07.04-.34 3.63-.16.18-.36.14-.3-.23-.16-.37.16-.74.2-.96.15-.77.14-.95.09-.31v-.03l-.08.01-.72.99-1.09 1.47-.86.92-.2.08-.36-.18.03-.33.2-.3 1.2-1.51.71-.95.47-.54v-.08h-.03L2.07 9.28l-.57.07-.24-.22.03-.38.11-.12z"
            fill="currentColor"
          />
        </svg>
      );
    },
  },
  {
    name: 'ChatGPT',
    href: `https://chatgpt.com/?q=${aiQuery}`,
    Icon: function (props) {
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          {...props}
        >
          <path
            d="M4.6 4.37V3.23q0-.15.12-.22L7 1.7q.48-.27 1.06-.26a2.3 2.3 0 0 1 2.33 2.3v.28L8.01 2.6a.4.4 0 0 0-.43 0zM9.9 8.8V6.08a.4.4 0 0 0-.2-.37l-3-1.75.98-.56a.2.2 0 0 1 .24 0l2.27 1.32c.66.38 1.1 1.2 1.1 1.99 0 .91-.54 1.75-1.38 2.1m-6-2.4-.97-.58q-.13-.08-.12-.21V2.98c0-1.29.97-2.26 2.3-2.26q.76.01 1.35.47L4.12 2.56a.4.4 0 0 0-.22.37zM6 7.63l-1.4-.79V5.16l1.4-.8 1.4.8v1.68zm.9 3.65q-.76-.01-1.36-.47l2.34-1.37a.4.4 0 0 0 .22-.37V5.6l.99.58q.12.08.12.21v2.64c0 1.29-1 2.26-2.31 2.26M4.08 8.6 1.8 7.28A2.4 2.4 0 0 1 .7 5.3c0-.92.55-1.75 1.4-2.1v2.74q0 .25.2.37L5.3 8.04l-.97.56a.2.2 0 0 1-.24 0m-.13 1.97A2.27 2.27 0 0 1 1.62 8.3q0-.14.02-.29l2.34 1.37a.4.4 0 0 0 .43 0L7.4 7.63v1.14q0 .15-.12.22L5 10.3q-.48.26-1.06.26M6.9 12A3 3 0 0 0 9.8 9.6a3 3 0 0 0 1.2-5.14q.08-.37.09-.75A2.98 2.98 0 0 0 7.18.86a2.97 2.97 0 0 0-5 1.54A3 3 0 0 0 1 7.54q-.1.37-.1.75a2.98 2.98 0 0 0 3.92 2.85c.53.52 1.27.86 2.08.86"
            fill="currentColor"
          />
        </svg>
      );
    },
  },
  {
    name: 'Perplexity',
    href: `https://www.perplexity.ai/search?q=${aiQuery}`,
    Icon: function (props) {
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 10 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          {...props}
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="m1.5 0 3.27 2.95V.08h.6v2.87L8.65 0v3.36H10V8.4H8.65V12L5.37 8.82v3.07h-.6V8.84L1.55 12 1.5 8.35H0v-5h1.5zm.59 3.36h2.24L2.1 1.34zm2.25.59H.6v3.8h.9v-1zm.43.41L2.09 7l.04 3.6 2.64-2.58zm.6 0V8l2.69 2.6V7zm.42-.41 2.86 2.8V7.8h.75V3.95zm.01-.6h2.26V1.38h-.04z"
            fill="currentColor"
          />
        </svg>
      );
    },
  },
  {
    name: 'Grok',
    href: `https://grok.com/?q=${aiQuery}`,
    Icon: function (props) {
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          {...props}
        >
          <path
            d="m4.62 7.62 4.04-3.08c.2-.15.49-.1.58.14a3.5 3.5 0 0 1-.71 3.74 3.2 3.2 0 0 1-3.63.74l-1.37.66a4.45 4.45 0 0 0 5.86-.5 4.8 4.8 0 0 0 1.21-4.4c-.5-2.2.13-3.1 1.4-4.9Q12 0 11.98 0L10.4 1.62z"
            fill="currentColor"
          />
          <path
            d="M3.82 3.57c-1.2 1.24-1.45 3.4-.03 4.8L.01 11.83q-.02.02-.02-.02.36-.45.76-.87l.02-.02c.85-.93 1.7-1.85 1.18-3.14a4.8 4.8 0 0 1 1-5.1 4.45 4.45 0 0 1 5.87-.51l-1.37.65a3.3 3.3 0 0 0-3.64.75"
            fill="currentColor"
          />
        </svg>
      );
    },
  },
];

export function AskAiSection() {
  return (
    <div className="flex flex-wrap items-center gap-x-12 gap-y-8">
      <span className="text-mono-sm text-foreground-muted">
        {translate('common.footer.askAi')}
      </span>
      <div className="flex items-center gap-6">
        {aiBots.map(({ name, href, Icon }) => (
          <a
            key={name}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Ask about Annnimate on ${name}`}
            onClick={() => analytics.askAi.clicked(name.toLowerCase())}
            className="inline-flex size-28 items-center justify-center border border-foreground/10 text-foreground-muted transition-colors duration-300 ease-out hover:border-foreground/30 hover:text-foreground"
          >
            <Icon />
          </a>
        ))}
      </div>
    </div>
  );
}
