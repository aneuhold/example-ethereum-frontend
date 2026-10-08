# Sanctioned Address Monitor

A React and TypeScript app that monitors ETH balances and total USD exposure across a list of sanctioned Ethereum addresses, using the Etherscan API.

Implementation decisions, trade-offs, and time spent are in [DECISIONS.md](DECISIONS.md). The original assignment is in [TAKE_HOME.md](TAKE_HOME.md).

## Features

- **Exposure monitoring**: ETH balance and USD value for each address, plus total USD exposure across all addresses, using the live ETH/USD price from Etherscan.
- **Address management**: add addresses through a form and remove them from each table row. Addresses are validated, normalized to lowercase, and checked for duplicates. The list is saved to `localStorage`, and every add and remove shows a toast.
- **Address table**: sort by address, ETH balance, or USD value; search addresses; filter by an ETH balance range; page through 20, 50, or 100 rows at a time; hide columns; and export every address as CSV or JSON.
- **Request batching**: balance requests made within 50 ms of each other are combined into Etherscan `balancemulti` requests of up to 20 addresses.
- **Caching and background refresh**: each balance refreshes in the background every 5 minutes, or every 30 minutes for a zero balance, while the table keeps showing the cached value. Refreshes pause while the tab is hidden.
- **Offline support**: balances and the price are saved to `localStorage`, so they show right away on reload and while offline, with an offline badge.

## Quick Start

### Prerequisites

- Node.js 20.19.0 or later
- npm

### Installation

```bash
npm install
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env`. All variables are optional; `src/config/env.ts` reads them and applies the defaults.

| Variable                 | Default                           | Description                                                                                     |
| ------------------------ | --------------------------------- | ----------------------------------------------------------------------------------------------- |
| `VITE_ETHERSCAN_API_KEY` | none                              | Etherscan API key. Without one, requests are rate-limited. Get one at https://etherscan.io/apis |
| `VITE_API_BASE_URL`      | `https://api.etherscan.io/v2/api` | Etherscan API base URL                                                                          |
| `VITE_REFRESH_INTERVAL`  | `300000`                          | Balance and price refresh interval in milliseconds                                              |
| `VITE_RETRY_ATTEMPTS`    | `3`                               | Retry attempts for failed requests                                                              |
| `VITE_RETRY_DELAY`       | `1000`                            | Base retry delay in milliseconds, doubled on each attempt                                       |
| `VITE_USE_MOCK_API`      | `false`                           | `true` returns random balances and prices instead of calling Etherscan                          |

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4 and shadcn/ui components, added with the shadcn CLI (`npx shadcn@latest add <component>`)
- **State**: Zustand for the address list, TanStack Query for server state, persisted with `@tanstack/react-query-persist-client`
- **Table**: TanStack Table
- **API client**: Axios
- **Testing**: Vitest and React Testing Library
- **Build tool**: Vite 7
- **Code quality**: ESLint and Prettier

## Project Structure

```
src/
├── components/          # App components (address form, address table)
│   ├── ui/              # shadcn/ui components
│   └── ErrorBoundary.tsx
├── config/              # Environment configuration
├── hooks/               # React hooks and the Zustand store
├── pages/               # Page components
├── services/            # Etherscan client, address validation, export
├── test/                # Testing utilities
└── types/               # TypeScript type definitions
```

## Scripts

```bash
npm run dev           # Start the development server
npm run build         # Type-check and build for production
npm run preview       # Preview the production build
npm run test          # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:ui       # Run tests with the Vitest UI
npm run test:coverage # Run tests with coverage
npm run lint          # Lint
npm run lint:fix      # Fix lint issues
npm run type-check    # Check TypeScript types
npm run format        # Format with Prettier
npm run format:check  # Check formatting
```

## Troubleshooting

- **API rate limits**: add an Etherscan API key to `.env`, or set `VITE_USE_MOCK_API=true` to use random data.
- **Build errors**: run `npm run type-check` to find TypeScript issues.
