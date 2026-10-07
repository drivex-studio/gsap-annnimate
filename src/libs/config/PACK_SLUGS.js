const FORCE_PRODUCTION = "true" === process.env.NEXT_PUBLIC_FORCE_PRODUCTION; 

const IS_PROD_ENVIRONMENT = true;
const USE_PROD_PRICES = IS_PROD_ENVIRONMENT || FORCE_PRODUCTION;

const pricesTest = {
  pro: "price_1SmdgaRvKRKuKXmGKUEtcEIW",
  team: "price_1Sme0wRvKRKuKXmGxvFcJSSH",
  lifetimePro: "price_1So4YrRvKRKuKXmGGv53ZBWU"
};

const pricesProd = {
  pro: "price_1SgkfFRvKRKuKXmGBrzPYauv",
  team: "price_1SgkfDRvKRKuKXmGDhPp0Iex",
  lifetimePro: "price_1So4WaRvKRKuKXmGYkYZt35Z"
};

const landingPricesTest = {
  soloYearly: "price_1TdFEoRvKRKuKXmGEiYeo97J",
  soloMonthly: "price_1TdFEoRvKRKuKXmGV7jD9iQh",
  studioYearly: "price_1TdFEpRvKRKuKXmGRymGG43K",
  studioMonthly: "price_1TdFEqRvKRKuKXmGB65QEdGD",
  studioPlusYearly: "price_1TdFErRvKRKuKXmGK0DYsOMB",
  studioPlusMonthly: "price_1TdFErRvKRKuKXmGxGTqkdgI"
};

const landingPricesProd = {
  soloYearly: "price_1TdFH5RvKRKuKXmGDXlyHBFY",
  soloMonthly: "price_1TdFH5RvKRKuKXmGV7QKmzVy",
  studioYearly: "price_1TdFH6RvKRKuKXmGo7qkBvqi",
  studioMonthly: "price_1TdFH7RvKRKuKXmGyVfG3wrm",
  studioPlusYearly: "price_1TdFH8RvKRKuKXmGJOKCdxYD",
  studioPlusMonthly: "price_1TdFH8RvKRKuKXmGss4l59Cn"
};

const launchOfferTest = {
  soloYearly: null,
  soloMonthly: null,
  studioYearly: null,
  studioMonthly: null,
  studioPlusYearly: null,
  studioPlusMonthly: null
};

const launchOfferProd = {
  soloYearly: "price_1TfRAbRvKRKuKXmGrVbCZJxA",
  soloMonthly: "price_1TfRKuRvKRKuKXmGFpW9zSaJ",
  studioYearly: "price_1TfRAcRvKRKuKXmG0pFVPJWM",
  studioMonthly: "price_1TfRKvRvKRKuKXmG8QnoNbJw",
  studioPlusYearly: "price_1TfRAcRvKRKuKXmG7hO4XkFp",
  studioPlusMonthly: "price_1TfRKxRvKRKuKXmGR4qWpnDv"
};

export const prices = USE_PROD_PRICES ? pricesProd : pricesTest;
export const landingPrices = USE_PROD_PRICES ? landingPricesProd : landingPricesTest;
const activeLaunchOffer = USE_PROD_PRICES ? launchOfferProd : launchOfferTest;

const quarterlyPricesTest = {
  soloQuarterly: "price_1U1UGJRvKRKuKXmGM8VegBXN",
  studioQuarterly: "price_1U1UGKRvKRKuKXmGRpBeCyzG",
  studioPlusQuarterly: "price_1U1UGMRvKRKuKXmGBf0wcs7Y"
};

const quarterlyPricesProd = {
  soloQuarterly: "price_1U1UHGRvKRKuKXmGFm3YYFT2",
  studioQuarterly: "price_1U1UHHRvKRKuKXmGQjtP5l3d",
  studioPlusQuarterly: "price_1U1UHJRvKRKuKXmG3vkO8i8k"
};

export const quarterlyPrices = USE_PROD_PRICES ? quarterlyPricesProd : quarterlyPricesTest;

const kitPricesTest = {
  reveal: "price_1TlTU4RvKRKuKXmGzj8ym0l2",
  menu: "price_1U8HC9RvKRKuKXmGSeaIMCbI",
  "landing-pack": "price_1UBAN6RvKRKuKXmGsqHMpbEY"
};

const kitPricesProd = {
  reveal: "price_1TlTXHRvKRKuKXmGl62rlPoa",
  menu: "price_1U8HFfRvKRKuKXmGVBlPxC8O",
  "landing-pack": "price_1UBANXRvKRKuKXmG8FC9WzzA"
};

const activeKitPrices = USE_PROD_PRICES ? kitPricesProd : kitPricesTest;

(function registerPrices({
  prices = {},
  landingPricesTest = {},
  landingPricesProd = {},
  launchOfferTest = {},
  launchOfferProd = {},
  kitPricesTest = {},
  kitPricesProd = {},
  extra = []
} = {}) {
  let priceSet = new Set();
  let addPrice = (id) => {
    if (typeof id === "string" && id.startsWith("price_")) {
      priceSet.add(id);
    }
  };
  
  for (let group of [prices, landingPricesTest, landingPricesProd, launchOfferTest, launchOfferProd, kitPricesTest, kitPricesProd]) {
    for (let id of Object.values(group || {})) {
      addPrice(id);
    }
  }
  for (let id of extra) {
    addPrice(id);
  }
})({
  prices: {
    ...pricesTest,
    ...pricesProd
  },
  landingPricesTest: landingPricesTest,
  landingPricesProd: landingPricesProd,
  launchOfferTest: launchOfferTest,
  launchOfferProd: launchOfferProd,
  kitPricesTest: kitPricesTest,
  kitPricesProd: kitPricesProd,
  extra: [...Object.values(quarterlyPricesTest), ...Object.values(quarterlyPricesProd)]
});

export const PACK_SLUGS = ["landing-pack"];

export function getKitPriceId(slug) {
  return activeKitPrices[slug] || null;
}

export function isOfferActive(timestamp = Date.now()) {
  return timestamp < Date.parse("2026-09-18T22:00:00Z");
}
