import React from 'react';
import Button from '@/components/ui/Button';
import Link from '@/components/navigation/Link';

export default function EmptyState({ query, onReset, noun = "animations" }) {
  let headline = query ? `No matches for "${query}".` : `No ${noun} match those filters.`;

  return (
    <div className="v2-container py-128">
      <div className="grid grid-cols-12">
        <div className="col-span-12 lg:col-span-6 lg:col-start-4 lg:text-center">
          <p className="text-mono-sm mb-16 text-foreground-muted">0 results</p>
          <h2 className="text-h3 mb-16 font-medium">{headline}</h2>
          <p className="text-body text-foreground-muted mb-32">
            Try a shorter search or clear the filters.
            {query ? " If it should exist, tell us - requests steer what ships next." : ""}
          </p>
          <div className="flex flex-col items-center gap-16 lg:flex-row lg:justify-center lg:gap-24">
            <Button onClick={onReset} theme="light" size="sm">
              Reset filters
            </Button>
            {query ? (
              <Link href="/roadmap" className="text-foreground-muted">
                Suggest it on the roadmap
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
