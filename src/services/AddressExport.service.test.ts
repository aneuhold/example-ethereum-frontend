import BigNumber from 'bignumber.js';
import { describe, expect, it, vi } from 'vitest';
import type { Address } from '@/types/domain';
import { ApiError } from '@/types/error';
import addressExportService from './AddressExport.service';

describe('AddressExportService', () => {
  const loadedAddress = '0x0000000000000000000000000000000000000001';
  const failedAddress = '0x0000000000000000000000000000000000000002';

  const rows: Address[] = [
    {
      address: loadedAddress,
      balance: new BigNumber('0.500003'),
      balanceUsd: new BigNumber('1000.006'),
      isLoading: false,
      error: null,
    },
    {
      address: failedAddress,
      balance: undefined,
      balanceUsd: undefined,
      isLoading: false,
      error: new ApiError('Network error: Service unavailable', 503, 'NETWORK_ERROR'),
    },
  ];

  /**
   * Reads a Blob as text. jsdom's Blob has no `text()`, but its FileReader can read one.
   */
  const readText = (blob: Blob) =>
    new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(String(reader.result)));
      reader.readAsText(blob);
    });

  /**
   * Runs an export and returns the name and contents of the downloaded file.
   */
  const download = async (runExport: () => void) => {
    // jsdom has no Blob URLs and does not download files
    const createObjectURL = vi.fn<(file: Blob | MediaSource) => string>(() => 'blob:export');
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = () => {};
    let fileName = '';
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement
    ) {
      fileName = this.download;
    });

    runExport();

    const [file] = createObjectURL.mock.calls[0];
    if (!(file instanceof Blob)) throw new Error('The export created no Blob');
    return { fileName, text: await readText(file) };
  };

  describe('exportCsv', () => {
    it('downloads every row with unrounded amounts and empty fields for missing amounts', async () => {
      expect(await download(() => addressExportService.exportCsv(rows))).toEqual({
        fileName: 'sanctioned-addresses.csv',
        text: [
          'address,balance,balanceUsd',
          `${loadedAddress},0.500003,1000.006`,
          `${failedAddress},,`,
        ].join('\n'),
      });
    });
  });

  describe('exportJson', () => {
    it('downloads every row with unrounded amounts and null for missing amounts', async () => {
      const { fileName, text } = await download(() => addressExportService.exportJson(rows));

      expect(fileName).toBe('sanctioned-addresses.json');
      expect(JSON.parse(text)).toEqual([
        { address: loadedAddress, balance: '0.500003', balanceUsd: '1000.006' },
        { address: failedAddress, balance: null, balanceUsd: null },
      ]);
    });
  });
});
