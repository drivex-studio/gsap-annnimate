import * as pricing from '@/libs/config/PACK_SLUGS';

const ServerData = {
  appName: 'Annnimate',
  appDescription: 'Production GSAP motion components for React and Vue. Every component shipped on a real brand site before it reached the library. By Good Fella.',
  domainName: 'annnimate.com',
  crisp: {
    id: '',
    onlyShowOnRoutes: ['/']
  },
  stripe: {
    plans: [
      {
        isFeatured: true,
        priceId: pricing.prices.pro,
        name: 'Pro',
        description: 'Perfect for individual designers and developers.',
        price: 199,
        priceAnchor: null,
        userAmount: 1,
        isBillingCycle: 'yearly',
        features: [
          { name: 'Full access to animation library' },
          { name: 'All code formats (HTML, React, Webflow)' },
          { name: 'GSAP integration' },
          { name: 'Save & organize favorites' },
          { name: 'New animations monthly' },
          { name: 'Documentation & support' },
          { name: 'All future updates' }
        ]
      },
      {
        priceId: pricing.prices.team,
        name: 'Team',
        description: 'For agencies and teams collaborating on projects.',
        price: 300,
        priceAnchor: null,
        isBillingCycle: 'yearly',
        userAmount: 3,
        additionalInfo: 'Includes 3 seats, +€159/year per additional seat',
        features: [
          { name: 'Everything in Pro' },
          { name: 'Minimum 3 team members included' },
          { name: 'Shared team workspace' },
          { name: 'Team collaboration tools' },
          { name: 'Priority support' },
          { name: 'Additional seats: €159/year each' }
        ]
      }
    ],
    landingPlans: [
      {
        key: 'solo',
        name: 'Solo',
        cta: 'Get Solo',
        surface: 'dark',
        isPopular: true,
        seatTag: '1 seat',
        pitch: 'For one developer working solo or on freelance work.',
        yearly: {
          price: 199,
          listPrice: 249,
          priceId: pricing.landingPrices.soloYearly,
          cycleLabel: '/year'
        },
        quarterly: {
          price: 20,
          listPrice: 29,
          cycleTotal: 60,
          listCycleTotal: 87,
          priceId: pricing.quarterlyPrices.soloQuarterly,
          cycleLabel: '/month'
        },
        features: [
          { componentCount: true },
          { shippedRecently: true },
          'React, Vue and HTML',
          'MCP server for Cursor and Claude Code',
          'New components as they ship',
          'Documentation and support'
        ]
      },
      {
        key: 'studio',
        name: 'Studio',
        cta: 'Get Studio',
        surface: 'surface',
        seatTag: '5 seats',
        pitch: 'For a small studio or team shipping client work.',
        yearly: {
          price: 549,
          listPrice: 699,
          priceId: pricing.landingPrices.studioYearly,
          cycleLabel: '/year'
        },
        quarterly: {
          price: 55,
          listPrice: 79,
          cycleTotal: 165,
          listCycleTotal: 237,
          priceId: pricing.quarterlyPrices.studioQuarterly,
          cycleLabel: '/month'
        },
        features: [
          '5 seats, one subscription',
          'Everything in Solo, for every seat',
          'MCP server for the whole team',
          'Priority support'
        ]
      },
      {
        key: 'studio-plus',
        name: 'Studio+',
        cta: 'Get Studio+',
        surface: 'surface-light',
        seatTag: '15 seats',
        pitch: 'For a larger team shipping a lot of client work.',
        yearly: {
          price: 1199,
          listPrice: 1499,
          priceId: pricing.landingPrices.studioPlusYearly,
          cycleLabel: '/year'
        },
        quarterly: {
          price: 119,
          listPrice: 169,
          cycleTotal: 357,
          listCycleTotal: 507,
          priceId: pricing.quarterlyPrices.studioPlusQuarterly,
          cycleLabel: '/month'
        },
        features: [
          '15 seats, one subscription',
          'Everything in Studio, for every seat',
          'Priority support'
        ]
      }
    ],
    addons: []
  },
  aws: {
    bucket: 'bucket-name',
    bucketUrl: 'https://bucket-name.s3.amazonaws.com/',
    cdn: 'https://cdn-id.cloudfront.net/'
  },
  resend: {
    fromNoReply: 'Annnimate <noreply@annnimate.com>',
    fromAdmin: 'Team at Annnimate <team@annnimate.com>',
    supportEmail: 'support@annnimate.com',
    contactEmail: 'contact@annnimate.com'
  },
  colors: {
    main: '#b3fca0'
  },
  auth: {
    loginUrl: '/login',
    callbackUrl: '/animations'
  },
  animationStats: {
    totalCount: 112,
    displayCount: '110+'
  },
  featureFlags: {
    earlyAccessFeatures: [
      'ai_code_generation_v2',
      'animation_composer',
      'team_workspaces',
      'advanced_customization'
    ],
    adminOnlyFeatures: [],
    disabledFeatures: []
  },
  adminMetrics: {
    monthlyInfraCostEur: 20
  }
};

export default ServerData;

export function effectiveCyclePrice(cycleData, timestamp = Date.now()) {
  if (!cycleData) return null;
  return pricing.isOfferActive(timestamp) 
    ? cycleData.price 
    : (cycleData.listPrice ?? cycleData.price);
}

export function effectiveCycleTotal(cycleData, timestamp = Date.now()) {
  if (!cycleData?.cycleTotal) return null;
  return pricing.isOfferActive(timestamp) 
    ? cycleData.cycleTotal 
    : (cycleData.listCycleTotal ?? cycleData.cycleTotal);
}
