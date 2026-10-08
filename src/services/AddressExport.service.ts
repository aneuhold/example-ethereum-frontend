import type { Address } from '@/types/domain';

/**
 * Downloads monitored addresses as CSV or JSON files. Each file holds the given rows in order, with
 * unrounded amounts.
 */
class AddressExportService {
  /**
   * Downloads rows as `sanctioned-addresses.csv`, with an empty field where a row has no amount.
   * Addresses and fixed-point amounts contain no commas or quotes, so no field needs escaping.
   * @param rows - Rows to export
   */
  exportCsv(rows: Address[]): void {
    // `join` writes `null` as an empty field
    const lines = this.toRecords(rows).map(({ address, balance, balanceUsd }) =>
      [address, balance, balanceUsd].join(',')
    );
    this.downloadFile(
      ['address,balance,balanceUsd', ...lines].join('\n'),
      'sanctioned-addresses.csv',
      'text/csv'
    );
  }

  /**
   * Downloads rows as a JSON array in `sanctioned-addresses.json`, with `null` where a row has no
   * amount.
   * @param rows - Rows to export
   */
  exportJson(rows: Address[]): void {
    this.downloadFile(
      JSON.stringify(this.toRecords(rows), null, 2),
      'sanctioned-addresses.json',
      'application/json'
    );
  }

  /**
   * Converts rows to records with amounts as unrounded strings, `null` where a row has no amount.
   */
  private toRecords(rows: Address[]) {
    return rows.map(({ address, balance, balanceUsd }) => ({
      address,
      balance: balance?.toFixed() ?? null,
      balanceUsd: balanceUsd?.toFixed() ?? null,
    }));
  }

  /**
   * Saves text as a file through a temporary Blob URL.
   * @param content - File contents
   * @param fileName - Name the browser saves the file as
   * @param type - MIME type of the contents
   */
  private downloadFile(content: string, fileName: string, type: string): void {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}

const addressExportService = new AddressExportService();
export default addressExportService;
