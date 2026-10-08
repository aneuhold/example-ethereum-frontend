import type { FC } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

/**
 * Shows a spinner while an amount loads, then the formatted amount, or `—` when there is none.
 */
export const AmountCell: FC<{ isLoading: boolean; text: string | undefined }> = ({
  isLoading,
  text,
}) => (isLoading ? <LoadingSpinner size="sm" className="justify-start" /> : (text ?? '—'));
