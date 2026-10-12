'use client'
import React, { memo, useId, useState, useEffect } from 'react';

const LEGACY_COLORS = {
  bg: "#8b5cf6",
  path1: { color: "#06b6d4", translateX: 1, translateY: 2, rotate: 75, scale: 1.3 },
  path2: { color: "#f59e0b", translateX: -2, translateY: -1, rotate: -120, scale: 1.4 },
  path3: { color: "#10b981", translateX: 2, translateY: -2, rotate: 160, scale: 1.2 },
  bgRect: "#141314",
  path4: { color: "#fd551d", translateX: 1, translateY: 1, rotate: 45, scale: 1.3 },
  path5: { color: "#fd8d68", translateX: -1, translateY: -1, rotate: -30, scale: 1.25 },
  path6: { color: "#fb460d", translateX: 2, translateY: -2, rotate: 120, scale: 1.15 },
  path7: { color: "#fd7142", translateX: -2, translateY: 2, rotate: -75, scale: 1.2 }
};

export const LegacyAvatar = memo(function LegacyAvatar({ size = 32, className = "" }) {
  let titleId = useId();
  let maskId = useId();
  let filterId = useId();

  return (
    <div
      className={`inline-flex items-center justify-center overflow-hidden select-none legacy-avatar ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 60 60" fill="none" role="img" aria-label="Founding Member" width={size} height={size}>
        <title id={titleId}>Founding Member</title>
        <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={60} height={60}>
          <rect width={60} height={60} rx={120} fill="#FFFFFF" />
        </mask>
        <g mask={`url(#${maskId})`}>
          <rect width={60} height={60} fill={LEGACY_COLORS.bgRect} />
          <path
            filter={`url(#${filterId})`}
            d="M32.414 59.35L50.376 70.5H72.5v-71H33.728L26.5 13.381l19.057 27.08L32.414 59.35z"
            fill={LEGACY_COLORS.path4.color}
            style={{ mixBlendMode: "screen" }}
            transform={`translate(${LEGACY_COLORS.path4.translateX} ${LEGACY_COLORS.path4.translateY}) rotate(${LEGACY_COLORS.path4.rotate} 30 30) scale(${LEGACY_COLORS.path4.scale})`}
          />
          <path
            filter={`url(#${filterId})`}
            style={{ mixBlendMode: "multiply" }}
            d="M22.216 24L0 46.75l14.108 38.129L78 86l-3.081-59.276-22.378 4.005 12.972 20.186-23.35 27.395L22.215 24z"
            fill={LEGACY_COLORS.path5.color}
            transform={`translate(${LEGACY_COLORS.path5.translateX} ${LEGACY_COLORS.path5.translateY}) rotate(${LEGACY_COLORS.path5.rotate} 30 30) scale(${LEGACY_COLORS.path5.scale})`}
          />
          {LEGACY_COLORS.path6 && (
            <path
              filter={`url(#${filterId})`}
              style={{ mixBlendMode: "soft-light" }}
              d="M45.5 8.5L58 21v20L45.5 54.5 28 41V21l17.5-12.5z"
              fill={LEGACY_COLORS.path6.color}
              transform={`translate(${LEGACY_COLORS.path6.translateX} ${LEGACY_COLORS.path6.translateY}) rotate(${LEGACY_COLORS.path6.rotate} 30 30) scale(${LEGACY_COLORS.path6.scale})`}
            />
          )}
          {LEGACY_COLORS.path7 && (
            <path
              filter={`url(#${filterId})`}
              style={{ mixBlendMode: "overlay" }}
              d="M15 35L30 15l25 10-5 30-25 5-10-25z"
              fill={LEGACY_COLORS.path7.color}
              transform={`translate(${LEGACY_COLORS.path7.translateX} ${LEGACY_COLORS.path7.translateY}) rotate(${LEGACY_COLORS.path7.rotate} 30 30) scale(${LEGACY_COLORS.path7.scale})`}
            />
          )}
        </g>
        <defs>
          <filter id={filterId} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity={0} result="BackgroundImageFix" />
            <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation={7} result="effect1_foregroundBlur" />
          </filter>
        </defs>
      </svg>
    </div>
  );
});

export const avatarPatterns = [
  {
    bgColor: "#E63525",
    path1: { color: "#050D4C", translateX: 2, translateY: 2, rotate: 98, scale: 1.2 },
    path2: { color: "#D4EBEE", translateX: -3, translateY: -3, rotate: -147, scale: 1.3 }
  },
  {
    bgColor: "#050D4C",
    path1: { color: "#D4EBEE", translateX: 0, translateY: 0, rotate: 76, scale: 1.2 },
    path2: { color: "#F6C750", translateX: 2, translateY: 2, rotate: 114, scale: 1.2 }
  },
  {
    bgColor: "#F6C750",
    path1: { color: "#E63525", translateX: 0, translateY: 0, rotate: -40, scale: 1.2 },
    path2: { color: "#050D4C", translateX: 0, translateY: 0, rotate: -240, scale: 1.2 }
  },
  {
    bgColor: "#D4EBEE",
    path1: { color: "#F6C750", translateX: -2, translateY: 2, rotate: -22, scale: 1.2 },
    path2: { color: "#E63525", translateX: 1, translateY: -1, rotate: 33, scale: 1.3 }
  }
];

function getStringHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash &= hash;
  }
  return Math.abs(hash);
}

export const AvatarFallback = memo(function AvatarFallback({ name, avatarIndex, size = 40, className = "" }) {
  let titleId = useId();
  let maskId = useId();
  let filterId = useId();

  if (avatarIndex === 4) {
    return <LegacyAvatar size={size} className={className} />;
  }

  let indexToUse = avatarIndex;
  if (indexToUse == null) {
    indexToUse = getStringHash(name || "User") % avatarPatterns.length;
  }

  let pattern = avatarPatterns[indexToUse % avatarPatterns.length];

  return (
    <div
      className={`inline-flex items-center justify-center overflow-hidden select-none w-full ${className}`}
      style={{ height: size }}
    >
      <svg viewBox="0 0 60 60" fill="none" role="img" aria-label={name} width="100%" height={size}>
        <title id={titleId}>{name}</title>
        <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={60} height={60}>
          <rect width={60} height={60} rx={120} fill="#FFFFFF" />
        </mask>
        <g mask={`url(#${maskId})`}>
          <rect width={60} height={60} fill={pattern.bgColor} />
          <path
            filter={`url(#${filterId})`}
            d="M32.414 59.35L50.376 70.5H72.5v-71H33.728L26.5 13.381l19.057 27.08L32.414 59.35z"
            fill={pattern.path1.color}
            transform={`translate(${pattern.path1.translateX} ${pattern.path1.translateY}) rotate(${pattern.path1.rotate} 30 30) scale(${pattern.path1.scale})`}
          />
          <path
            filter={`url(#${filterId})`}
            style={{ mixBlendMode: "overlay" }}
            d="M22.216 24L0 46.75l14.108 38.129L78 86l-3.081-59.276-22.378 4.005 12.972 20.186-23.35 27.395L22.215 24z"
            fill={pattern.path2.color}
            transform={`translate(${pattern.path2.translateX} ${pattern.path2.translateY}) rotate(${pattern.path2.rotate} 30 30) scale(${pattern.path2.scale})`}
          />
        </g>
        <defs>
          <filter id={filterId} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity={0} result="BackgroundImageFix" />
            <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation={7} result="effect1_foregroundBlur" />
          </filter>
        </defs>
      </svg>
    </div>
  );
});

export const AnnnimateAI = memo(function AnnnimateAI({ size = 32, className = "" }) {
  let titleId = useId();
  let maskId = useId();
  let filterId = useId();

  return (
    <div
      className={`inline-flex items-center justify-center overflow-hidden select-none w-full ${className}`}
      style={{ height: size }}
    >
      <svg viewBox="0 0 60 60" fill="none" role="img" aria-label="Annnimate AI" width="100%" height={size}>
        <title id={titleId}>Annnimate AI</title>
        <mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={60} height={60}>
          <rect width={60} height={60} rx={120} fill="#FFFFFF" />
        </mask>
        <g mask={`url(#${maskId})`}>
          <rect width={60} height={60} fill={LEGACY_COLORS.bg} />
          <path
            filter={`url(#${filterId})`}
            d="M32.414 59.35L50.376 70.5H72.5v-71H33.728L26.5 13.381l19.057 27.08L32.414 59.35z"
            fill={LEGACY_COLORS.path1.color}
            style={{ mixBlendMode: "multiply" }}
            transform={`translate(${LEGACY_COLORS.path1.translateX} ${LEGACY_COLORS.path1.translateY}) rotate(${LEGACY_COLORS.path1.rotate} 30 30) scale(${LEGACY_COLORS.path1.scale})`}
          />
          <path
            filter={`url(#${filterId})`}
            style={{ mixBlendMode: "screen" }}
            d="M22.216 24L0 46.75l14.108 38.129L78 86l-3.081-59.276-22.378 4.005 12.972 20.186-23.35 27.395L22.215 24z"
            fill={LEGACY_COLORS.path2.color}
            transform={`translate(${LEGACY_COLORS.path2.translateX} ${LEGACY_COLORS.path2.translateY}) rotate(${LEGACY_COLORS.path2.rotate} 30 30) scale(${LEGACY_COLORS.path2.scale})`}
          />
          {LEGACY_COLORS.path3 && (
            <path
              filter={`url(#${filterId})`}
              style={{ mixBlendMode: "soft-light" }}
              d="M45.5 8.5L58 21v20L45.5 54.5 28 41V21l17.5-12.5z"
              fill={LEGACY_COLORS.path3.color}
              transform={`translate(${LEGACY_COLORS.path3.translateX} ${LEGACY_COLORS.path3.translateY}) rotate(${LEGACY_COLORS.path3.rotate} 30 30) scale(${LEGACY_COLORS.path3.scale})`}
            />
          )}
        </g>
        <defs>
          <filter id={filterId} filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity={0} result="BackgroundImageFix" />
            <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation={7} result="effect1_foregroundBlur" />
          </filter>
        </defs>
      </svg>
    </div>
  );
});

export default memo(function Avatar({ src, alt, name, avatarIndex, size = 40, className = "" }) {
  let [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (src) setHasError(false);
  }, [src]);

  let displayName = name || alt || "User";
  let showFallback = !src || hasError;

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden select-none rounded-full ${className}`}
      style={{ width: size, height: size }}
      title={displayName}
    >
      {showFallback ? (
        <AvatarFallback name={displayName} avatarIndex={avatarIndex} size={size} />
      ) : (
        <img
          src={src}
          alt={alt || displayName}
          onError={() => {
            setHasError(true);
          }}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
});
