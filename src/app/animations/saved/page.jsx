import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import AnimationsPage from '@/components/animations/AnimationsPage';
import { getPublishedAnimations } from '@/libs/supabase/latestAnimation';
import { getViewerContext } from '@/libs/supabase/server';

export const metadata = {
  title: 'Saved',
  robots: { index: false },
};

export default async function SavedAnimationsPage() {
  const viewer = await getViewerContext();
  if (!viewer.user) redirect('/login?redirectTo=/animations/saved');

  const all = await getPublishedAnimations();
  const saved = all.filter((a) => viewer.savedIds.includes(a.id));

  return (
    <Suspense fallback={null}>
      <AnimationsPage
        initialAnimations={saved}
        savedAnimationIds={viewer.savedIds}
        isAuthenticated
      />
    </Suspense>
  );
}
