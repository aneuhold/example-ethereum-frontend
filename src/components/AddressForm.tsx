import { useState } from 'react';
import type { FC, FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useSanctionedStore } from '@/hooks/useSanctionedStore';
import { ValidationError } from '@/types/error';

/**
 * Form that adds one address to the monitored list. The input value is kept in this component's
 * state, so typing re-renders only the form.
 */
export const AddressForm: FC = () => {
  const addAddress = useSanctionedStore((s) => s.addAddress);
  const [address, setAddress] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      addAddress(address);
    } catch (error) {
      if (!(error instanceof ValidationError)) throw error;
      // Keep the input so the user can fix the address
      toast.error(error.message);
      return;
    }
    toast.success('Address added');
    setAddress('');
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Add Address</CardTitle>
        <CardDescription>Monitor another Ethereum address</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            aria-label="Ethereum address"
            placeholder="0x..."
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
          />
          <Button type="submit" disabled={!address.trim()}>
            Add
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
