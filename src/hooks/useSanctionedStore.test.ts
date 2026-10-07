import { beforeEach, describe, expect, it } from 'vitest';
import { useSanctionedStore } from './useSanctionedStore';

describe('useSanctionedStore', () => {
  const firstAddress = '0x0000000000000000000000000000000000000001';
  const secondAddress = '0x0000000000000000000000000000000000000002';
  beforeEach(() => {
    useSanctionedStore.setState({ addresses: [firstAddress] });
  });

  it('addAddress appends the address', () => {
    useSanctionedStore.getState().addAddress(secondAddress);

    expect(useSanctionedStore.getState().addresses).toEqual([firstAddress, secondAddress]);
  });

  it('removeAddress removes the address', () => {
    useSanctionedStore.getState().removeAddress(firstAddress);

    expect(useSanctionedStore.getState().addresses).toEqual([]);
  });
});
