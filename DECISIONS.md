# Implementation Decisions

## Features Implemented

<!-- List which features you chose to implement and why -->

### Feature 1: A. Dynamic Address Management

- **Why I chose this**: It is the core interaction the app is missing, and it makes large address lists possible for the other two features.
- **Time spent**:
- **Challenges faced**:
- **Key decisions**:

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

### Performance Considerations

<!-- How did you ensure your changes don't degrade performance? -->

## Trade-offs Made

<!-- What shortcuts did you take due to time constraints? -->

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

| Block                         | Planned         | Actual |
| ----------------------------- | --------------- | ------ |
| Fixes to existing code        | 25 minutes      |        |
| A. Dynamic Address Management | 45 minutes      |        |
| B. Advanced Data Table        | 60 minutes      |        |
| D. Performance & Caching      | 35 minutes      |        |
| Documentation                 | 15 minutes      |        |
| **Total**                     | **180 minutes** |        |

Testing time is included in each block.

## Reflection

<!-- Overall thoughts on the assignment and your approach -->
