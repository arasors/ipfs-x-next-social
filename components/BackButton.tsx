import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

type BackButtonProps = {
  onClick?: () => void;
  label?: string;
};

export function BackButton({ onClick, label }: BackButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="flex items-center gap-1 p-0 h-8"
      onClick={onClick}
    >
      <ChevronLeft className="h-4 w-4" />
      {label && <span>{label}</span>}
    </Button>
  );
} 