'use client';

// module id: 135178

import { useMemo, useRef } from 'react';

import { analytics } from '@/libs/auth/analytics'; // TODO: verify original export
import { ONBOARDING_EVENTS } from '@/libs/config/onboarding'; // TODO: verify original path
import { effectiveCyclePrice } from '@/libs/config/siteConfig'; // TODO: verify original path

import RangeSlider from '@/components/common/RangeSlider'; // module id: 125303
import Toggle from '@/animations/shared/Switch'; // module id: 870777
import Select from '@/components/ui/Select'; // module id: 977805
import EaseSelect from '@/animations/shared/EasingSelect'; // module id: 666542
import AnimatedButton from '@/components/ui/Button'; // module id: 687989
import { getConfigurables } from '@/libs/utils/CONFIGURABLES';

// TODO: Original module IDs 943348, 734601, 516799 and
// 125303/870777/977805/687989/666542 should be checked against
// the actual project module map before finalizing import paths.
// Module 516799 exports effectiveCyclePrice and default pricing data.

function ConfigurableControl({
  configurable,
  value,
  onChange,
  onCommit,
  disabled = false,
}) {
  const type = String(configurable.type || '').toLowerCase();
  const currentValue = value ?? configurable.value ?? '';

  const label =
    configurable.label ||
    String(
      configurable.name ||
        configurable.attribute.replace(/^data-anm-/, '')
    )
      .replace(/[-_]+/g, ' ')
      .replace(/^\w/, (character) => character.toUpperCase());

  if (type === 'number' || type === 'float') {
    return (
      <li title={configurable.description || undefined}>
        <RangeSlider
          label={label}
          value={Number(currentValue)}
          min={configurable.min}
          max={configurable.max}
          step={Number(configurable.step) || (type === 'float' ? 0.05 : 1)}
          disabled={disabled}
          onChange={(nextValue) =>
            onChange(configurable.attribute, nextValue)
          }
          onCommit={(nextValue) =>
            onCommit?.(configurable.attribute, nextValue)
          }
        />
      </li>
    );
  }

  return (
    <li
      title={configurable.description || undefined}
      className={`flex h-40 items-center justify-between gap-12 border border-foreground/[0.08] bg-foreground/[0.04] pl-12 pr-6 ${
        disabled ? 'opacity-45' : ''
      }`}
    >
      <span className="truncate text-body-sm text-foreground/80">
        {label}
      </span>

      {type === 'boolean' && (
        <Toggle
          checked={String(currentValue) === 'true'}
          disabled={disabled}
          onChange={(nextValue) => {
            onChange(configurable.attribute, String(nextValue));
            onCommit?.(configurable.attribute, String(nextValue));
          }}
          label={label}
        />
      )}

      {type === 'select' && /ease/i.test(configurable.attribute) && (
        <EaseSelect
          value={String(currentValue)}
          disabled={disabled}
          onChange={(nextValue) => {
            onChange(configurable.attribute, nextValue);
            onCommit?.(configurable.attribute, nextValue);
          }}
          align="right"
          ariaLabel={label}
          className="w-[55%] shrink-0"
        />
      )}

      {type === 'select' && !/ease/i.test(configurable.attribute) && (
        <Select
          value={String(currentValue)}
          disabled={disabled}
          onChange={(nextValue) => {
            onChange(configurable.attribute, nextValue);
            onCommit?.(configurable.attribute, nextValue);
          }}
          options={(configurable.options || []).map((option) => ({
            value: String(option),
            label: String(option),
          }))}
          size="sm"
          labelSize="xs"
          align="right"
          ariaLabel={label}
          className="max-w-[55%] shrink-0"
        />
      )}

      {type === 'color' && (
        <span className="flex shrink-0 items-center gap-8">
          <input
            type="color"
            aria-label={label}
            className="size-20 cursor-pointer border border-foreground/15 bg-transparent p-0"
            value={/^#/.test(String(currentValue))
              ? String(currentValue)
              : '#ffffff'}
            disabled={disabled}
            onChange={(event) => {
              onChange(configurable.attribute, event.target.value);
              onCommit?.(configurable.attribute, event.target.value);
            }}
          />

          <span className="border border-foreground/10 bg-background/60 px-8 py-2 text-[12px] tabular-nums text-foreground-muted">
            {String(currentValue)}
          </span>
        </span>
      )}
    </li>
  );
}

// module id: 135178
export default function AnimationControls({
  animation,
  values = {},
  onChange,
  onCommit,
  onReset,
  locked = false,
  only = null,
  className = '',
}) {
  const hasTrackedCustomization = useRef(false);

  const configurables = useMemo(() => {
    const allConfigurables = getConfigurables(animation);

    return only
      ? only
          .map(({ attribute, label }) => {
            const configurable = allConfigurables.find(
              (item) => item.attribute === attribute
            );

            return configurable
              ? { ...configurable, label }
              : null;
          })
          .filter(Boolean)
      : allConfigurables;
  }, [animation, only]);

  if (configurables.length === 0) return null;

  const handleChange = (attribute, value) => {
    if (!hasTrackedCustomization.current) {
      hasTrackedCustomization.current = true;

      analytics.track('customize_used', {
        animation_slug: animation.slug,
        locked_state: locked,
      });

      window.dispatchEvent(
        new CustomEvent(ONBOARDING_EVENTS.tuned, {
          detail: { slug: animation.slug },
        })
      );
    }

    onChange?.(attribute, value);
  };

  const visibleConfigurables = locked
    ? configurables.slice(0, 3)
    : configurables;

  const lockedConfigurables = locked
    ? configurables.slice(3)
    : [];

  const hasValues = Object.keys(values).length > 0;

  // TODO: Restore the exact pricing calculation after verifying
  // the original module 516799 export and data structure.
  const quarterlyPrice = null;

  return (
    <div className={`flex flex-col gap-12 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-h5 font-medium text-foreground">
          Customize
        </p>

        {hasValues && (
          <AnimatedButton
            type="button"
            onClick={onReset}
            className="text-body-sm text-foreground-muted underline-offset-4 transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:text-foreground hover:underline"
          >
            Reset
          </AnimatedButton>
        )}
      </div>

      <ul className="m-0 flex list-none flex-col gap-8 p-0">
        {visibleConfigurables.map((configurable) => (
          <ConfigurableControl
            key={configurable.attribute}
            configurable={configurable}
            value={values[configurable.attribute]}
            onChange={handleChange}
            onCommit={onCommit}
          />
        ))}
      </ul>

      {lockedConfigurables.length > 0 && (
        <div className="relative min-h-[150px]">
          <ul
            aria-hidden="true"
            className="pointer-events-none m-0 flex list-none flex-col gap-8 p-0 select-none"
          >
            {lockedConfigurables.slice(0, 4).map((configurable) => (
              <ConfigurableControl
                key={configurable.attribute}
                configurable={configurable}
                value={undefined}
                onChange={() => {}}
                disabled
              />
            ))}
          </ul>

          <div
            className="absolute inset-0 flex flex-col items-start justify-end gap-10"
            style={{
              background:
                'linear-gradient(to bottom, transparent, var(--background) 62%)',
            }}
          >
            <p className="text-body-sm text-foreground">
              Members customize everything
              {lockedConfigurables.length > 4
                ? ` - ${lockedConfigurables.length} more controls.`
                : '.'}
            </p>

            <AnimatedButton
              href={`/checkout?plan=solo&cycle=quarterly${
                animation?.slug ? `&component=${animation.slug}` : ''
              }`}
              onClick={() =>
                analytics.track('customize_unlock_clicked', {
                  animation_slug: animation.slug,
                })
              }
              theme="surface"
              size="xs"
            >
              {quarterlyPrice
                ? `Unlock everything - €${quarterlyPrice}/mo`
                : 'Unlock everything'}
            </AnimatedButton>

            <p className="text-accent-xs text-foreground-muted">
              Cancel anytime · 14-day money-back
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

