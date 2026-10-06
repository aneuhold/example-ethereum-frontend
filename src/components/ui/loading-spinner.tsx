import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
} as const;

/**
 * Accessible loading spinner component with customizable size
 */
export const LoadingSpinner = React.memo<LoadingSpinnerProps>(({ 
  size = 'md', 
  className,
  label = 'Loading...'
}) => {
  return (
    <div 
      className={cn('flex items-center justify-center', className)}
      role="status"
      aria-label={label}
    >
      <Loader2 
        className={cn(
          'animate-spin text-muted-foreground',
          sizeMap[size]
        )}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner'; 