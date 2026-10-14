import { t } from '@/libs/utils/i18n';
import StarterPackBackground from '@/components/home-v3/StarterPackBackground';
import { StarterPackSection } from '@/components/home-v3/StarterPackSection';
import { StarterPackIllustration } from '@/components/home-v3/StarterPackIllustration';

export default function HomeV3StarterPack({
  images = [],
  count = 0,
  theme = 'dark',
  source = 'homepage',
  idPrefix = 'homepage-v3',
}) {
  return (
    <StarterPackSection
      theme={theme}
      source={source}
      idPrefix={idPrefix}
      alignToForm
      panel
      body={t('home-v3.starterPack.body', { count })}
      illustration={<StarterPackIllustration />}
      background={
        <>
          <StarterPackBackground images={images} />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-background/80" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,var(--background)_0%,transparent_35%,transparent_65%,var(--background)_100%)]"
          />
        </>
      }
    />
  );
}
