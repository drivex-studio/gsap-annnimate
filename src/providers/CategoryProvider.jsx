'use client';
import React, { createContext, useContext } from 'react'; 

const CategoryContext = createContext([]);

export function CategoryProvider({ value, children }) {
  return (
    <CategoryContext.Provider value={value || []}>
      {children}
    </CategoryContext.Provider>
  );
}
export function useCategories() {
  return useContext(CategoryContext);
}

export function useCategoryOptions() {
  const categories = useContext(CategoryContext);
  return categories.map(category => ({
    value: category.slug,
    label: category.name
  }));
}

export function useCategorySlugs() {
  const categories = useContext(CategoryContext);
  return categories.map(category => category.slug);
}
