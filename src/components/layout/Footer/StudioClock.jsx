"use client";
import React, { useState, useEffect } from 'react';
import { translate } from '@/libs/utils/i18n';

export function StudioClock() {
  const [timeStr, setTimeStr] = useState(null);

  useEffect(() => {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Vienna',
    });

    const updateTime = () => setTimeStr(formatter.format(new Date()));
    updateTime();

    const intervalId = setInterval(updateTime, 30000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <span className="text-mono-sm text-foreground-muted">
      {timeStr ? translate('common.footer.studioClock', { time: timeStr }) : ''}
    </span>
  );
}
