"use client";

import { createContext, useContext } from "react";

const NotificationContext = createContext({
  banner: null,
  items: [],
  latestDate: null
});

export function NotificationProvider({ value, children }) {
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationFeed() {
  return useContext(NotificationContext);
}
