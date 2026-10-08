# Implementation Decisions

## Features Implemented

<!-- List which features you chose to implement and why -->

### Feature 1: A. Dynamic Address Management

- **Why I chose this**: It is the core interaction the app is missing, and it makes large address lists possible for the other two features.
- **Time spent**: 50 minutes
- **Challenges faced**:
- **Key decisions**:
  - Upgraded to Tailwind CSS 4 and set up the shadcn CLI (`components.json`), so UI components come from the current registry instead of hand-edited v3 copies. `src/index.css` keeps the existing slate palette and system font.
  - `EtherAddressService` owns address format validation, shared by `EtherscanService` and the store.
  - `useSanctionedStore` owns normalization and duplicate detection, so every caller gets the same rules. `addAddress` trims and lowercases its input and throws `ValidationError` for an invalid or duplicate address; the UI shows the message as a toast. Lowercase is the canonical form, so addresses that differ only in letter case are one entry and share one balance query.
  - The list persists to `localStorage` through zustand's `persist` middleware, so no new dependency.

### Feature 2: B. Advanced Data Table with Pagination

- **Why I chose this**: A card grid stops being usable past a couple dozen addresses. A sortable, filterable table is how compliance users scan exposure.
- **Time spent**:
- **Challenges faced**:
- **Key decisions**:

### Feature 3: D. Performance & Caching

- **Why I chose this**: One request per address hits Etherscan's free-tier rate limit quickly at the address counts the data table targets. Request batching keeps the other features working.
- **Time spent**:
- **Challenges faced**:
- **Key decisions**:

## Technical Approach

### Architecture Decisions

<!-- Explain your architectural choices -->

### Libraries/Tools Added

<!-- List any new dependencies and justify them -->

Added:

- `sonner`: toasts. shadcn/ui deprecated its toast component in favor of Sonner.
- `next-themes`: the shadcn/ui Sonner wrapper reads the theme from it.
- `radix-ui`: primitives for the shadcn/ui Radix components.
- `cn`: class merging used by CLI-generated components.
- `@tailwindcss/vite`: Tailwind CSS 4 Vite plugin.

Removed:

- `clsx`, `tailwind-merge`: replaced by `cn`.
- `postcss`, `autoprefixer`: replaced by `@tailwindcss/vite`, which handles vendor prefixing.

Upgraded:

- `tailwindcss` 3 to 4: current shadcn/ui components target Tailwind CSS 4.
- `lucide-react` 0.468 to 1.52: latest version, per the shadcn/ui Tailwind CSS 4 upgrade guide.

### Performance Considerations

<!-- How did you ensure your changes don't degrade performance? -->

## Trade-offs Made

- Didn't update eslint to the latest and make the linting more strict. It would have taken more time than could be reasonably done with the other features that needed to be built. But if this was a real project with a team, and was greenfield, that kind of standard would have paid dividends for the life of the project.

## Testing Strategy

Tests are written as part of each feature rather than in a separate block at the end, so no feature is finished without its tests.

## What I Would Improve

<!-- Given unlimited time, what would you change or add? -->

## AI Assistance Used

<!-- Document any AI-assisted code per the requirements -->

- **Tool used**:
- **What was generated**:
- **How I reviewed/modified it**:

## Time Breakdown

| Block                         | Planned         | Actual                  |
| ----------------------------- | --------------- | ----------------------- |
| Fixes to existing code        | 25 minutes      | 31 minutes              |
| A. Dynamic Address Management | 45 minutes      | 50 minutes              |
| B. Advanced Data Table        | 60 minutes      |                         |
| D. Performance & Caching      | 35 minutes      |                         |
| Documentation                 | 15 minutes      |                         |
| **Total**                     | **180 minutes** | **81 minutes** (so far) |

Testing time is included in each block.

## Reflection

<!-- Overall thoughts on the assignment and your approach -->
