'use client';

import React from 'react';

import { t } from '@/libs/utils/i18n';

import StatusIndicator from '@/components/ui/StatusIndicator'; // module id: 400545
import FooterLink from '@/components/navigation/NavLink'; // module id: 520237

function formatRelativeTime(dateString) {
  if (!dateString) {
    return null;
  }

  const timestamp = new Date(dateString).getTime();
  if (Number.isNaN(timestamp)) {
    return null;
  }

  const diffDays = Math.floor((Date.now() - timestamp) / 86400000);
  if (diffDays <= 0) {
    return t('common.footer.relativeTime.today');
  }
  if (diffDays === 1) {
    return t('common.footer.relativeTime.yesterday');
  }
  if (diffDays < 7) {
    return t('common.footer.relativeTime.daysAgo', { n: diffDays });
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1
      ? t('common.footer.relativeTime.weekAgo')
      : t('common.footer.relativeTime.weeksAgo', { n: weeks });
  }

  const months = Math.floor(diffDays / 30);
  return months === 1
    ? t('common.footer.relativeTime.monthAgo')
    : t('common.footer.relativeTime.monthsAgo', { n: months });
}

export function FooterStatus({ latest }) {
  const relativeTime = formatRelativeTime(latest?.published_at);
  const title = latest?.title;
  const slug = latest?.slug;

  return (
    <div className="text-mono-sm flex flex-wrap items-center gap-x-12 gap-y-4 text-foreground-muted">
      <StatusIndicator className="size-12" />
      {title && slug ? (
        <>
          <span>{t('common.footer.status.justShipped')}</span>
          <FooterLink
            href={`/animations/${slug}`}
            variant="nav"
            className="text-mono-sm -mx-12 -my-6 text-foreground"
          >
            {title}
          </FooterLink>
          {relativeTime ? (
            <>
              <span className="opacity-40">·</span>
              <span>{relativeTime}</span>
            </>
          ) : null}
        </>
      ) : (
        <span>{t('common.footer.status.default')}</span>
      )}
    </div>
  );
}
