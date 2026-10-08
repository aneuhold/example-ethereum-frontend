import { useSyncExternalStore, type FC } from 'react';
import { onlineManager } from '@tanstack/react-query';
import { useBalances } from '../hooks/useBalances';
import { usePrice } from '../hooks/usePrice';
import { useSanctionedStore } from '../hooks/useSanctionedStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AddressForm } from '@/components/AddressForm';
import { AddressTable } from '@/components/AddressTable';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import type { Address } from '@/types/domain';
import BigNumber from 'bignumber.js';
import { CircleX, WifiOff } from 'lucide-react';

const ExposurePage: FC = () => {
  const addresses = useSanctionedStore((s) => s.addresses);
  const { data: price, isPending: pricePending } = usePrice();
  const balances = useBalances(addresses);
  const isOnline = useSyncExternalStore(onlineManager.subscribe, () => onlineManager.isOnline());

  if (pricePending && !isOnline) {
    return (
      <div className="p-6 max-w-md mx-auto mt-8">
        <Alert>
          <WifiOff />
          <AlertTitle>You Are Offline</AlertTitle>
          <AlertDescription>
            No cached data is available yet. Balances and prices load once the connection returns.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (pricePending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">Loading ETH price...</p>
      </div>
    );
  }

  // A failed refetch keeps showing the cached price
  if (price === undefined) {
    return (
      <div className="p-6 max-w-md mx-auto mt-8">
        <Alert variant="destructive">
          <CircleX />
          <AlertTitle>Error Loading Price</AlertTitle>
          <AlertDescription>Unable to fetch ETH price. Please try again later.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const rows: Address[] = addresses.map((address, index) => {
    const { data, isLoading, error } = balances[index];
    const balance = data === undefined ? undefined : new BigNumber(data);
    return { address, balance, balanceUsd: balance?.multipliedBy(price), isLoading, error };
  });

  const totalUsd = rows.reduce(
    (sum, row) => (row.balanceUsd ? sum.plus(row.balanceUsd) : sum),
    new BigNumber(0)
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Sanctioned Address Exposure</h1>
          <p className="text-muted-foreground text-lg">
            Monitor ETH balances and USD exposure across sanctioned addresses
          </p>
        </div>

        {/* Total Exposure Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-semibold">Total Exposure</CardTitle>
            <CardDescription className="text-center">
              Aggregate USD value across all monitored addresses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600 mb-4">${totalUsd.toFormat(2)}</div>
              <div className="flex justify-center items-center gap-2 flex-wrap">
                <Badge variant="secondary">ETH Price: ${price.toLocaleString()} USD</Badge>
                <Badge variant="outline">{addresses.length} Addresses</Badge>
                {!isOnline && (
                  <Badge variant="destructive">
                    <WifiOff data-icon="inline-start" />
                    Offline: showing cached data
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <AddressForm />

        {addresses.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No addresses are being monitored. Add one with the form above.
          </p>
        ) : (
          <AddressTable rows={rows} />
        )}
      </div>
    </div>
  );
};

export default ExposurePage;
