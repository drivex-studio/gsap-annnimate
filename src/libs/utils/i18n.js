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
  students: studentsLocales
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
