import type { FC } from 'react';
import { useBalances } from '../hooks/useBalances';
import { usePrice } from '../hooks/usePrice';
import { useSanctionedStore } from '../hooks/useSanctionedStore';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AddressForm } from '@/components/AddressForm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import BigNumber from 'bignumber.js';
import { CircleX, Trash } from 'lucide-react';
import { toast } from 'sonner';

const ExposurePage: FC = () => {
  const addresses = useSanctionedStore((s) => s.addresses);
  const removeAddress = useSanctionedStore((s) => s.removeAddress);
  const { data: price, isPending: pricePending, error: priceError } = usePrice();
  const balances = useBalances(addresses);

  if (pricePending) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-muted-foreground">Loading ETH price...</p>
      </div>
    );
  }

  if (priceError) {
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

  const rows = addresses.map((address, index) => {
    const { data, isLoading, error } = balances[index];
    const eth = data === undefined ? undefined : new BigNumber(data);
    const usd = eth?.multipliedBy(price);
    return { address, eth, usd, isLoading, error };
  });

  const totalUsd = rows.reduce((sum, row) => (row.usd ? sum.plus(row.usd) : sum), new BigNumber(0));

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
              </div>
            </div>
          </CardContent>
        </Card>

        <AddressForm />

        {/* Addresses Grid */}
        {addresses.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No addresses are being monitored. Add one with the form above.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rows.map(({ address, eth, usd, isLoading, error }) => (
              <Card key={address} className="gap-3 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-sm font-mono font-semibold break-all leading-tight">
                    {address}
                  </CardTitle>
                  <CardAction className="flex items-center gap-1">
                    {/* Status indicator as a small dot */}
                    {isLoading ? (
                      <div
                        className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse"
                        title="Loading"
                      />
                    ) : error ? (
                      <div className="w-3 h-3 rounded-full bg-red-500" title="Error loading data" />
                    ) : (
                      <div
                        className="w-3 h-3 rounded-full bg-green-500"
                        title="Data loaded successfully"
                      />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${address}`}
                      onClick={() => {
                        removeAddress(address);
                        toast.success('Address removed');
                      }}
                    >
                      <Trash />
                    </Button>
                  </CardAction>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">ETH Balance</span>
                      <span className="text-base font-semibold text-right">
                        {isLoading ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <span>{eth ? `${eth.toFormat(6)} ETH` : '—'}</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">USD Value</span>
                      <span className="text-base font-semibold text-green-600 text-right">
                        {isLoading ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <span>{usd ? `$${usd.toFormat(2)}` : '—'}</span>
                        )}
                      </span>
                    </div>
                    {error && (
                      <div className="mt-2">
                        <Badge variant="destructive" className="text-xs">
                          Failed to load
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExposurePage;
