import React from 'react';

export default function VueIcon({ className = "", size = 16, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M9.6 1.6 8 4.373 6.4 1.6H1.067L8 13.6l6.933-12H9.6Zm-6.681.978h2.434L8 7.34l2.647-4.762h2.434L8 11.6 2.919 2.578Z"
        fill="currentColor"
      />
    </svg>
  );
}
