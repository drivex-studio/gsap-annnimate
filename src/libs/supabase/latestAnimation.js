import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';

const FIELDS =
  'id, title, slug, category, preview_image_url, preview_video_url, published_at, content_updated_at, is_free_preview, metadata';
const DETAIL_FIELDS = `${FIELDS}, description, code_react, code_vue, code_html`;

const CATEGORY_LABELS = {
  button: 'Buttons',
  scroll: 'Scroll',
  'ui-component': 'UI Components',
  experimental: 'Experimental',
  shader: 'Shaders',
  menu: 'Menus',
  section: 'Sections',
};

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error('supabase: missing env vars');
    return null;
  }
  return createClient(url, key);
}

export const getPublishedAnimations = cache(async () => {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('animations')
    .select(FIELDS)
    .not('published_at', 'is', null)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('getPublishedAnimations:', error.message);
    return [];
  }
  return data ?? [];
});

export const getLatestAnimation = cache(async () => {
  const list = await getPublishedAnimations();
  return list[0] ?? null;
});

export const getCategories = cache(async () => {
  const list = await getPublishedAnimations();
  const seen = new Set(list.map((a) => a.category).filter(Boolean));
  return Object.keys(CATEGORY_LABELS)
    .filter((slug) => seen.has(slug))
    .map((slug) => ({ slug, name: CATEGORY_LABELS[slug] }));
});

export const getShippedRecently = cache(async () => {
  const list = await getPublishedAnimations();
  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return list.filter((a) => new Date(a.published_at).getTime() >= since).length;
});

export const getAnimationBySlug = cache(async (slug) => {
  const supabase = getSupabaseClient();
  if (!supabase || !slug) return null;

  const { data, error } = await supabase
    .from('animations')
    .select(DETAIL_FIELDS)
    .eq('slug', slug)
    .not('published_at', 'is', null)
    .maybeSingle();

  if (error) {
    console.error('getAnimationBySlug:', error.message);
    return null;
  }
  return data ?? null;
});
