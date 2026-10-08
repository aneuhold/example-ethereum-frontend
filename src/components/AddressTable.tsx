import type { FC } from 'react';
import {
  columnFilteringFeature,
  columnVisibilityFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_inNumberRange,
  filterFn_includesString,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_basic,
  sortFn_text,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  Trash,
} from 'lucide-react';
import { toast } from 'sonner';
import { AmountCell } from '@/components/AmountCell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useSanctionedStore } from '@/hooks/useSanctionedStore';
import addressExportService from '@/services/AddressExport.service';
import type { Address } from '@/types/domain';

const PAGE_SIZES = [20, 50, 100];

const SORT_ICONS = { asc: ArrowUp, desc: ArrowDown } as const;
const ARIA_SORT = { asc: 'ascending', desc: 'descending' } as const;

const features = tableFeatures({
  columnFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString, inNumberRange: filterFn_inNumberRange },
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { text: sortFn_text, basic: sortFn_basic },
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  columnVisibilityFeature,
});

const helper = createColumnHelper<typeof features, Address>();

// Sort and filter function names are set explicitly because `'auto'` infers them from the first
// row's value, which is `undefined` while balances load. The balance columns read `BigNumber`s as
// numbers so the built-in `basic` sort and `inNumberRange` filter work on them.
const columns = helper.columns([
  helper.accessor('address', {
    header: 'Address',
    filterFn: 'includesString',
    // Hex strings, which `alphanumeric` would split into numeric digit runs
    sortFn: 'text',
    enableHiding: false,
    cell: ({ row }) => <span className="font-mono">{row.original.address}</span>,
  }),
  helper.accessor((row) => row.balance?.toNumber(), {
    id: 'balance',
    header: 'ETH Balance',
    filterFn: 'inNumberRange',
    sortFn: 'basic',
    sortUndefined: 'last',
    cell: ({ row: { original } }) => (
      <AmountCell
        isLoading={original.isLoading}
        text={original.balance && `${original.balance.toFormat(6)} ETH`}
      />
    ),
  }),
  helper.accessor((row) => row.balanceUsd?.toNumber(), {
    id: 'balanceUsd',
    header: 'USD Value',
    sortFn: 'basic',
    sortUndefined: 'last',
    cell: ({ row: { original } }) => (
      <AmountCell
        isLoading={original.isLoading}
        text={original.balanceUsd && `$${original.balanceUsd.toFormat(2)}`}
      />
    ),
  }),
  helper.display({
    id: 'status',
    header: 'Status',
    cell: ({ row }) =>
      row.original.error && (
        <Badge variant="destructive" className="text-xs">
          Failed to load
        </Badge>
      ),
  }),
  helper.display({
    id: 'actions',
    header: 'Actions',
    enableHiding: false,
    cell: ({ row, table }) => (
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Remove ${row.original.address}`}
        onClick={() => {
          // The page index is not reset on data changes, so step back when the page would be empty
          if (table.getRowModel().rows.length === 1) table.previousPage();
          useSanctionedStore.getState().removeAddress(row.original.address);
          toast.success('Address removed');
        }}
      >
        <Trash />
      </Button>
    ),
  }),
]);

/**
 * Checks for the `[min, max]` pair of input strings that the ETH range filter holds.
 */
const isRangeFilter = (value: unknown): value is [string, string] =>
  Array.isArray(value) && value.length === 2 && value.every((end) => typeof end === 'string');

/**
 * Table of monitored addresses with sorting, address search, an ETH balance range filter,
 * pagination, column hiding, and CSV / JSON export of every row. The table keeps its sorting,
 * filter, pagination, and visibility state, so using the controls re-renders only this component.
 */
export const AddressTable: FC<{ rows: Address[] }> = ({ rows }) => {
  const table = useTable({
    features,
    columns,
    data: rows,
    getRowId: (row) => row.address,
    initialState: { pagination: { pageIndex: 0, pageSize: 20 } },
    // `rows` changes every time a balance loads or refetches, and the default would return to page
    // 1 each time. The filters and the remove button handle a page left without rows instead.
    autoResetPageIndex: false,
  });
  const { pagination } = table.state;

  const addressFilter = table.getColumn('address')?.getFilterValue();
  const search = typeof addressFilter === 'string' ? addressFilter : '';
  const balanceFilter = table.getColumn('balance')?.getFilterValue();
  const [minBalance, maxBalance] = isRangeFilter(balanceFilter) ? balanceFilter : ['', ''];

  /**
   * Sets a column filter and returns to page 1, since the current page may no longer have rows.
   */
  const setFilter = (columnId: string, value: unknown) => {
    table.getColumn(columnId)?.setFilterValue(value);
    table.firstPage();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monitored Addresses</CardTitle>
        <CardDescription>ETH balance and USD value of each address</CardDescription>
      </CardHeader>
      <CardContent className="gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            aria-label="Search addresses"
            placeholder="Search addresses..."
            value={search}
            onChange={(event) => setFilter('address', event.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="max-w-xs font-mono"
          />
          <Input
            type="number"
            step="any"
            aria-label="Minimum ETH balance"
            placeholder="Min ETH"
            value={minBalance}
            onChange={(event) => setFilter('balance', [event.target.value, maxBalance])}
            className="w-28"
          />
          <Input
            type="number"
            step="any"
            aria-label="Maximum ETH balance"
            placeholder="Max ETH"
            value={maxBalance}
            onChange={(event) => setFilter('balance', [minBalance, event.target.value])}
            className="w-28"
          />
          <div className="ml-auto flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Columns3 />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllLeafColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(checked) => column.toggleVisibility(checked)}
                    >
                      {typeof column.columnDef.header === 'string'
                        ? column.columnDef.header
                        : column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={() => addressExportService.exportCsv(rows)}>
              <Download />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => addressExportService.exportJson(rows)}>
              <Download />
              Export JSON
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  if (!header.column.getCanSort()) {
                    return (
                      <TableHead key={header.id}>
                        <table.FlexRender header={header} />
                      </TableHead>
                    );
                  }
                  const sorted = header.column.getIsSorted();
                  const SortIcon = sorted ? SORT_ICONS[sorted] : ArrowUpDown;
                  return (
                    <TableHead key={header.id} aria-sort={sorted ? ARIA_SORT[sorted] : 'none'}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-2.5"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <table.FlexRender header={header} />
                        <SortIcon />
                      </Button>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getVisibleLeafColumns().length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No addresses match the filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>
            {table.getFilteredRowModel().rows.length} of {rows.length} addresses
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2">
              Rows per page
              <NativeSelect
                size="sm"
                value={pagination.pageSize}
                onChange={(event) => table.setPageSize(Number(event.target.value))}
              >
                {PAGE_SIZES.map((size) => (
                  <NativeSelectOption key={size} value={size}>
                    {size}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
            <span>
              Page {pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Previous page"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Next page"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
