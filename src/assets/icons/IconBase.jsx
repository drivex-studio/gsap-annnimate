import React, { forwardRef, useContext } from 'react';
import { IconContext } from '@/assets/icons/IconContext';

const IconBase = forwardRef((props, ref) => {
  const {
    alt,
    color,
    size,
    weight,
    mirrored,
    children,
    weights,
    ...rest
  } = props;

  const {
    color: contextColor = "currentColor",
    size: contextSize,
    weight: contextWeight = "regular",
    mirrored: contextMirrored = false,
    ...contextRest
  } = useContext(IconContext);

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size ?? contextSize}
      height={size ?? contextSize}
      fill={color ?? contextColor}
      viewBox="0 0 256 256"
      transform={(mirrored || contextMirrored) ? "scale(-1, 1)" : undefined}
      {...contextRest}
      {...rest}
    >
      {!!alt && <title>{alt}</title>}
      {children}
      {weights.get(weight ?? contextWeight)}
    </svg>
  );
});

IconBase.displayName = "IconBase";

export default IconBase;
