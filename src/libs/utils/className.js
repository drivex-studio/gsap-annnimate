import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["display","h1","h2","h3","h4","h5","h6","subheadline",
             "body","body-lg","body-sm","reading",
             "accent-2xs","accent-xs","accent-base","accent-lg",
             "mono","mono-sm","mono-lg"],
    },
  },
});

export const cn = (...inputs) => twMerge(clsx(inputs));