import commonLocales from '@/libs/locales/common.json';
import landingLocales from '@/libs/locales/landing.json';
import pricingLocales from '@/libs/locales/pricing.json';
import kitsLocales from '@/libs/locales/kits.json';
import platformLocales from '@/libs/locales/platform.json';
import builtWithLocales from '@/libs/locales/built-with.json';
import faqLocales from '@/libs/locales/faq.json';
import starterPackLocales from '@/libs/locales/starter-pack.json';
import whatsNewLocales from '@/libs/locales/whats-new.json';
import contactLocales from '@/libs/locales/contact.json';
import seoLocales from '@/libs/locales/seo.json';
import affiliateLocales from '@/libs/locales/affiliate.json';
import packsLocales from '@/libs/locales/packs.json';
import studentsLocales from '@/libs/locales/students.json';
import affiliateV3Locales from '@/libs/locales/affiliate-v3.json';
import frameworksV3Locales from '@/libs/locales/frameworks-v3.json';
import homeV3Locales from '@/libs/locales/home-v3.json';
import kitsV3Locales from '@/libs/locales/kits-v3.json';
import packsV3Locales from '@/libs/locales/packs-v3.json';
import platformV3Locales from '@/libs/locales/platform-v3.json';
import pricingV3Locales from '@/libs/locales/pricing-v3.json';
import studentsV3Locales from '@/libs/locales/students-v3.json';

const locales = {
  common: commonLocales,
  landing: landingLocales,
  pricing: pricingLocales,
  kits: kitsLocales,
  platform: platformLocales,
  "built-with": builtWithLocales,
  faq: faqLocales,
  "starter-pack": starterPackLocales,
  "whats-new": whatsNewLocales,
  contact: contactLocales,
  seo: seoLocales,
  affiliate: affiliateLocales,
  packs: packsLocales,
  students: studentsLocales,
  "affiliate-v3": affiliateV3Locales,
  "frameworks-v3": frameworksV3Locales,
  "home-v3": homeV3Locales,
  "kits-v3": kitsV3Locales,
  "packs-v3": packsV3Locales,
  "platform-v3": platformV3Locales,
  "pricing-v3": pricingV3Locales,
  "students-v3": studentsV3Locales
};

export function translate(keyPath, variables) {
  const resolvedValue = keyPath.split(".").reduce((acc, currentKey) => {
    return acc == null ? acc : acc[currentKey];
  }, locales);

  if (resolvedValue == null) {
    return keyPath;
  }

  if (variables) {
    return String(resolvedValue).replace(/\{(\w+)\}/g, (match, varName) => {
      return variables[varName] != null ? String(variables[varName]) : match;
    });
  }

  return resolvedValue;
}

export { translate as t };
