import { t } from '@/libs/utils/i18n';
import RevealHeadline from '@/animations/shared/RevealHeadline';
import RevealFade from '@/animations/shared/RevealFade';
import Button from '@/components/ui/Button';
import { agentFig, awardFig, codeFig, formats, values, weekly } from '@/components/home-v3/Tile';
import { Tile } from '@/components/home-v3/Tile';

export default function HomeV3Bento({ count = 0 }) {
  const renderTile = (key, fig, className, params) => (
    <Tile
      key={key}
      className={className}
      fig={fig}
      title={t(`home-v3.bento.${key}.title`)}
      line={t(`home-v3.bento.${key}.line`, params)}
    />
  );

  return (
    <section data-theme="dark" className="bg-background py-96 text-foreground lg:py-160">
      <div className="v2-container flex flex-col gap-48 lg:gap-64">
        <RevealHeadline
          as="h2"
          sizeClass="text-h2"
          className="max-w-[18ch] font-medium text-balance"
          trigger="scroll"
        >
          {t('home-v3.bento.headline')}
        </RevealHeadline>

        <div className="grid grid-cols-12 gap-px border border-border bg-border">
          {renderTile('award', awardFig, 'md:col-span-6 lg:col-span-5')}
          {renderTile('agent', agentFig, 'md:col-span-6 lg:col-span-4')}
          {renderTile('formats', formats, 'md:col-span-6 lg:col-span-3')}
          {renderTile('values', values, 'md:col-span-6 lg:col-span-3')}
          {renderTile('code', codeFig, 'md:col-span-6 lg:col-span-4')}
          {renderTile('weekly', weekly, 'md:col-span-6 lg:col-span-5', { count })}
        </div>

        <RevealFade trigger="scroll" className="flex justify-center">
          <Button href="/animations" theme="brand">
            {t('home-v3.bento.browse')}
          </Button>
        </RevealFade>
      </div>
    </section>
  );
}

export { Tile, formats, values, weekly };
