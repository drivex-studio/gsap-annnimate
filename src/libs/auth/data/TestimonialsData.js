import 'react';
import 'react/jsx-runtime';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

import { t } from '@/libs/utils/i18n';
import '@/animations/components/AnimatedText';
import '@/hooks/useBreakpoint';

dynamic(() => import('@/components/animations/utils/DynamicInteractiveBlock'), {
  loadableGenerated: { modules: [168950] },
  ssr: false,
});

gsap.registerPlugin(useGSAP, ScrollTrigger);

const AVATAR_SRCS = [
  '/imgs/lukas_avatar.avif',
  '/imgs/edoardo_avatar.avif',
  '/imgs/matthew_avatar.avif',
];

export const TESTIMONIALS = t('common.testimonials.items').map((item, index) => ({
  ...item,
  avatarSrc: AVATAR_SRCS[index],
}));
export const PARALLAX_OFFSETS = [80, 56, 120];
