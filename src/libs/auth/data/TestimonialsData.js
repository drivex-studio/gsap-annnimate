import { t } from '@/libs/utils/i18n'; // module id: 398682

// module id: 967791
const AVATAR_IMAGES = [ // original mangled: m
  "/imgs/lukas_avatar.avif", 
  "/imgs/edoardo_avatar.avif", 
  "/imgs/matthew_avatar.avif"
];

export const TESTIMONIALS = t("common.testimonials.items").map((item, index) => ({ // original mangled: f
  ...item,
  avatarSrc: AVATAR_IMAGES[index]
}));

export const PARALLAX_OFFSETS = [80, 56, 120]; // original mangled: h

