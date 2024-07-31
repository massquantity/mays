'use client';

import React, { useEffect } from 'react';

interface SidebarContext {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isParamOpen: boolean;
  toggleParams: () => void;
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
  const [isParamOpen, setParamsOpen] = React.useState(true);
  const [isLoading, setLoading] = React.useState(false);

  // load state from local storage after browser refresh, execute once
  useEffect(() => {
    const value = localStorage.getItem('sidebar');
    if (value) {
      setSidebarOpen(JSON.parse(value));
    }
    const param = localStorage.getItem('params');
    if (param) {
      setParamsOpen(JSON.parse(param));
    }
    setLoading(false);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((state) => {
      const newState = !state;
      localStorage.setItem('sidebar', JSON.stringify(newState));
      return newState;
    });
  };

  const toggleParams = () => {
    setParamsOpen((state) => {
      const newState = !state;
      localStorage.setItem('params', JSON.stringify(newState));
      return newState;
    });
  };

  if (isLoading) {
    return null;
  }

  return (
    <SidebarContext.Provider
      value={{ isSidebarOpen, toggleSidebar, isParamOpen, toggleParams, isLoading }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
