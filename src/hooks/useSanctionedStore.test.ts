import { ValidationError } from '@/types/error';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSanctionedStore } from './useSanctionedStore';

describe('useSanctionedStore', () => {
  const firstAddress = '0x0000000000000000000000000000000000000001';
  const secondAddress = '0x0000000000000000000000000000000000000002';
  const mixedCaseAddress = '0x00000000219ab540356cBB839Cbe05303d7705Fa';
  const storageKey = 'sanctioned-addresses';
  beforeEach(() => {
    useSanctionedStore.setState({ addresses: [firstAddress] });
  });

  it('addAddress appends the trimmed, lowercased address', () => {
    useSanctionedStore.getState().addAddress(`  ${mixedCaseAddress}  `);

    expect(useSanctionedStore.getState().addresses).toEqual([
      firstAddress,
      mixedCaseAddress.toLowerCase(),
    ]);
  });

  it('addAddress throws a ValidationError for an invalid address and leaves the list unchanged', () => {
    expect(() => useSanctionedStore.getState().addAddress('0x123')).toThrow(ValidationError);

    expect(useSanctionedStore.getState().addresses).toEqual([firstAddress]);
  });

  it.each([
    ['the same letter case', mixedCaseAddress.toLowerCase()],
    ['a different letter case', mixedCaseAddress],
  ])(
    'addAddress throws a ValidationError for a duplicate in %s and leaves the list unchanged',
    (_, duplicate) => {
      useSanctionedStore.setState({ addresses: [mixedCaseAddress.toLowerCase()] });

      expect(() => useSanctionedStore.getState().addAddress(duplicate)).toThrow(ValidationError);

      expect(useSanctionedStore.getState().addresses).toEqual([mixedCaseAddress.toLowerCase()]);
    }
  );

  it('removeAddress removes the address', () => {
    useSanctionedStore.getState().removeAddress(firstAddress);

    expect(useSanctionedStore.getState().addresses).toEqual([]);
  });

  it('writes a change to localStorage', () => {
    useSanctionedStore.getState().addAddress(secondAddress);

    const saved = JSON.parse(localStorage.getItem(storageKey) ?? '{}');
    expect(saved.state.addresses).toEqual([firstAddress, secondAddress]);
  });

  it('loads the list saved in localStorage on rehydrate', async () => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ state: { addresses: [secondAddress] }, version: 0 })
    );

    await useSanctionedStore.persist.rehydrate();

    expect(useSanctionedStore.getState().addresses).toEqual([secondAddress]);
  });
});
