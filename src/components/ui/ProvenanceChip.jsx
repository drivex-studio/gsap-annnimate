import React from 'react';
import { cn } from '@/libs/utils/className';
import { getProvenanceLine } from '@/libs/utils/provenance';

const SIZES = {
  sm: {
    dot: "size-6",
    text: "text-accent-2xs",
    gap: "gap-6"
  },
  default: {
    dot: "size-8",
    text: "text-accent-xs",
    gap: "gap-8"
  },
  lg: {
    dot: "size-12",
    text: "text-mono-sm",
    gap: "gap-12"
  }
};

export default function ProvenanceChip({
  animation,
  size = "default",
  className = "",
  label
}) {
  let config = SIZES[size] ?? SIZES.default;
  let displayText = label ?? getProvenanceLine(animation);

  return (
    <span className={cn("inline-flex items-center text-foreground", config.text, config.gap, className)}>
      <span aria-hidden="true" className={cn("block shrink-0 bg-brand", config.dot)} />
      <span>{displayText}</span>
    </span>
  );
}
