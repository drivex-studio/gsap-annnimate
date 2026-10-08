'use client';

import React, { Suspense } from 'react';
import { IconContext } from '@phosphor-icons/react';
import { Tooltip } from 'react-tooltip';

import { ToasterWrapper } from '@/components/ui/ToasterWrapper';
import { GridOverlay } from '@/components/ui/GridOverlay';
import { AttributionTracker } from '@/components/ui/AttributionTracker';
import { SubscriptionToastWrapper } from '@/components/ui/SubscriptionToastWrapper';

const iconConfig = {
  weight: 'fill'
};

export default function AppProviders({ children }) {
  return (
    <IconContext.Provider value={iconConfig}>
      {children}
      <AttributionTracker />
      <GridOverlay />
      <ToasterWrapper />
      <Suspense fallback={null}>
        <SubscriptionToastWrapper />
      </Suspense>
      <Tooltip id="tooltip" className="z-[60] !opacity-100 max-w-sm shadow-lg" />
    </IconContext.Provider>
  );
}
