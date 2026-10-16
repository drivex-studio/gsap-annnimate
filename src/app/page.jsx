import { t } from '@/libs/utils/i18n';
import {
  getPublishedAnimations,
  getShippedRecently,
  getAnimationBySlug,
} from '@/libs/supabase/latestAnimation';

import HomeV3Hero from '@/components/home-v3/HomeV3Hero';
import HomeV3Spotlight from '@/components/home-v3/HomeV3Spotlight';
import HomeV3Bento from '@/components/home-v3/HomeV3Bento';
import HomeV3Shipped from '@/components/home-v3/HomeV3Shipped';
import HomeV3Showcase from '@/components/home-v3/HomeV3Showcase';
import HomeV3Testimonials from '@/components/home-v3/HomeV3Testimonials';
import HomeV3Pricing from '@/components/home-v3/HomeV3Pricing';
import HomeV3StarterPack from '@/components/home-v3/HomeV3StarterPack';
import HomeV3Faq from '@/components/home-v3/HomeV3Faq';
import EndCta from '@/components/animations/EndCta';

export const revalidate = 60;

const FREE_COUNT = 16;

const HERO_SLUGS = [
  'circular-slider', 'image-fly-in', 'card-fan', 'step-wipe', 'wipe-slider',
  'torn-paper-transition', 'mega-menu', 'noise-image-reveal', 'ink-bloom',
];

const RING_SLUGS = [
  'circular-slider', 'image-fly-in', 'card-fan', 'step-wipe', 'wipe-slider',
  'torn-paper-transition', 'mega-menu', 'noise-image-reveal', 'ink-bloom',
];

const SHOWCASE_SITES = [
  { name: 'POWERADE House of Legends', slug: 'powerade', image: 'https://annnimate-support.b-cdn.net/Showcase/gf-powerade-1790089647/1790089648781_sc_powerade.jpg' },
  { name: 'BODYARMOR', slug: 'bodyarmor', image: 'https://annnimate-support.b-cdn.net/Showcase/gf-bodyarmor-1790099101/1790099102130_sc_bodyarmor.jpg' },
  { name: 'Good Fella', slug: 'good-fella', image: 'https://annnimate-support.b-cdn.net/Showcase/gf-good-fella-1790089649/1790089650440_sc_good_fella.jpg' },
  { name: 'Crystal Peak Security', slug: 'crystal-peak', image: 'https://annnimate-support.b-cdn.net/Showcase/gf-crystal-peak-1790089652/1790089653017_sc_crystal_peak.jpg' },
  { name: 'PASH® Portfolio', slug: 'pash', image: 'https://annnimate-support.b-cdn.net/Showcase/f_JiTpMmQ5/1790755305717_1__hero_2x.jpg' },
  { name: 'Forge Automotive', slug: 'forge', image: 'https://annnimate-support.b-cdn.net/Showcase/gf-forge-1790089650/1790089651595_sc_forge.jpg' },
];

const KITS = [
  { slug: 'reveal', title: 'Reveal Kit', tagline: 'Preloaders and hero sections, built as one system.', componentCount: 13, priceDisplay: '€149' },
  { slug: 'menu', title: 'Menu Kit', tagline: 'Site navigation, built as one system.', componentCount: 10, priceDisplay: '€149' },
];

const SOFTWARE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  '@id': 'https://annnimate.com/#software',
  name: 'Annnimate',
  description:
    'Production GSAP motion components for React and Vue. Every component shipped on a real brand site before it reached the library. By Good Fella.',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web Browser',
  url: 'https://annnimate.com/',
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'EUR',
    lowPrice: '199',
    highPrice: '300',
    offerCount: 2,
  },
  featureList: [
    '110+ production-ready GSAP components',
    'React, Vue, HTML/CSS/JS formats',
    'GSAP-native (not Framer Motion)',
    'Live previews and copy-paste code',
    'TypeScript-ready',
    'Reduced-motion accessible',
  ],
};

/* ---------- helpers ---------- */

function pickBySlugs(list, slugs) {
  const bySlug = new Map(list.map((a) => [a.slug, a]));
  return slugs.map((s) => bySlug.get(s)).filter(Boolean);
}

/* ---------- page ---------- */

export default async function HomePage() {
  const [animations, shippedRecently, spotlight] = await Promise.all([
    getPublishedAnimations(),
    getShippedRecently(),
    getAnimationBySlug('circular-slider'),
  ]);

  const withImage = animations.filter((a) => a.preview_image_url);
  const count = animations.length;

  const heroItems = pickBySlugs(withImage, HERO_SLUGS);
  const shippedItems = withImage.slice(0, 20); // published_at desc
  const ringImages = pickBySlugs(withImage, RING_SLUGS).map((a) => a.preview_image_url);
  const starterImages = withImage.map((a) => a.preview_image_url);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(SOFTWARE_JSON_LD) }}
      />

      {/* 1. Hero (dark) */}
      <HomeV3Hero items={heroItems} freeCount={FREE_COUNT} />

      {/* 2. Spotlight — Circular Slider live preview + Customizer (dark) */}
      {spotlight ? (
        <HomeV3Spotlight
          animation={spotlight}
          formats={['html', 'react', 'vue']}
          count={count}
        />
      ) : null}

      {/* 3. Bento — "Client-ready the moment you paste it." (dark) */}
      <HomeV3Bento count={count} />

      {/* 4. Just shipped — cascade slider (dark) */}
      <HomeV3Shipped items={shippedItems} count={count} />

      {/* 5. Showcase — "These sites were built with Annnimate" (light) */}
      <HomeV3Showcase sites={SHOWCASE_SITES} />

      {/* 6. Testimonials (light) */}
      <HomeV3Testimonials />

      {/* 7. Pricing (light) */}
      <HomeV3Pricing
        kits={KITS}
        shippedRecently={shippedRecently}
        count={count}
      />

      {/* 8. Starter pack newsletter (dark) */}
      <HomeV3StarterPack images={starterImages} count={FREE_COUNT} />

      {/* 9. FAQ */}
      <div className="v3-faq">
        <HomeV3Faq
          faqs={t('home-v3.faq.items')}
          headline={t('home-v3.faq.headline')}
          subtext={t('home-v3.faq.subtext')}
        />
      </div>

      {/* 10. End CTA with image rings (dark) */}

        <EndCta images={ringImages}
          bleed
          />
    </>
  );
}
