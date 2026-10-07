import { translate } from '@/libs/utils/i18n';

export const getNavLinks = () => [
  {
    key: "library",
    label: translate("common.header.nav.library.label"),
    triggerHref: "/animations",
    mega: {
      intro: {
        eyebrow: translate("common.header.nav.library.intro.eyebrow"),
        heading: translate("common.header.nav.library.intro.heading"),
        text: translate("common.header.nav.library.intro.text"),
        cta: {
          label: translate("common.header.nav.library.intro.ctaLabel"),
          href: "/animations"
        }
      },
      columns: [
        {
          label: translate("common.header.nav.library.columns.byCategory"),
          dynamic: "categories",
          links: []
        },
        {
          label: translate("common.header.nav.library.columns.collections"),
          links: [
            { label: translate("common.header.nav.library.links.allComponents"), href: "/animations" },
            { label: translate("common.header.nav.library.links.mostPopular"), href: "/animations?sort=hot" },
            { label: translate("common.header.nav.library.links.saved"), href: "/animations/saved" }
          ]
        }
      ]
    }
  },
  {
    key: "kits",
    label: translate("common.header.nav.kits.label"),
    triggerHref: "/kits",
    badge: translate("common.header.nav.kits.badge"),
    mega: {
      intro: {
        eyebrow: translate("common.header.nav.kits.intro.eyebrow"),
        heading: translate("common.header.nav.kits.intro.heading"),
        text: translate("common.header.nav.kits.intro.text"),
        cta: {
          label: translate("common.header.nav.kits.intro.ctaLabel"),
          href: "/kits/menu"
        }
      },
      columns: [
        {
          label: translate("common.header.nav.kits.columns.theKits"),
          links: [
            { label: translate("common.header.nav.kits.links.revealKit"), href: "/kits/reveal" },
            { label: translate("common.header.nav.kits.links.menuKit"), href: "/kits/menu", badge: "New" }
          ]
        },
        {
          label: translate("common.header.nav.kits.columns.learn"),
          links: [
            { label: translate("common.header.nav.kits.links.whatAKitIs"), href: "/kits" },
            { label: translate("common.header.nav.kits.links.kitVsLibrary"), href: "/kits" }
          ]
        },
        {
          label: translate("common.header.nav.kits.columns.stayClose"),
          links: [
            { label: translate("common.header.nav.kits.links.foundingOffer"), href: "/whats-new" },
            { label: translate("common.header.nav.kits.links.roadmap"), href: "/roadmap" },
            { label: translate("common.header.nav.kits.links.pricing"), href: "/pricing" }
          ]
        }
      ],
      featured: {
        eyebrow: translate("common.header.nav.kits.featured.eyebrow"),
        title: translate("common.header.nav.kits.featured.title"),
        href: "/kits/menu",
        image: {
          jpg: "https://annnimate.b-cdn.net/video-thumbnails/kits/menu/preview-index/preview-index.gif",
          alt: translate("common.header.nav.kits.featured.imageAlt")
        }
      }
    }
  },
  {
    key: "learn",
    label: translate("common.header.nav.learn.label"),
    triggerHref: "/learn",
    mega: {
      intro: {
        eyebrow: translate("common.header.nav.learn.intro.eyebrow"),
        heading: translate("common.header.nav.learn.intro.heading"),
        text: translate("common.header.nav.learn.intro.text"),
        cta: {
          label: translate("common.header.nav.learn.intro.ctaLabel"),
          href: "/learn"
        }
      },
      columns: [
        {
          label: translate("common.header.nav.learn.columns.concepts"),
          links: [
            { label: translate("common.header.nav.learn.links.easing"), href: "/learn/easing" },
            { label: translate("common.header.nav.learn.links.scroll"), href: "/learn/scroll" },
            { label: translate("common.header.nav.learn.links.timeline"), href: "/learn/timeline" },
            { label: translate("common.header.nav.learn.links.text"), href: "/learn/text" },
            { label: translate("common.header.nav.learn.links.react"), href: "/learn/react" },
            { label: translate("common.header.nav.learn.links.performance"), href: "/learn/performance" },
            { label: translate("common.header.nav.learn.links.plugins"), href: "/learn/plugins" }
          ]
        },
        {
          label: translate("common.header.nav.learn.columns.explore"),
          links: [
            { label: translate("common.header.nav.learn.links.patterns"), href: "/patterns" },
            { label: translate("common.header.nav.learn.links.freeTools"), href: "/tools" },
            { label: translate("common.header.nav.learn.links.documentation"), href: "/docs" },
            { label: translate("common.header.nav.learn.links.comparisons"), href: "/compare" }
          ]
        }
      ]
    }
  },
  {
    key: "docs",
    label: translate("common.header.nav.docs.label"),
    href: "/docs"
  },
  {
    key: "pricing",
    label: translate("common.header.nav.pricing.label"),
    href: "/pricing"
  },
  {
    key: "showcase",
    label: translate("common.header.nav.showcase.label"),
    href: "/showcase"
  }
];
