import React from 'react';

export function HtmlCssIcon({ className = "", size = 16, ...props }) {
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
        d="M2.75781 2.00806H13.2438L12.2898 12.7747L7.98915 13.9921L3.71315 12.7747L2.75781 2.00806ZM6.26848 6.87606L6.15315 5.51939L11.1751 5.52072L11.2905 4.21206L4.71048 4.21072L5.05848 8.20939H9.61515L9.45315 9.92006L8.00048 10.3214L6.52448 9.91806L6.43048 8.86472H5.12781L5.29248 10.9467L8.00048 11.6707L10.6858 10.9507L11.0578 6.87672L6.26848 6.87606Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default HtmlCssIcon;
