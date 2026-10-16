'use client';

import React, { useEffect, useState } from 'react';

import { t } from '@/libs/utils/i18n';

export function StudioClock() {
  const [currentTime, setCurrentTime] = useState(null);

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Vienna',
    });

    const updateClock = () => setCurrentTime(formatter.format(new Date()));
    updateClock();

    const intervalId = setInterval(updateClock, 30000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <span className="text-mono-sm text-foreground-muted">
      {currentTime ? t('common.footer.studioClock', { time: currentTime }) : ''}
    </span>
  );
}
