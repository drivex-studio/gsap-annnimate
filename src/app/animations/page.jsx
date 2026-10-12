import { Suspense } from 'react';
import AnimationPage from '@/components/animations/AnimationPage';
import { getPublishedAnimations } from '@/libs/supabase/latestAnimation';

export const revalidate = 60;

export const metadata = {
  title: 'Library',
};

export default async function AnimationsPage() {
  const animations = await getPublishedAnimations();
  return (
    <Suspense fallback={null}>
      <AnimationPage initialAnimations={animations} />
    </Suspense>
  );
}
