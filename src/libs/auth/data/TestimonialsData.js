import { t } from '@/libs/utils/i18n';

const AVATAR_IMAGES = [
  "/imgs/lukas_avatar.avif", 
  "/imgs/edoardo_avatar.avif", 
  "/imgs/matthew_avatar.avif"
];

export const TESTIMONIALS = t("common.testimonials.items").map((item, index) => ({
  ...item,
  avatarSrc: AVATAR_IMAGES[index]
}));

export const PARALLAX_OFFSETS = [80, 56, 120];
