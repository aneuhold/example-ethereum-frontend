# Implementation Decisions

## Features Implemented

### Groundwork: Fixes to Existing Code

Fixes made before any feature work, each with a test that covers it.

- `ExposurePage` called `useBalance` inside `addresses.map`, so adding or removing an address changed the number of hooks between renders and crashed the page. `useBalances` replaces it with `useQueries`. A page test that changes the address list after the first render fails against the old pattern with "Rendered more hooks than during the previous render".
- The total exposure was summed from rounded, comma-formatted row strings parsed back into numbers. It now sums the unrounded `BigNumber` values. The page test uses values where the old method is off by one cent.
- `useSanctionedStore` lived in `main.tsx`, which `ExposurePage` imported, creating a circular import. Any test that imported the store also mounted the app. The store is now `src/hooks/useSanctionedStore.ts`.
- `useBalance` and `usePrice` each repeated the Etherscan request and error handling. `EtherscanService` now owns it, and the hooks call `getBalance` and `getEthPrice`. Cancellation handling also checked for `AbortError`, which axios does not throw; the service uses `axios.isCancel`.
- Each hook set its own retry and cache options, which overrode the test `QueryClient`'s `retry: false`. Retry now lives in the `QueryClient` defaults through `etherscanService.shouldRetryRequest`.
- The app called Etherscan's retired V1 API, so requests now use the V2 endpoint with `chainid`. The TypeScript and Vitest configs are merged into one `tsconfig.json` and one `vite.config.ts`, with Vitest upgraded to share the project's Vite 7.

### Feature 1: A. Dynamic Address Management

- **Why I chose this**: It is the core interaction the app is missing, and it makes large address lists possible for the other two features.
- **Time spent**: 50 minutes
- **Challenges faced**: Needing to update to Tailwind 4, but it turned out nice IMO.
- **Key decisions**:
  - Upgraded to Tailwind CSS 4 and set up the shadcn CLI (`components.json`), so UI components come from the current registry instead of hand-edited v3 copies. `src/index.css` keeps the existing slate palette and system font.
  - `EtherAddressService` owns address format validation, shared by `EtherscanService` and the store.
  - `useSanctionedStore` owns normalization and duplicate detection, so every caller gets the same rules. `addAddress` trims and lowercases its input and throws `ValidationError` for an invalid or duplicate address; the UI shows the message as a toast. Lowercase is the canonical form, so addresses that differ only in letter case are one entry and share one balance query.
  - The list persists to `localStorage` through zustand's `persist` middleware, so no new dependency.

### Feature 2: B. Advanced Data Table with Pagination

- **Why I chose this**: A card grid stops being usable past a couple dozen addresses. A sortable, filterable table is how compliance users scan exposure.
- **Time spent**: 46 minutes
- **Challenges faced**: Wanting to break apart the AddressTable component more.
- **Key decisions**:
  - TanStack Table v9 (`@tanstack/react-table`) holds the sorting, filter, pagination, and column visibility state. It is headless, so the table renders with shadcn/ui `Table` markup, and it is the same TanStack family as React Query. `AddressTable` registers only the features and the sort and filter functions it uses.
  - The ETH and USD columns read their `BigNumber`s as numbers, so the built-in `basic` sort and `inNumberRange` filter work without custom functions. Cells still render from the `BigNumber`s. Each column names its sort and filter function, because `'auto'` infers one from the first row's value, which is `undefined` while balances load. Loading and failed rows sort last in both directions.
  - `autoResetPageIndex: false`. TanStack resets to page 1 on every data change by default (`table_autoResetPageIndex` in `@tanstack/table-core`), and the rows change each time a balance loads or refetches. Instead, changing a filter returns to page 1, and removing the only row on a page goes back one page.
  - Column visibility is the bonus feature: a `Columns` menu hides the ETH, USD, and status columns. The address and remove button always show.
  - CSV and JSON export cover every monitored address in list order, regardless of filters, sorting, or hidden columns, with unrounded amounts.

### Feature 3: D. Performance & Caching

- **Why I chose this**: One request per address hits Etherscan's free-tier rate limit quickly at the address counts the data table targets. Request batching keeps the other features working.
- **Time spent**: 35 minutes
- **Challenges faced**:
  - React Query's `onlineManager` starts as online and only listens for `online` / `offline` events, so a page opened offline retried every query until it failed. `main.tsx` seeds it from `navigator.onLine` before render.
  - A page opened offline with nothing cached kept its price query pending (paused), so the loading spinner never went away. The page shows an offline message in that case instead.
- **Key decisions**:
  - Batching stays inside `EtherscanService.getBalance`, so `useBalances` keeps one query per address. Each call queues its address. The first call queued starts a 50 ms timer, and when it fires, everything queued is sent, so balance queries started within 50 ms of each other share requests. A fixed window does not depend on every call arriving in the same turn of the event loop. The queue is sent with Etherscan's `balancemulti` action in chunks of 20 addresses (the API's limit), one chunk after another. A failed chunk rejects only its own addresses, and an address missing from the response rejects with `INVALID_DATA`.
  - `getBalance` takes no `AbortSignal`. One request serves up to 20 queries, so one query's abort cannot cancel it. React Query only cancels a query whose `signal` was read, so a removed address's balance just goes into the cache unused.
  - Each balance query uses one function of its cached balance for both `staleTime` and `refetchInterval`: `appConfig.refreshInterval` (5 minutes by default), or six times that for a zero balance, which carries no exposure and rarely changes. Queries that load together start their refetch timers within milliseconds of each other, so their background refetches fall in the same 50 ms window and batch together again. Refetches pause while the tab is hidden (`refetchIntervalInBackground` stays `false`), and rows keep their cached balance during a refetch because the page reads `isLoading`, which is true only for the first fetch.
  - The query cache persists to `localStorage` through `PersistQueryClientProvider` and `createAsyncStoragePersister` (`createSyncStoragePersister` is deprecated). The default `gcTime` is 24 hours to match the persister's default `maxAge`, so persisted queries are not dropped before they expire.
  - When offline, the Total Exposure card shows an "Offline: showing cached data" badge, and queries pause instead of failing. A failed price refetch keeps showing the cached price; the price error alert shows only when there is no price at all.

## Technical Approach

### Architecture Decisions

- Adding services in the way they are now as singletons. Just a personal preference that I have seen to make things fairly organized. But it is just a personal decision. If working at a company that had a different opinion, would adopt what is there.
- Request batching lives inside `EtherscanService.getBalance`, so `useBalances` keeps one React Query query per address and caching, retries, and loading state stay per address.
- Address normalization, validation, and duplicate detection live in `useSanctionedStore`, so every caller gets the same rules.
- UI components come from the shadcn CLI (`components.json`) rather than hand-edited copies.

### Libraries/Tools Added

Added:

- `@tanstack/react-table`: headless table state for sorting, filtering, pagination, and column visibility.
- `sonner`: toasts. shadcn/ui deprecated its toast component in favor of Sonner.
- `next-themes`: the shadcn/ui Sonner wrapper reads the theme from it.
- `radix-ui`: primitives for the shadcn/ui Radix components.
- `cn`: class merging used by CLI-generated components.
- `@tailwindcss/vite`: Tailwind CSS 4 Vite plugin.
- `@tanstack/react-query-persist-client`: `PersistQueryClientProvider`, which restores and saves the query cache.
- `@tanstack/query-async-storage-persister`: stores the query cache in `localStorage`.

Removed:

- `clsx`, `tailwind-merge`: replaced by `cn`.
- `postcss`, `autoprefixer`: replaced by `@tailwindcss/vite`, which handles vendor prefixing.

Upgraded:

- `tailwindcss` 3 to 4: current shadcn/ui components target Tailwind CSS 4.
- `lucide-react` 0.468 to 1.52: latest version, per the shadcn/ui Tailwind CSS 4 upgrade guide.
- `@tanstack/react-query` 5.82 to 5.104: required by `@tanstack/react-query-persist-client`.

### Performance Considerations

- The address table renders one page of at most 100 rows, so the DOM stays the same size at any address count.
- The table's `features` and `columns` are defined at module scope, so they are the same objects on every render and TanStack Table does not rebuild its row models for them. The table keeps its own state, so typing in a filter re-renders only the table, not the page.
- Balances are fetched with Etherscan's `balancemulti`, so 100 addresses take 5 requests instead of 100.
- Zero balances refetch every 30 minutes instead of every 5 (with the default refresh interval), and no balances refetch while the tab is hidden.

## Trade-offs Made

- Pagination instead of virtual scrolling for the address table. A page caps the rendered rows at 100, which keeps the DOM small without a virtualization library.
- No column resizing in the address table.
- No performance monitoring.
- No Service Worker, so the app shell itself does not load offline; only data already in the query cache does.
- Balance chunks are sent one after another with no strict throttle to Etherscan's 3 calls/second limit. A burst over the limit comes back as `API_ERROR`, which the existing retry with backoff handles.
- Didn't update eslint to the latest and make the linting more strict. It would have taken more time than could be reasonably done with the other features that needed to be built. But if this was a real project with a team, and was greenfield, that kind of standard would have paid dividends for the life of the project.
- Didn't spend more time on the visual look and feel. Would have like to make it look better. Didn't want it to look like AI slop though so didn't let the AI go crazy and do something default.
- Didn't spend time on the mobile view. This is normally a huge no-no for me, but was trying to satisfy the requirements.

## Testing Strategy

Tests are written as part of each feature rather than in a separate block at the end, so no feature is finished without its tests. The suite is 60 tests across 7 files, run with Vitest and React Testing Library.

- Services: `EtherscanService` (requests, error mapping, batching, mock mode) with `axios.get` mocked; `EtherAddressService`; `AddressExportService` (CSV and JSON content).
- Hooks and store: `useBalances` (per-address refresh timing) and `useSanctionedStore` (normalization, validation, persistence).
- Components and page: `AddressTable` (sorting, filtering, pagination, column visibility, export) and `ExposurePage` (loading, error, offline, add and remove flows) with the services mocked.

Key fixes were checked by making their tests fail first: the hooks-in-a-loop crash, removing the only row on page 2, the zero-balance refresh rule, and the 50 ms batch window.

Each feature was also checked in the running app through the Playwright MCP before its PR.

## What I Would Improve

- Break `AddressTable` into composed components (toolbar, sortable header, pagination, row).
- Design and test the mobile layout.
- Upgrade ESLint and enable stricter rules, including the `service-file-structure` rule the services follow.
- Add CI (GitHub Actions running lint, type-check, tests, and build) on every PR.
- Add a strict throttle for Etherscan's 3 calls/second limit instead of relying on retry.
- Add performance monitoring of API response times.
- Add a Service Worker so the app shell loads offline.

## AI Assistance Used

- **Tool used**: Claude Code
- **What was generated**: A lot of the code. Some was still hand-written. But you will see in the transcripts. That will be sent in an email in a zip file.
- **How I reviewed/modified it**: Mostly line by line. Some things were paid more attention to than others. Testing as well manually and by running commands. I was the only one that made commits. That is my boundary to know what I have already reviewed.

## Time Breakdown

| Block                         | Planned         | Actual          |
| ----------------------------- | --------------- | --------------- |
| Fixes to existing code        | 25 minutes      | 31 minutes      |
| A. Dynamic Address Management | 45 minutes      | 50 minutes      |
| B. Advanced Data Table        | 60 minutes      | 46 minutes      |
| D. Performance & Caching      | 35 minutes      | 35 minutes      |
| Documentation                 | 15 minutes      | 18 minutes      |
| **Total**                     | **180 minutes** | **180 minutes** |

Testing time is included in each block.

Getting the starter app running (Etherscan V2 migration, TypeScript and Vitest config fixes, Prettier editor setup) took about 45 minutes and is not counted in the time breakdown.

## Reflection

It was a fun assignment. Learned some capabilities of tanstack that I didn't know were there before and want to try those out in other side projects. I appreciate the opportunity to play with this project!
