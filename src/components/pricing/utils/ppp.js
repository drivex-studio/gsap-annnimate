/* Data */
const PPP_PLAN_PRICING = {
  solo: {
    quarterly: { list: 87, T2: 42, T3: 30 },
    yearly: { list: 249, T2: 139, T3: 99 }
  },
  studio: {
    quarterly: { list: 237, T2: 115, T3: 85 },
    yearly: { list: 699, T2: 385, T3: 275 }
  },
  'studio-plus': {
    quarterly: { list: 507, T2: 249, T3: 179 },
    yearly: { list: 1499, T2: 839, T3: 599 }
  }
};

// module id: 397242
export const PPP_KIT_PRICING = {
  reveal: { list: 149, T2: 105, T3: 75 },
  menu: { list: 149, T2: 105, T3: 75 }
};

// module id: 397242
export function getPppEffectivePrice(planKey, cycle, tier) {
  const cycleData = PPP_PLAN_PRICING[planKey]?.[cycle];
  return cycleData && (tier === 'T2' || tier === 'T3') ? cycleData[tier] ?? null : null;
}

// module id: 397242
export function getPppDiscountPercent(tier) {
  const baseData = PPP_PLAN_PRICING.solo.quarterly;
  const tierPrice = tier === 'T2' || tier === 'T3' ? baseData[tier] : null;
  return tierPrice ? Math.round((100 * (baseData.list - tierPrice)) / baseData.list) : null;
}

// module id: 397242
export function getPppDisplayPrice(planKey, cycle, tier) {
  const effectivePrice = getPppEffectivePrice(planKey, cycle, tier);
  
  if (effectivePrice == null) {
    return null;
  }
  
  return cycle === 'quarterly'
    ? {
        price: Math.ceil(effectivePrice / 3),
        cycleTotal: effectivePrice
      }
    : {
        price: effectivePrice,
        cycleTotal: null
      };
}

// module id: 397242
export function getPppKitEffectivePrice(kitSlug, tier) {
  const kitData = PPP_KIT_PRICING[kitSlug];
  return kitData && (tier === 'T2' || tier === 'T3') ? kitData[tier] ?? null : null;
}