'use client';
import React, { useEffect, useRef } from 'react';
import { useUser } from '@/providers/UserProvider';
import { captureFirstTouch, collectAttribution } from '@/libs/auth/getTouchData';

export function AttributionTracker() {
  let { user, profile } = useUser();
  let hasBackfilled = useRef(false);

  useEffect(() => {
    captureFirstTouch();
  }, []);

  useEffect(() => {
    if (!user || !profile || hasBackfilled.current || profile.ft_at || profile.ft_channel) return;
    
    let createdAt = profile.created_at ? new Date(profile.created_at).getTime() : 0;
    
    if (!createdAt || Date.now() - createdAt > 604800000) {
      hasBackfilled.current = true;
      fetch('/api/attribution/backfill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(collectAttribution())
      }).catch(() => {});
    }
  }, [user, profile]);

  return null;
}
