import { useSanctionedStore } from '@/hooks/useSanctionedStore';
import etherscanService from '@/services/Etherscan.service';
import { render, screen } from '@/test/test-utils';
import { ApiError } from '@/types/error';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ExposurePage from './ExposurePage';

describe('ExposurePage', () => {
  const firstAddress = '0x0000000000000000000000000000000000000001';
  const secondAddress = '0x0000000000000000000000000000000000000002';
  const failingAddress = '0x0000000000000000000000000000000000000003';

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
});
