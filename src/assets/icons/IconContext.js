import { createContext } from 'react';

export const IconContext = createContext({
  color: "currentColor",
  size: "1em",
  weight: "regular",
  mirrored: false
});
