import React from 'react';

const Icon = ({ width, height, strokeWidth = 26, ...restProps }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 255 129"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="butt"
      strokeLinejoin="miter"
      {...restProps}
    >
      <path d="M13 129C13 105.252 32.0279 86 55.5 86C78.9721 86 98 105.252 98 129" />
      <path d="M13 129C13 89.7878 44.3401 58 83 58C121.66 58 153 89.7878 153 129" />
      <path d="M13 129C13 64.935 64.2634 13 127.5 13C190.737 13 242 64.935 242 129" />
    </svg>
  );
};

export default Icon;
