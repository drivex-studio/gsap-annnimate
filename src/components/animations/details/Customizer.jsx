"use client";

import React, { useMemo, useRef } from 'react';
import { analytics } from '@/libs/utils/analytics';
import { ONBOARDING_EVENTS } from '@/libs/config/onboarding';
import Select from '@/components/ui/Select';
import Switch from '@/animations/shared/Switch';
import Button from '@/components/ui/Button';
import NumberInput from '@/animations/components/AnimatedNumber';
import Dropdown from '@/animations/shared/EasingSelect';
import ServerData, { effectiveCyclePrice } from '@/libs/auth/data/ServerData';

const VALID_TYPES = new Set(['number', 'float', 'boolean', 'select', 'color']);

export function getConfigurables(animation) {
  const attributes = animation?.attributes;
  const configurables = attributes?.attributes?.configurables || attributes?.configurables || [];
  return Array.isArray(configurables) ? configurables.filter(isValidConfigurable) : [];
}

function isValidConfigurable(config) {
  if (!config || !config.attribute) return false;
  
  const type = String(config.type || '').toLowerCase();
  if (!VALID_TYPES.has(type)) return false;
  
  if (type === 'number' || type === 'float') {
    return (
      Number.isFinite(Number(config.min)) &&
      Number.isFinite(Number(config.max)) &&
      config.value !== '' &&
      Number.isFinite(Number(config.value))
    );
  }
  
  if (type === 'select') {
    return Array.isArray(config.options) && config.options.length > 1 && config.options.includes(config.value);
  }
  
  if (type === 'boolean') {
    const val = String(config.value).toLowerCase();
    return val === 'true' || val === 'false';
  }
  
  if (type === 'color') {
    return /^#[0-9a-fA-F]{3,8}$/.test(String(config.value || ''));
  }
  
  return false;
}

function toCamelCase(attributeName) {
  return String(attributeName || '')
    .replace(/^data-anm-/, '')
    .replace(/-([a-z0-9])/g, (_, letter) => letter.toUpperCase());
}

function formatValueForCode(value, type) {
  const t = String(type || '').toLowerCase();
  
  if (t === 'number' || t === 'float') {
    const num = Number(value);
    return Number.isFinite(num) ? String(num) : null;
  }
  
  if (t === 'boolean') {
    return value === true || value === 'true' ? 'true' : 'false';
  }
  
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

const VALUE_REGEX_PART = "('[^']*'|\"[^\"]*\"|[^,}\\s][^,}]*)";

function escapeRegExp(string) {
  return String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function applyValuesToHtml(code, values, primaryAttribute) {
  let html = String(code || '');
  if (!html) return html;

  for (const [key, value] of Object.entries(values || {})) {
    if (value == null || value === '') continue;
    
    const valStr = String(value);
    const existingAttrRegex = new RegExp(`(?<![-\\w])${escapeRegExp(key)}\\s*=\\s*"[^"]*"`);
    
    if (existingAttrRegex.test(html)) {
      html = html.replace(existingAttrRegex, () => `${key}="${valStr}"`);
    } else {
      const primaryAttrRegex = new RegExp(`(?<![-\\w])${escapeRegExp(primaryAttribute)}(\\s*=\\s*"[^"]*")?`);
      html = html.replace(primaryAttrRegex, match => `${match} ${key}="${valStr}"`);
    }
  }
  
  return html;
}

export function applyValuesToReact(code, values, configurablesList) {
  let reactCode = String(code || '');
  if (!reactCode) return reactCode;

  const componentMatch = reactCode.match(/export default function \w+\s*\(\s*\{[\s\S]*?\}\s*\)/);
  if (!componentMatch) return reactCode;

  let signature = componentMatch[0];

  for (const [key, value] of Object.entries(values || {})) {
    if (value == null || value === '') continue;
    
    const config = (configurablesList || []).find(c => c.attribute === key);
    const formattedValue = formatValueForCode(value, config?.type);
    
    if (formattedValue == null) continue;
    
    const camelKey = toCamelCase(key);
    const propRegex = new RegExp(`(\\b${escapeRegExp(camelKey)}\\s*=\\s*)${VALUE_REGEX_PART}`);
    
    signature = signature.replace(propRegex, (_, prefix) => `${prefix}${formattedValue}`);
  }

  return reactCode.replace(componentMatch[0], () => signature);
}

export function applyValuesToVue(code, values, configurablesList) {
  let vueCode = String(code || '');
  if (!vueCode) return vueCode;

  for (const [key, value] of Object.entries(values || {})) {
    if (value == null || value === '') continue;
    
    const config = (configurablesList || []).find(c => c.attribute === key);
    const formattedValue = formatValueForCode(value, config?.type);
    
    if (formattedValue == null) continue;
    
    const camelKey = toCamelCase(key);
    const propRegex = new RegExp(`(\\b${escapeRegExp(camelKey)}\\s*:\\s*\\{[^}]*?\\bdefault:\\s*)${VALUE_REGEX_PART}`);
    
    vueCode = vueCode.replace(propRegex, (_, prefix) => `${prefix}${formattedValue}`);
  }
  
  return vueCode;
}

export const CUSTOMIZE_MIN_CONFIGURABLES = 0;

export function countUsableConfigurables(animation) {
  return getConfigurables(animation).length;
}

export function getAnmApiName(slug) {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

export function getPrimaryAttribute(animation) {
  const attributes = animation?.attributes;
  const selectors = attributes?.attributes?.selectors || attributes?.selectors || [];
  const primarySelector = selectors.find(s => s?.required && s?.attribute) || selectors[0];
  return primarySelector?.attribute || `data-anm-${animation?.slug || ''}`;
}

function ConfigurableControl({ configurable, value, onChange, onCommit, disabled = false }) {
  const type = String(configurable.type || '').toLowerCase();
  const currentValue = value ?? configurable.value ?? '';
  
  const label = String(configurable.name || configurable.attribute.replace(/^data-anm-/, ''))
    .replace(/[-_]+/g, ' ')
    .replace(/^\w/, letter => letter.toUpperCase());

  if (type === 'number' || type === 'float') {
    return (
      <li title={configurable.description || undefined}>
        <NumberInput
          label={label}
          value={Number(currentValue)}
          min={configurable.min}
          max={configurable.max}
          step={Number(configurable.step) || (type === 'float' ? 0.05 : 1)}
          disabled={disabled}
          onChange={val => onChange(configurable.attribute, val)}
          onCommit={val => onCommit?.(configurable.attribute, val)}
        />
      </li>
    );
  }

  return (
    <li
      title={configurable.description || undefined}
      className={`flex h-40 items-center justify-between gap-12 border border-foreground/[0.08] bg-foreground/[0.04] pl-12 pr-6 ${disabled ? 'opacity-45' : ''}`}
    >
      <span className="truncate text-body-sm text-foreground/80">{label}</span>
      
      {type === 'boolean' ? (
        <Switch
          checked={String(currentValue) === 'true'}
          disabled={disabled}
          onChange={val => {
            onChange(configurable.attribute, String(val));
            onCommit?.(configurable.attribute, String(val));
          }}
          label={label}
        />
      ) : type === 'select' && /ease/i.test(configurable.attribute) ? (
        <Dropdown
          value={String(currentValue)}
          disabled={disabled}
          onChange={val => {
            onChange(configurable.attribute, val);
            onCommit?.(configurable.attribute, val);
          }}
          align="right"
          ariaLabel={label}
          className="w-[55%] shrink-0"
        />
      ) : type === 'select' ? (
        <Select
          value={String(currentValue)}
          disabled={disabled}
          onChange={val => {
            onChange(configurable.attribute, val);
            onCommit?.(configurable.attribute, val);
          }}
          options={(configurable.options || []).map(opt => ({
            value: String(opt),
            label: String(opt)
          }))}
          size="sm"
          labelSize="xs"
          align="right"
          ariaLabel={label}
          className="max-w-[55%] shrink-0"
        />
      ) : type === 'color' ? (
        <span className="flex shrink-0 items-center gap-8">
          <input
            type="color"
            aria-label={label}
            className="size-20 cursor-pointer border border-foreground/15 bg-transparent p-0"
            value={/^#/.test(String(currentValue)) ? String(currentValue) : '#ffffff'}
            disabled={disabled}
            onChange={e => {
              onChange(configurable.attribute, e.target.value);
              onCommit?.(configurable.attribute, e.target.value);
            }}
          />
          <span className="border border-foreground/10 bg-background/60 px-8 py-2 text-[12px] tabular-nums text-foreground-muted">
            {String(currentValue)}
          </span>
        </span>
      ) : null}
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
  className = ''
}) {
  const configurablesList = useMemo(() => getConfigurables(animation), [animation]);
  const trackedRef = useRef(false);

  if (configurablesList.length === 0) return null;

  const handleChange = (key, val) => {
    if (!trackedRef.current) {
      trackedRef.current = true;
      analytics.track('customize_used', {
        animation_slug: animation.slug,
        locked_state: locked
      });
      window.dispatchEvent(
        new CustomEvent(ONBOARDING_EVENTS.tuned, {
          detail: { slug: animation.slug }
        })
      );
    }
    onChange?.(key, val);
  };

  const handleCommit = (key, val) => onCommit?.(key, val);

  const availableControls = locked ? configurablesList.slice(0, 3) : configurablesList;
  const lockedControls = locked ? configurablesList.slice(3) : [];
  
  const hasCustomValues = Object.keys(values).length > 0;
  
  const soloPlan = ServerData.stripe?.landingPlans?.find(plan => plan.key === 'solo');
  const price = effectiveCyclePrice(soloPlan?.quarterly);

  return (
    <div className={`flex flex-col gap-12 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-h5 font-medium text-foreground">Customize</p>
        {hasCustomValues && (
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
        {availableControls.map(config => (
          <ConfigurableControl
            key={config.attribute}
            configurable={config}
            value={values[config.attribute]}
            onChange={handleChange}
            onCommit={handleCommit}
          />
        ))}
      </ul>
      
      {lockedControls.length > 0 && (
        <div className="relative min-h-[150px]">
          <ul
            aria-hidden="true"
            className="pointer-events-none m-0 flex list-none flex-col gap-8 p-0 select-none"
          >
            {lockedControls.slice(0, 4).map(config => (
              <ConfigurableControl
                key={config.attribute}
                configurable={config}
                value={undefined}
                onChange={() => {}}
                disabled={true}
              />
            ))}
          </ul>
          <div
            className="absolute inset-0 flex flex-col items-start justify-end gap-10"
            style={{ background: 'linear-gradient(to bottom, transparent, var(--background) 62%)' }}
          >
            <p className="text-body-sm text-foreground">
              Members customize everything
              {lockedControls.length > 4 ? ` - ${lockedControls.length} more controls.` : '.'}
            </p>
            <Button
              href={`/checkout?plan=solo&cycle=quarterly${animation?.slug ? `&component=${animation.slug}` : ''}`}
              onClick={() => analytics.track('customize_unlock_clicked', { animation_slug: animation.slug })}
              theme="surface"
              size="xs"
            >
              {price ? `Unlock everything - €${price}/mo` : 'Unlock everything'}
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
