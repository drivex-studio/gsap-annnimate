import { Suspense } from 'react';
import AnimationsPage from '@/components/animations/AnimationsPage';
import { getPublishedAnimations } from '@/libs/supabase/latestAnimation';

export const revalidate = 60;

export const metadata = {
  title: 'Library',
};

export default async function AnimationsLibraryPage() {
  const animations = await getPublishedAnimations();
  return (
    <Suspense fallback={null}>
      <AnimationsPage initialAnimations={animations} />
    </Suspense>
  );
}
