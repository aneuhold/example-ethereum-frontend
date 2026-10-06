import React from 'react';
import { useBalance } from '../hooks/useBalance';
import { usePrice } from '../hooks/usePrice';
import { useSanctionedStore } from '../main';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import BigNumber from 'bignumber.js';

const ExposurePage: React.FC = () => {
  const addresses = useSanctionedStore((s) => s.addresses);
  const { data: price, isLoading: priceLoading, error: priceError } = usePrice();

  const balances = addresses.map((address) => {
    const { data, isLoading, error } = useBalance(address);
    return { address, data, isLoading, error };
  });

  if (priceLoading) {
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
          <AlertTitle>Error Loading Price</AlertTitle>
          <AlertDescription>
            Unable to fetch ETH price. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const rows = balances.map(({ address, data, isLoading, error }) => {
    const eth = data ? new BigNumber(data).toFormat(6) : '—';
    const usd = data ? new BigNumber(data).multipliedBy(price!).toFormat(2) : '—';
    return { address, eth, usd, isLoading, error };
  });

  const totalUsd = rows
    .reduce((sum, row) => {
      if (row.usd !== '—') return sum.plus(new BigNumber(row.usd.replace(/,/g, '')));
      return sum;
    }, new BigNumber(0))
    .toFormat(2);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Sanctioned Address Exposure
          </h1>
          <p className="text-muted-foreground text-lg">
            Monitor ETH balances and USD exposure across sanctioned addresses
          </p>
        </div>

        {/* Total Exposure Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center">Total Exposure</CardTitle>
            <CardDescription className="text-center">
              Aggregate USD value across all monitored addresses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600 mb-4">
                ${totalUsd}
              </div>
              <div className="flex justify-center items-center gap-2 flex-wrap">
                <Badge variant="secondary">
                  ETH Price: ${price?.toLocaleString()} USD
                </Badge>
                <Badge variant="outline">
                  {addresses.length} Addresses
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Addresses Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rows.map(({ address, eth, usd, isLoading, error }) => (
            <Card key={address} className="hover:shadow-lg transition-shadow relative">
              {/* Status indicator as a small dot in top-right corner */}
              <div className="absolute top-3 right-3">
                {isLoading ? (
                  <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" title="Loading" />
                ) : error ? (
                  <div className="w-3 h-3 rounded-full bg-red-500" title="Error loading data" />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-green-500" title="Data loaded successfully" />
                )}
              </div>
              
              <CardHeader className="pb-3 pr-8">
                <CardTitle className="text-sm font-mono break-all leading-tight">
                  {address}
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">ETH Balance</span>
                    <span className="font-semibold text-right">
                      {isLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <span>{eth} ETH</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">USD Value</span>
                    <span className="font-semibold text-green-600 text-right">
                      {isLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <span>${usd}</span>
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
      </div>
    </div>
  );
};

export default ExposurePage;