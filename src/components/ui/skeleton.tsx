import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Skeleton loading component for improved perceived performance
 */
export const Skeleton = React.memo<SkeletonProps>(({ className, ...props }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
      role="status"
      aria-label="Loading content"
      {...props}
    />
  );
});

Skeleton.displayName = 'Skeleton'; 