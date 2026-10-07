import etherAddressService from '@/services/EtherAddress.service';
import { ValidationError } from '@/types/error';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SanctionedState {
  addresses: string[];
  /**
   * Adds an address to the end of the list, trimmed and lowercased. Addresses that differ only in
   * letter case are the same address.
   * @param address - Ethereum address to add
   * @throws {ValidationError} When the address is not a valid Ethereum address, or is already in
   * the list
   */
  addAddress: (address: string) => void;
  removeAddress: (address: string) => void;
}

/**
 * Zustand store for the list of sanctioned addresses being monitored. The list is saved to
 * `localStorage` under `sanctioned-addresses`.
 */
export const useSanctionedStore = create<SanctionedState>()(
  persist(
    (set, get) => ({
      addresses: [
        '0x0000000000000000000000000000000000000001', // Address with actual balance
        '0x0000000000000000000000000000000000000002',
        '0x0000000000000000000000000000000000000003',
        '0x0000000000000000000000000000000000000004',
        '0x0000000000000000000000000000000000000005',
      ],
      addAddress: (address: string) => {
        const normalizedAddress = address.trim().toLowerCase();
        if (!etherAddressService.isValidAddress(normalizedAddress)) {
          throw new ValidationError(
            'Not a valid Ethereum address. Enter 0x followed by 40 hex characters.'
          );
        }
        if (get().addresses.includes(normalizedAddress)) {
          throw new ValidationError('This address is already in the list.');
        }
        set((state) => ({
          addresses: [...state.addresses, normalizedAddress],
        }));
      },
      removeAddress: (address: string) =>
        set((state) => ({
          addresses: state.addresses.filter((a) => a !== address),
        })),
    }),
    { name: 'sanctioned-addresses' }
  )
);
