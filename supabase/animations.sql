-- Annnimate: animations table + RLS + sample rows
-- Supabase Dashboard > SQL Editor > New query > paste > Run
-- Safe to run more than once.

create table if not exists public.animations (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null,
  slug               text not null unique,
  category           text not null
                     check (category in ('button','scroll','ui-component','experimental','shader','menu','section')),
  description        text,
  preview_image_url  text,
  preview_video_url  text,
  code_react         text,
  code_vue           text,
  code_html          text,
  is_free_preview    boolean not null default false,
  metadata           jsonb not null default '{}'::jsonb,
  published_at       timestamptz,
  content_updated_at timestamptz,
  created_at         timestamptz not null default now()
);

create index if not exists animations_published_at_idx
  on public.animations (published_at desc);

alter table public.animations enable row level security;

drop policy if exists "Public can read published animations" on public.animations;
create policy "Public can read published animations"
  on public.animations
  for select
  to anon, authenticated
  using (published_at is not null);

-- Sample rows (placeholders: replace images/code with your own later).
-- Set published_at = null to hide a row from the site.
insert into public.animations
  (title, slug, category, description, preview_image_url, is_free_preview, published_at, code_react)
values
  ('Text Reveal', 'text-reveal', 'scroll',
   'Lines of text reveal on scroll with a masked slide-up.',
   'https://annnimate.b-cdn.net/video-thumbnails/scroll/text-reveal/text-reveal_cover.avif',
   true, now(),
   $code$import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"

export default function Box() {
  const box = useRef(null)
  useGSAP(() => {
    gsap.to(box.current, { x: 200, duration: 1, ease: "expo.out" })
  })
  return <div ref={box} className="box" />
}$code$),
  ('Dual Scramble', 'dual-scramble', 'ui-component',
   'Two-layer scramble text effect for labels and buttons.',
   'https://annnimate.b-cdn.net/video-thumbnails/ui-component/dual-scramble/dual_scramble_cover.avif',
   false, now() - interval '1 day', null),
  ('Accordion', 'accordion', 'ui-component',
   'Smooth height-animated accordion.',
   'https://annnimate.b-cdn.net/video-thumbnails/ui-component/accordion/accordion_cover.avif',
   false, now() - interval '2 days', null),
  ('Drawer Menu', 'multi-level-drawer-menu', 'menu',
   'Multi-level drawer navigation menu.',
   'https://annnimate.b-cdn.net/video-thumbnails/menu/multi-level-drawer-menu/multi-level-drawer-menu_cover.avif',
   false, now() - interval '3 days', null)
on conflict (slug) do nothing;
