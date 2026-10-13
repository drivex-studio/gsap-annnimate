// module id: 120322
import React from 'react';
import { cn } from '@/libs/utils/className';
import Link from '@/components/navigation/Link';
import CodeSnippet from './CodeSnippet';
import DemoBlock from '@/components/animations/utils/DynamicInteractiveBlock'; // TODO: derived from module id 45119


const DEFAULT_LINK_SLUGS = new Set();

function renderInlineText(text = '', linkSlugs = DEFAULT_LINK_SLUGS) {
  let match;
  const regex = /\*\*([^*]+)\*\*|`([^`]+)`/g;
  const elements = [];
  let lastIndex = 0;
  let keyIndex = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index));
    }

    if (match[1] !== undefined) {
      const boldText = match[1];
      const slug = formatSlug(boldText);
      
      if (linkSlugs.has(slug)) {
        elements.push(
          <Link
            key={keyIndex}
            inline={true}
            href={`/animations/${slug}`}
            className="font-medium text-foreground"
          >
            {boldText}
          </Link>
        );
      } else {
        elements.push(<strong key={keyIndex}>{boldText}</strong>);
      }
    } else if (match[2] !== undefined) {
      elements.push(
        <code
          key={keyIndex}
          className="bg-foreground/[0.06] px-6 py-1 font-mono text-[0.85em] text-foreground"
        >
          {match[2]}
        </code>
      );
    }

    lastIndex = regex.lastIndex;
    keyIndex++;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return elements;
}

function formatSlug(text = '') {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function BlockList({ items = [], className }) {
  return (
    <ul className={cn('flex flex-col gap-12', className)}>
      {items.map((item, index) => (
        <li key={index} className="text-reading flex gap-12 text-foreground-reading">
          <span aria-hidden="true" className="mt-[0.55em] block size-6 shrink-0 bg-brand" />
          <span className="min-w-0">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function BlockNote({ title, children, tone = 'note', className }) {
  return (
    <div
      className={cn(
        'border-l-2 bg-foreground/[0.04] px-16 py-12',
        tone === 'warn' ? 'border-brand' : 'border-foreground/20',
        className
      )}
    >
      {title ? (
        <p className="text-body-sm font-medium text-foreground">{title}</p>
      ) : null}
      <div className="text-body-sm mt-4 leading-relaxed text-foreground-reading">
        {children}
      </div>
    </div>
  );
}

export function formatInline(text = '') {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="bg-foreground/[0.06] px-6 py-1 font-mono text-[0.85em] text-foreground">$1</code>');
}

const DEFAULT_SLUGS = new Set();

export function ContentBlock({ block, linkSlugs = DEFAULT_SLUGS }) {
  switch (block.type) {
    case 'prose':
      return (
        <p className="text-reading m-0 text-foreground-reading">
          {renderInlineText(block.text || '', linkSlugs)}
        </p>
      );
    case 'code':
      return (
        <CodeSnippet
          language={block.lang || 'javascript'}
          filename={block.filename}
          maxHeight={block.maxHeight || 'auto'}
        >
          {block.code}
        </CodeSnippet>
      );
    case 'list':
      return (
        <BlockList
          items={(block.items || []).map((item, index) => (
            <span key={index}>{renderInlineText(item, linkSlugs)}</span>
          ))}
        />
      );
    case 'note':
      return (
        <BlockNote title={block.title} tone={block.tone || 'note'}>
          <span>{renderInlineText(block.body || '', linkSlugs)}</span>
        </BlockNote>
      );
    case 'h3':
      return (
        <h3 className="text-h5 mt-16 m-0 text-foreground">
          {block.text}
        </h3>
      );
    case 'demo':
      return (
        <DemoBlock
          kind={block.kind}
          caption={block.caption}
          options={block.options}
        />
      );
    default:
      return null;
  }
}
