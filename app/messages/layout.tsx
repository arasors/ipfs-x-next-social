"use client";

import { ReactNode } from 'react';
import { AuthGuard } from '@/components/AuthGuard';

interface MessagesLayoutProps {
  children: ReactNode;
}

export default function MessagesLayout({ children }: MessagesLayoutProps) {
  return (
    <AuthGuard>
      <div className="w-full h-full">
        {children}
      </div>
    </AuthGuard>
  );
} 