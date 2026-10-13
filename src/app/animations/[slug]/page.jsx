import { notFound } from 'next/navigation';
import DetailPage from '@/components/animations/details/DetailPage';
import { getAnimationBySlug, getPublishedAnimations } from '@/libs/supabase/latestAnimation';
import { getViewerContext } from '@/libs/supabase/server';
import {
  normalizeAnimation,
  lockCode,
  getAvailableFormats,
  pickRelated,
} from '@/libs/supabase/animationDetail';

const RESERVED = new Set(['saved']);

export async function generateMetadata({ params }) {
  const { slug } = await params;
  if (RESERVED.has(slug)) return {};
  const row = await getAnimationBySlug(slug);
  if (!row) return { title: 'Not found' };

  return {
    title: row.title,
    description: row.description || undefined,
    alternates: { canonical: `/animations/${row.slug}` },
    openGraph: {
      title: row.title,
      description: row.description || undefined,
      images: row.preview_image_url ? [row.preview_image_url] : undefined,
    },
  };
}

export default async function AnimationDetailPage({ params }) {
  const { slug } = await params;
  if (RESERVED.has(slug)) notFound();

  const [row, all, viewer] = await Promise.all([
    getAnimationBySlug(slug),
    getPublishedAnimations(),
    getViewerContext(),
  ]);

  if (!row) notFound();

  const animation = lockCode(normalizeAnimation(row), viewer.hasAccess);
  const related = pickRelated(all, animation);

  return (
    <DetailPage
      animation={animation}
      isSaved={viewer.savedIds.includes(animation.id)}
      relatedAnimations={related}
      currentUserSavedAnimations={viewer.savedIds.map((id) => ({ animation_id: id }))}
      availableFormats={getAvailableFormats(animation)}
      totalCount={all.length}
    />
  );
}
