import React from 'react';

export default function WebflowIcon({ className = "", size = 16, ...props }) {
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
        d="M16 3.01001L10.8947 12.99H6.09933L8.236 8.85401H8.14C6.37733 11.142 3.74733 12.6487 0 12.99V8.91134C0 8.91134 2.39733 8.76934 3.80667 7.28801H0V3.01001H4.278V6.52868L4.374 6.52801L6.122 3.01001H9.358V6.50601H9.454L11.2673 3.01001H16Z"
        fill="currentColor"
      />
    </svg>
  );
}
