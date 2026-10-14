"use client";

import { useMemo, useRef } from 'react';
import { effectiveCyclePrice, default as pricing } from '@/libs/auth/data/ServerData';

import { analytics } from '@/libs/utils/analytics';
import { ONBOARDING_EVENTS } from '@/libs/config/onboarding';

import AnimatedNumber from '@/animations/components/AnimatedNumber';
import Select from '@/components/ui/Select';
import Switch from '@/animations/shared/Switch';
import EasingSelect from '@/animations/shared/EasingSelect';
import Button from '@/components/ui/Button';
import { getConfigurables } from '@/libs/utils/CONFIGURABLES';

function ConfigurableItem({
  configurable,
  value,
  onChange,
  onCommit,
  disabled = false,
}) {
  const type = String(configurable.type || '').toLowerCase();
  const currentValue = value ?? configurable.value ?? '';

  const label = String(
    configurable.name ||
      configurable.attribute.replace(/^data-anm-/, '')
  )
    .replace(/[-_]+/g, ' ')
    .replace(/^\w/, (character) => character.toUpperCase());

  if (type === 'number' || type === 'float') {
    return (
      <li title={configurable.description || undefined}>
        <AnimatedNumber
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
        <Switch
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
        <EasingSelect
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
            value={/^#/.test(String(currentValue)) ? String(currentValue) : '#ffffff'}
            disabled={disabled}
            onChange={(event) => {
              const nextValue = event.target.value;
              onChange(configurable.attribute, nextValue);
              onCommit?.(configurable.attribute, nextValue);
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

export default function Customizer({
  animation,
  values = {},
  onChange,
  onCommit,
  onReset,
  locked = false,
  className = '',
}) {
  const configurables = useMemo(
    () => getConfigurables(animation),
    [animation]
  );

  const hasTrackedUsage = useRef(false);

  if (configurables.length === 0) return null;

  const handleChange = (attribute, value) => {
    if (!hasTrackedUsage.current) {
      hasTrackedUsage.current = true;

      analytics.track('customize_used', {
        animation_slug: animation.slug,
        locked_state: locked,
      });

      window.dispatchEvent(
        new CustomEvent(ONBOARDING_EVENTS.tuned, {
          detail: {
            slug: animation.slug,
          },
        })
      );
    }

    onChange?.(attribute, value);
  };

  const handleCommit = (attribute, value) => {
    onCommit?.(attribute, value);
  };

  const visibleConfigurables = locked
    ? configurables.slice(0, 3)
    : configurables;

  const lockedConfigurables = locked
    ? configurables.slice(3)
    : [];

  const hasValues = Object.keys(values).length > 0;

  const quarterlyPrice = effectiveCyclePrice(
    pricing.stripe?.landingPlans?.find((plan) => plan.key === 'solo')
      ?.quarterly
  );

  return (
    <div className={`flex flex-col gap-12 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-h5 font-medium text-foreground">Customize</p>

        {hasValues && (
          <button
            type="button"
            onClick={onReset}
            className="text-body-sm text-foreground-muted underline-offset-4 transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:text-foreground hover:underline"
          >
            Reset
          </button>
        )}
      </div>

      <ul className="m-0 flex list-none flex-col gap-8 p-0">
        {visibleConfigurables.map((configurable) => (
          <ConfigurableItem
            key={configurable.attribute}
            configurable={configurable}
            value={values[configurable.attribute]}
            onChange={handleChange}
            onCommit={handleCommit}
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
              <ConfigurableItem
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

            <Button
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
            </Button>

            <p className="text-accent-xs text-foreground-muted">
              Cancel anytime · 14-day money-back
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
