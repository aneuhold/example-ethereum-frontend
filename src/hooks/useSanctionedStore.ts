import { create } from 'zustand';

interface SanctionedState {
  addresses: string[];
  addAddress: (address: string) => void;
  removeAddress: (address: string) => void;
}

/**
 * Zustand store for the list of sanctioned addresses being monitored.
 */
export const useSanctionedStore = create<SanctionedState>((set) => ({
  addresses: [
    '0x0000000000000000000000000000000000000001', // Address with actual balance
    '0x0000000000000000000000000000000000000002',
    '0x0000000000000000000000000000000000000003',
    '0x0000000000000000000000000000000000000004',
    '0x0000000000000000000000000000000000000005',
  ],
  addAddress: (address: string) =>
    set((state) => ({
      addresses: [...state.addresses, address],
    })),
  removeAddress: (address: string) =>
    set((state) => ({
      addresses: state.addresses.filter((a) => a !== address),
    })),
}));
