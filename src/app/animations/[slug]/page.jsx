import { notFound } from 'next/navigation';
import AnimationDetail from '@/components/animations/AnimationDetail';
import { getAnimationBySlug } from '@/libs/supabase/latestAnimation';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const animation = await getAnimationBySlug(slug);
  return { title: animation?.title ?? 'Animation' };
}

export default async function AnimationPage({ params }) {
  const { slug } = await params;
  const animation = await getAnimationBySlug(slug);
  if (!animation) notFound();
  return <AnimationDetail animation={animation} />;
}
