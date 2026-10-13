// src/app/animations/[slug]/[framework]/page.jsx
import { notFound } from 'next/navigation';
import DetailPage from '@/components/animations/details/DetailPage';
import { getAnimationBySlug, getPublishedAnimations } from '@/libs/supabase/latestAnimation';
import { getViewerContext } from '@/libs/supabase/server';
import {
  FRAMEWORKS,
  normalizeAnimation,
  lockCode,
  getAvailableFormats,
  pickRelated,
} from '@/libs/supabase/animationDetail';

const LABELS = { react: 'React', vue: 'Vue', html: 'HTML/CSS/JS' };

export async function generateMetadata({ params }) {
  const { slug, framework } = await params;
  if (!FRAMEWORKS.includes(framework)) return {};
  const row = await getAnimationBySlug(slug);
  if (!row) return { title: 'Not found' };

  return {
    title: `${row.title} in ${LABELS[framework]}`,
    description: row.description || undefined,
    // The base page is the canonical one; this is a framework-specific view of it.
    alternates: { canonical: `/animations/${row.slug}` },
  };
}

export default async function AnimationFrameworkPage({ params }) {
  const { slug, framework } = await params;
  if (!FRAMEWORKS.includes(framework)) notFound();

  const [row, all, viewer] = await Promise.all([
    getAnimationBySlug(slug),
    getPublishedAnimations(),
    getViewerContext(),
  ]);

  if (!row) notFound();

  const normalized = normalizeAnimation(row);
  const formats = getAvailableFormats(normalized);
  if (!formats.includes(framework)) notFound();

  const animation = lockCode(normalized, viewer.hasAccess);

  return (
    <DetailPage
      animation={animation}
      isSaved={viewer.savedIds.includes(animation.id)}
      relatedAnimations={pickRelated(all, animation)}
      currentUserSavedAnimations={viewer.savedIds.map((id) => ({ animation_id: id }))}
      availableFormats={formats}
      totalCount={all.length}
    />
  );
}
