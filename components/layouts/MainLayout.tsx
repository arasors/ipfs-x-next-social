"use client";

import React from "react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <main className="flex-1 min-h-screen pb-16 md:pb-0">
      {children}
    </main>
  );
} 