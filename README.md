# Frontend Take-Home Assignment: Sanctioned Address Monitor

A production-ready React & TypeScript foundation for monitoring Ethereum address balances. Your task is to extend this application with advanced features as outlined in `TAKE_HOME.md`.

## Assignment Overview

This project provides a complete, working application that includes professional-grade architecture, error handling, and user interface. You'll build upon this foundation to demonstrate senior-level frontend engineering skills.

**See `TAKE_HOME.md` for your specific assignment tasks.**

## Quick Start

### Prerequisites

- Node.js ≥ 20.19.0
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup (Optional)

Create a `.env` file in the project root:

```env
# Etherscan API Key (optional - get from https://etherscan.io/apis)
VITE_ETHERSCAN_API_KEY=your_api_key_here

# Return random balances and prices instead of calling Etherscan (optional, defaults to false)
VITE_USE_MOCK_API=true
```

## Current Architecture

### Tech Stack

- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui components, added with the shadcn CLI (`npx shadcn@latest add <component>`)
- **State Management**: Zustand for global state, TanStack Query for server state
- **API Client**: Axios with retry logic and error handling
- **Testing**: Vitest + React Testing Library
- **Build Tool**: Vite 7
- **Code Quality**: ESLint + Prettier + Husky

### What's Already Implemented

- **Clean Architecture**: Domain-driven structure with TypeScript
- **API Integration**: ETH balance and price fetching with retry logic
- **Professional UI**: shadcn/ui components with responsive design
- **Performance**: Optimized queries, caching, and error boundaries
- **Testing Setup**: Complete test infrastructure ready for use
- **Developer Experience**: Linting, formatting, type checking
- **Accessibility**: ARIA labels, semantic HTML, keyboard navigation

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── ErrorBoundary.tsx
├── config/             # Configuration and environment
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── services/           # API clients and other singleton services
├── test/               # Testing utilities
└── types/              # TypeScript type definitions
```

## Testing

```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code
npm run lint:fix     # Fix linting issues
npm run type-check   # Check TypeScript types
npm run format       # Format code with Prettier
npm run format:check # Check code formatting
```

## Current Features

The base application includes:

1. **Address Balance Monitoring**: Real-time ETH balance fetching for sanctioned addresses
2. **Price Integration**: Live ETH/USD price data from Etherscan
3. **Exposure Calculation**: Total USD exposure across all addresses
4. **Professional UI**: Card-based layout with status indicators
5. **Error Handling**: Comprehensive error states and retry logic
6. **Loading States**: Loading spinners and visual feedback
7. **Responsive Design**: Works on mobile, tablet, and desktop
8. **Type Safety**: Full TypeScript implementation with strict types
9. **Address Management**: Add addresses one at a time through a form and remove them from each table row. The list is saved to `localStorage`, and every add and remove shows a toast.
10. **Address Table**: Sort by address, ETH balance, or USD value; search addresses; filter by an ETH balance range; page through 20, 50, or 100 rows at a time; hide columns; and export every address as CSV or JSON.
11. **Batching, Caching, and Offline Support**: Balances are fetched up to 20 addresses per request. Each balance refreshes in the background every 5 minutes, or every 30 minutes for a zero balance, while the table keeps showing the cached value. Balances and the price are saved to `localStorage`, so they show right away on reload and while offline, with an offline badge.

## Your Mission

**See `TAKE_HOME.md` for detailed assignment instructions.**

You'll choose 2-3 advanced features to implement, such as:

- Dynamic address management with persistence
- Advanced data table with pagination and sorting
- Real-time dashboard enhancements
- Performance optimizations and caching
- Comprehensive theme system
- Testing excellence demonstration

## Submission

1. **Implement your chosen features** following the existing code quality standards
2. **Document your decisions** in `DECISIONS.md`
3. **Update this README** with your new features
4. **Include tests** for any new functionality

## Success Tips

- **Build upon the existing foundation** - don't reinvent what's working
- **Focus on code quality** - match the professional standards already established
- **Consider performance** - your changes should enhance, not degrade performance
- **Think about UX** - small details make a big difference
- **Document decisions** - explain your technical choices

## Configuration

### Environment Variables

All configuration is centralized in `src/config/env.ts` with validation and defaults.

### TypeScript

Strict configuration with path mapping (`@/*` imports) and comprehensive type checking.

### Code Quality

- Pre-commit hooks automatically lint and format code
- Comprehensive ESLint rules for React and TypeScript
- Prettier for consistent formatting

## Troubleshooting

### Common Issues

- **Node Version**: Ensure Node.js ≥ 20.19.0
- **API Rate Limits**: Add Etherscan API key to `.env`, or set `VITE_USE_MOCK_API=true` to use random data instead of the API
- **Build Errors**: Run `npm run type-check` to identify TypeScript issues

---

Ready to get started? Check `TAKE_HOME.md` for your assignment details.
