const STUDIO_CYCLE_MONTHS = {
  quarterly: 3,
  yearly: 12,
};

const STUDIO_MAX_SEATS = 20;
const STUDIO_MIN_SEATS = 2;

const STUDIO_DISCOUNTS = {
  T2: 30,
  T3: 50,
};

function studioTotalCents(seats, priceCents, cycleMonths = 1) {
  const pricePerSeat =
    100 *
    Math.floor(
      (priceCents / cycleMonths) *
        (10 - Math.min(Math.max(0, seats - 1), 4)) /
        10 /
        100 +
        1e-9,
    ) *
    cycleMonths;

  return pricePerSeat * seats;
}

function studioPppTotalCents(
  seats,
  priceCents,
  tier,
  cycleMonths = 1,
) {
  const discount = STUDIO_DISCOUNTS[tier];
  const total = studioTotalCents(seats, priceCents, cycleMonths);

  return discount
    ? Math.round((total * (100 - discount)) / 100)
    : total;
}

export {
  STUDIO_CYCLE_MONTHS,
  STUDIO_MAX_SEATS,
  STUDIO_MIN_SEATS,
  studioPppTotalCents,
  studioTotalCents,
};
