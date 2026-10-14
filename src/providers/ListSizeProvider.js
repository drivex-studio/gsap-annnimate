'use client';

import { jsx } from 'react/jsx-runtime'; 
import { createContext, useContext } from 'react'; 

const ListSizeContext = createContext(null);
export function ListSizeProvider({ value, children }) {
  return jsx(ListSizeContext.Provider, {
    value,
    children,
  });
}
export function useListSize() {
  return useContext(ListSizeContext);
}
