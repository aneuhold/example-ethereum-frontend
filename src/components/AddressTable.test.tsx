import BigNumber from 'bignumber.js';
import { describe, expect, it, vi } from 'vitest';
import addressExportService from '@/services/AddressExport.service';
import { fireEvent, render, screen } from '@/test/test-utils';
import type { Address } from '@/types/domain';
import { ApiError } from '@/types/error';
import { AddressTable } from './AddressTable';

describe('AddressTable', () => {
  /**
   * Returns a valid address for a number: 0x followed by the number as 40 hex characters.
   */
  const toAddress = (n: number) => `0x${n.toString(16).padStart(40, '0')}`;

  /**
   * Builds a loaded row worth `balance` ETH at an ETH price of 2,000.
   */
  const loadedRow = (address: string, balance: string): Address => ({
    address,
    balance: new BigNumber(balance),
    balanceUsd: new BigNumber(balance).multipliedBy(2000),
    isLoading: false,
    error: null,
  });

  const loadingRow = (address: string): Address => ({
    address,
    balance: undefined,
    balanceUsd: undefined,
    isLoading: true,
    error: null,
  });

  const failedRow = (address: string): Address => ({
    address,
    balance: undefined,
    balanceUsd: undefined,
    isLoading: false,
    error: new ApiError('Network error: Service unavailable', 503, 'NETWORK_ERROR'),
  });

  /**
   * Builds `count` loaded rows, where row n holds n ETH.
   */
  const manyRows = (count: number) =>
    Array.from({ length: count }, (_, index) => loadedRow(toAddress(index + 1), `${index + 1}`));

  /**
   * Returns the addresses shown on the current page, in display order.
   */
  const shownAddresses = () => screen.getAllByText(/^0x/).map((cell) => cell.textContent);

  const setInput = (label: string, value: string) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } });

  it('sorts by each column in both directions, with loading and failed rows last', () => {
    render(
      <AddressTable
        rows={[
          loadedRow(toAddress(3), '10'),
          loadedRow(toAddress(1), '2'),
          failedRow(toAddress(5)),
          loadedRow(toAddress(2), '0.5'),
          loadingRow(toAddress(4)),
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Address' }));
    expect(shownAddresses()).toEqual([1, 2, 3, 4, 5].map(toAddress));
    expect(screen.getByRole('columnheader', { name: 'Address' })).toHaveAttribute(
      'aria-sort',
      'ascending'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Address' }));
    expect(shownAddresses()).toEqual([5, 4, 3, 2, 1].map(toAddress));

    for (const column of ['ETH Balance', 'USD Value']) {
      // Amounts sort largest first on the first click
      fireEvent.click(screen.getByRole('button', { name: column }));
      expect(shownAddresses()).toEqual([3, 1, 2, 5, 4].map(toAddress));
      expect(screen.getByRole('columnheader', { name: column })).toHaveAttribute(
        'aria-sort',
        'descending'
      );
      fireEvent.click(screen.getByRole('button', { name: column }));
      expect(shownAddresses()).toEqual([2, 1, 3, 5, 4].map(toAddress));
    }
  });

  it('searches addresses regardless of letter case', () => {
    const match = '0x00000000219ab540356cbb839cbe05303d7705fa';
    render(<AddressTable rows={[loadedRow(toAddress(1), '1'), loadedRow(match, '2')]} />);

    setInput('Search addresses', 'AB540');

    expect(shownAddresses()).toEqual([match]);
  });

  it('filters by ETH range, leaving out rows without a balance, and returns to page 1', () => {
    render(
      <AddressTable rows={[...manyRows(45), loadingRow(toAddress(46)), failedRow(toAddress(47))]} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();

    setInput('Minimum ETH balance', '10');
    setInput('Maximum ETH balance', '20');

    expect(shownAddresses()).toEqual(
      manyRows(20)
        .slice(9)
        .map((row) => row.address)
    );
    expect(screen.getByText('11 of 47 addresses')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
  });

  it('pages through rows and changes the page size', () => {
    render(<AddressTable rows={manyRows(45)} />);

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(shownAddresses()).toHaveLength(20);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    expect(shownAddresses()[0]).toBe(toAddress(21));

    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Rows per page'), { target: { value: '50' } });
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
    expect(shownAddresses()).toHaveLength(45);
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('keeps the current page when the rows update', () => {
    const { rerender } = render(<AddressTable rows={manyRows(45)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));

    rerender(<AddressTable rows={[loadedRow(toAddress(1), '100'), ...manyRows(45).slice(1)]} />);

    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
  });

  it('hides a column unchecked in the Columns menu', async () => {
    render(<AddressTable rows={[loadedRow(toAddress(1), '2')]} />);

    // Radix opens the menu on pointer and keyboard events, not click
    fireEvent.keyDown(screen.getByRole('button', { name: 'Columns' }), { key: 'Enter' });
    const items = await screen.findAllByRole('menuitemcheckbox');
    expect(items.map((item) => item.textContent)).toEqual(['ETH Balance', 'USD Value', 'Status']);
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: 'USD Value' }));

    expect(screen.queryByRole('columnheader', { name: 'USD Value' })).not.toBeInTheDocument();
    expect(screen.queryByText('$4,000.00')).not.toBeInTheDocument();
    expect(screen.getByText('2.000000 ETH')).toBeInTheDocument();
  });

  it('exports every row, ignoring filters', () => {
    const exportCsv = vi.spyOn(addressExportService, 'exportCsv').mockImplementation(() => {});
    const exportJson = vi.spyOn(addressExportService, 'exportJson').mockImplementation(() => {});
    const rows = manyRows(3);
    render(<AddressTable rows={rows} />);
    setInput('Search addresses', toAddress(2));

    fireEvent.click(screen.getByRole('button', { name: 'Export CSV' }));
    fireEvent.click(screen.getByRole('button', { name: 'Export JSON' }));

    expect(exportCsv).toHaveBeenCalledWith(rows);
    expect(exportJson).toHaveBeenCalledWith(rows);
  });

  it('shows a message when no rows match the filters', () => {
    render(<AddressTable rows={manyRows(3)} />);

    setInput('Search addresses', 'not an address');

    expect(screen.getByText('No addresses match the filters.')).toBeInTheDocument();
    expect(screen.getByText('0 of 3 addresses')).toBeInTheDocument();
  });
});
