'use client';

import { useState, useRef } from 'react';

import { toast } from 'sonner';
import { CaretDown } from '@phosphor-icons/react';
import { CaretUp } from '@phosphor-icons/react';
import { Check } from '@phosphor-icons/react';

function formatAttributeName(rawName = '') {
  return rawName.startsWith('data-anm-') ? rawName : `data-anm-${rawName}`;
}

function formatDefaultValue(value) {
  if (value == null) return '—';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string' && value === '') return '""';
  return String(value);
}

function extractAttributes(animation) {
  const rawAttributes = animation?.attributes;
  if (!rawAttributes) return [];
  if (Array.isArray(rawAttributes)) return rawAttributes;
  return [
    ...(rawAttributes?.attributes?.selectors || rawAttributes?.selectors || []),
    ...(rawAttributes?.attributes?.configurables ||
      rawAttributes?.configurables ||
      []),
  ];
}

function AttributesTable({ attributes = [] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedAttr, setCopiedAttr] = useState(null);
  const copyTimeoutRef = useRef(null);

  if (!attributes || attributes.length === 0) return null;

  const visibleAttributes = isExpanded ? attributes : attributes.slice(0, 5);
  const hasMore = attributes.length > 5;
  const hiddenCount = attributes.length - 5;

  const handleCopy = async (attrName) => {
    try {
      await navigator.clipboard.writeText(attrName);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      setCopiedAttr(attrName);
      toast.success(`Copied: ${attrName}`);
      copyTimeoutRef.current = setTimeout(() => setCopiedAttr(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="border border-foreground/10">
      <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)_minmax(0,0.6fr)_minmax(0,2fr)] gap-12 border-b border-foreground/10 bg-foreground/[0.04] px-16 py-10 md:grid">
        <span className="text-accent-xs text-foreground-muted">Attribute</span>
        <span className="text-accent-xs text-foreground-muted">Type</span>
        <span className="text-accent-xs text-foreground-muted">Default</span>
        <span className="text-accent-xs text-foreground-muted">
          Description
        </span>
      </div>

      <ul className="m-0 list-none divide-y divide-foreground/10 p-0">
        {visibleAttributes.map((attr, index) => {
          const attrName = formatAttributeName(
            attr.name || attr.attribute || ''
          );
          const isCopied = copiedAttr === attrName;

          return (
            <li
              key={attrName + index}
              className="flex flex-col gap-8 px-16 py-12 md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)_minmax(0,0.6fr)_minmax(0,2fr)] md:items-start md:gap-12"
            >
              <div className="flex flex-wrap items-center gap-8">
                <button
                  type="button"
                  onClick={() => handleCopy(attrName)}
                  title="Click to copy"
                  className="text-[11px] flex items-center gap-6 bg-foreground/[0.06] px-8 py-4 font-mono normal-case text-foreground transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:bg-foreground/[0.10]"
                >
                  {isCopied ? (
                    <>
                      <span>Copied</span>
                      <Check size={12} className="text-brand" />
                    </>
                  ) : (
                    <span>{attrName}</span>
                  )}
                </button>
                {attr.required && (
                  <span className="text-accent-2xs bg-brand px-6 py-2 font-medium text-[#141314]">
                    Required
                  </span>
                )}
              </div>

              <span className="text-accent-2xs normal-case text-foreground-muted md:pt-8">
                {attr.type || 'string'}
              </span>

              <span className="text-[11px] font-mono text-foreground-muted md:pt-8">
                {formatDefaultValue(attr.default)}
              </span>

              <p className="text-body-sm leading-relaxed text-foreground-muted">
                {attr.description}
              </p>
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-accent-xs flex w-full items-center justify-center gap-6 border-t border-foreground/10 bg-foreground/[0.04] py-10 text-foreground-muted transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:text-foreground"
        >
          {isExpanded ? (
            <>
              <CaretUp size={12} />
              Show less
            </>
          ) : (
            <>
              <CaretDown size={12} />
              Show {hiddenCount} more
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default function AnimationAttributes({ animation }) {
  const normalizedAttributes = extractAttributes(animation);

  if (normalizedAttributes.length === 0) return null;

  return (
    <section className="border-t border-foreground/10 pt-32">
      <span className="text-accent-xs text-foreground-muted">Attributes</span>
      <h2 className="text-h4 mt-12 text-foreground">Tune it.</h2>
      <div className="mt-16">
        <AttributesTable attributes={normalizedAttributes} />
      </div>
    </section>
  );
}
