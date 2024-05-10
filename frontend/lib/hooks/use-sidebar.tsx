'use client';

import React, { useEffect } from 'react';

const LOCAL_STORAGE_KEY = 'sidebar';

interface SidebarContext {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isLoading: boolean;
}

const SidebarContext = React.createContext<SidebarContext | undefined>(undefined);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('`useSidebarContext` must be used within a `SidebarProvider`.');
  }
  return context;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = React.useState(true);
  const [isLoading, setLoading] = React.useState(false);

  // load state from local storage after browser refresh, execute once
  useEffect(() => {
    const value = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (value) {
      setSidebarOpen(JSON.parse(value));
    }
    setLoading(false);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((state) => {
      const newState = !state;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
      return newState;
    });
  };

  if (isLoading) {
    return null;
  }

  return (
    <SidebarContext.Provider value={{ isSidebarOpen, toggleSidebar, isLoading }}>
      {children}
    </SidebarContext.Provider>
  );
}
