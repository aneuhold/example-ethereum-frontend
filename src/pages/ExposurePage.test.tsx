import { useSanctionedStore } from '@/hooks/useSanctionedStore';
import etherscanService from '@/services/Etherscan.service';
import { fireEvent, render, screen } from '@/test/test-utils';
import { ApiError } from '@/types/error';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ExposurePage from './ExposurePage';

describe('ExposurePage', () => {
  const firstAddress = '0x0000000000000000000000000000000000000001';
  const secondAddress = '0x0000000000000000000000000000000000000002';
  const failingAddress = '0x0000000000000000000000000000000000000003';
  const newAddress = '0x00000000219ab540356cbb839cbe05303d7705fa';

  /**
   * At an ETH price of 2,000, each balance is worth just over a half cent more than its displayed
   * USD value ($1,000.006 and $1,500.008), so summing the rounded row values would give $2,500.02.
   */
  const balances: Record<string, string> = {
    [firstAddress]: '0.500003',
    [secondAddress]: '0.750004',
  };
  beforeEach(() => {
    useSanctionedStore.setState({ addresses: [firstAddress, secondAddress] });
    vi.spyOn(etherscanService, 'getEthPrice').mockResolvedValue(2000);
    vi.spyOn(etherscanService, 'getBalance').mockImplementation(async (address) => {
      if (address in balances) return balances[address];
      throw new ApiError('Network error: Service unavailable', 503, 'NETWORK_ERROR');
    });
  });

  /**
   * Waits for the address form, then types an address into it and submits it.
   */
  const submitAddress = async (address: string) => {
    fireEvent.change(await screen.findByLabelText('Ethereum address'), {
      target: { value: address },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
  };

  it('shows the loading state while the price is pending', () => {
    vi.spyOn(etherscanService, 'getEthPrice').mockReturnValue(new Promise(() => {}));

    render(<ExposurePage />);

    expect(screen.getByText('Loading ETH price...')).toBeInTheDocument();
  });

  it('shows an error alert when the price fails to load', async () => {
    vi.spyOn(etherscanService, 'getEthPrice').mockRejectedValue(
      new ApiError('Network error: Service unavailable', 503, 'NETWORK_ERROR')
    );

    render(<ExposurePage />);

    expect(await screen.findByText('Error Loading Price')).toBeInTheDocument();
  });

  it('shows a total that is the exact sum of the rows', async () => {
    render(<ExposurePage />);

    expect(await screen.findByText('$1,000.01')).toBeInTheDocument();
    expect(await screen.findByText('$1,500.01')).toBeInTheDocument();
    expect(screen.getByText('$2,500.01')).toBeInTheDocument();
  });

  it('shows a failed row as "Failed to load" and leaves it out of the total', async () => {
    useSanctionedStore.setState({ addresses: [firstAddress, secondAddress, failingAddress] });

    render(<ExposurePage />);

    expect(await screen.findByText('Failed to load')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
    expect(await screen.findByText('$2,500.01')).toBeInTheDocument();
  });

  it('renders the new address list when the store changes after the first render', async () => {
    render(<ExposurePage />);
    await screen.findByText('$2,500.01');

    act(() => useSanctionedStore.getState().addAddress(failingAddress));
    expect(await screen.findByText(failingAddress)).toBeInTheDocument();

    act(() => useSanctionedStore.getState().removeAddress(secondAddress));
    expect(screen.queryByText(secondAddress)).not.toBeInTheDocument();
  });

  it('adds a submitted address, shows a success toast, and clears the input', async () => {
    render(<ExposurePage />);

    await submitAddress(newAddress);

    expect(await screen.findByText(newAddress)).toBeInTheDocument();
    expect(await screen.findByText('Address added')).toBeInTheDocument();
    expect(screen.getByLabelText('Ethereum address')).toHaveValue('');
  });

  it('shows an error toast for an invalid address, adds no row, and keeps the input', async () => {
    render(<ExposurePage />);

    await submitAddress('0x123');

    expect(await screen.findByText(/not a valid Ethereum address/i)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(2);
    expect(screen.getByLabelText('Ethereum address')).toHaveValue('0x123');
  });

  it('shows an error toast for an address already in the list', async () => {
    render(<ExposurePage />);

    await submitAddress(firstAddress);

    expect(await screen.findByText(/already in the list/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(2);
  });

  it('removes a row and shows a toast when its remove button is clicked', async () => {
    render(<ExposurePage />);

    fireEvent.click(await screen.findByRole('button', { name: `Remove ${secondAddress}` }));

    expect(screen.queryByText(secondAddress)).not.toBeInTheDocument();
    expect(await screen.findByText('Address removed')).toBeInTheDocument();
  });

  it('shows page 1 after removing the only row on page 2', async () => {
    const addresses = Array.from(
      { length: 21 },
      (_, index) => `0x${(index + 1).toString(16).padStart(40, '0')}`
    );
    useSanctionedStore.setState({ addresses });
    render(<ExposurePage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Next page' }));
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: `Remove ${addresses[20]}` }));

    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(20);
  });

  it('shows the empty state when no addresses are monitored', async () => {
    useSanctionedStore.setState({ addresses: [] });

    render(<ExposurePage />);

    expect(await screen.findByText(/No addresses are being monitored/)).toBeInTheDocument();
  });
});
