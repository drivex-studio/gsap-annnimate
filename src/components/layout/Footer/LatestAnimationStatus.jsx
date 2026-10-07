import React from 'react';
import CustomLink from '@/components/ui/CustomLink';
import { translate as t } from '@/libs/utils/i18n';

export function LatestAnimationStatus({ latest }) {
  const getRelativeTime = function (dateStr) {
    if (!dateStr) return null;

    const time = new Date(dateStr).getTime();
    if (Number.isNaN(time)) return null;

    const daysDiff = Math.floor((Date.now() - time) / 86400000);

    if (daysDiff <= 0) return translate('common.footer.relativeTime.today');
    if (daysDiff === 1) return translate('common.footer.relativeTime.yesterday');
    if (daysDiff < 7) return translate('common.footer.relativeTime.daysAgo', { n: daysDiff });

    if (daysDiff < 30) {
      const weeks = Math.floor(daysDiff / 7);
      return weeks === 1
        ? translate('common.footer.relativeTime.weekAgo')
        : translate('common.footer.relativeTime.weeksAgo', { n: weeks });
    }

    const months = Math.floor(daysDiff / 30);
    return months === 1
      ? translate('common.footer.relativeTime.monthAgo')
      : translate('common.footer.relativeTime.monthsAgo', { n: months });
  };

  const relativeTime = getRelativeTime(latest?.published_at);
  const title = latest?.title;
  const slug = latest?.slug;

  return (
    <div className="text-mono-sm flex flex-wrap items-center gap-x-12 gap-y-4 text-foreground-muted">
      <span className="relative inline-flex h-12 w-12" aria-hidden="true">
        <span className="absolute inset-0 animate-ping bg-brand opacity-60" />
        <span className="relative inline-block h-12 w-12 bg-brand" />
      </span>
      {title && slug ? (
        <React.Fragment>
          <span>{translate('common.footer.status.justShipped')}</span>
          <CustomLink href={`/animations/${slug}`} className="text-mono-sm text-foreground">
            {title}
          </CustomLink>
          {relativeTime ? (
            <React.Fragment>
              <span className="opacity-40">·</span>
              <span>{relativeTime}</span>
            </React.Fragment>
          ) : null}
        </React.Fragment>
      ) : (
        <span>{translate('common.footer.status.default')}</span>
      )}
    </div>
  );
}
