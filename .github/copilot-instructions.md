# Supply Chain Tracker - AI Coding Agent Instructions

## Project Overview

Educational blockchain DApp for supply chain traceability built with **Solidity (Foundry) + React (Vite) + Ethers v6**. Implements role-based tokenized flow: Producer → Factory → Retailer → Consumer with admin approval workflow.

The requirements are documented in `README.md`, always refer to it when in doubt.

## Architecture

### Two-Tier Monorepo Structure

- **`supply-chain-tracker/sc/`**: Foundry smart contracts (Solidity ^0.8.20)
- **`supply-chain-tracker/web/`**: React + TypeScript frontend with Vite

### Smart Contract (`sc/src/SupplyChain.sol`)

Single contract handles all logic with string-based roles (`"Producer"`, `"Factory"`, `"Retailer"`, `"Consumer"`, `"Admin"`). Key patterns:

- **Indexed pagination**: `getPendingBySender/ByRecipient(offset, limit)` with O(1) insert/remove via `pendingBySender/Recipient` arrays + position mappings (see ADR 002)
- **Parent-child token lineage**: `parentId=0` for raw materials, `>0` for derived products with stock consumption
- **3-step transfer flow**: `requestTransfer()` → `acceptTransfer()/rejectTransfer()` with `TransferStatus` enum
- **Role validation**: Producer can only transfer to Factory; Factory to Retailer; Retailer to Consumer

### Frontend (`web/src/`)

- **Context/Hooks pattern**: `Web3Provider.tsx` (global ethers instances) + `useWallet.ts` (consumer hook with `connect()`, balance, network info)
- **Contract abstraction**: `lib/contract.ts` centralizes all SC calls; NEVER use TypeChain types directly in components
- **Dual provider strategy**:
  - Reads: `JsonRpcProvider` (avoids Anvil restart BlockOutOfRangeError)
  - Writes: `BrowserProvider` (MetaMask signer)
- **Auto-generated config**: `config/contracts.ts` created by `scripts/generate-contract-config.js` from Foundry broadcast JSON

## Critical Workflows

### Development Loop

```bash
# Terminal 1: Start local chain (keep running)
cd supply-chain-tracker/sc && anvil

# Terminal 2: Deploy contract
forge script script/Deploy.s.sol:DeploySupplyChain --rpc-url http://localhost:8545 --broadcast

# Terminal 3: Sync contract config to frontend
npm run regen:contracts  # From web/ directory

# Terminal 4: Start frontend
cd supply-chain-tracker/web && npm run dev
```

### Contract Changes Checklist

1. Edit `sc/src/SupplyChain.sol`
2. Run `forge build` (from `sc/`)
3. Redeploy: `forge script script/Deploy.s.sol:DeploySupplyChain \
--rpc-url http://localhost:8545 \
--private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
--broadcast`
4. Regenerate frontend config: `npm run regen:contracts` (from `web/`)
5. Update `web/src/lib/contract.ts` helpers if ABI changed

### Testing Protocol (Strict TDD)

Follow **one-test-at-a-time** RED→GREEN→COMMIT cycle (see `docs/guides/METODOLOGY_PROMPT.md`):

- **Solidity**: `forge test` (27 tests; see `sc/test/SupplyChain.t.sol`)
- **Frontend**: `npm run test` (88 tests; Vitest + @testing-library/react)
- Use `.skip` to isolate tests; commit RED baseline before implementing
- Mock `lib/contract.ts` functions in component tests, not ethers providers
- Refer to `docs/guides/UI_TESTING_RESILIENCE_STRATEGY.md` to write resilient UI tests

## Code Conventions

### Smart Contract

- Spanish NatSpec comments (existing pattern)
- Role strings validated with keccak256 comparisons (legacy pattern; inefficient but established)
- Always emit events for state changes: `TokenCreated`, `TransferRequested`, `TransferAccepted/Rejected`, `UserStatusChanged`

### Frontend

- **Component structure**: `components/{layout,network,tokenOps,ui,wallet}/`
- **Async actions**: Wrap contract calls in try/catch; show user-facing errors in DOM (not alerts)
- **Form validation**: Disable buttons for invalid states; validate addresses with `ethers.isAddress()`
- **User events**: Use `@testing-library/user-event` (realistic interactions) over `fireEvent` in tests

### Critical Helpers

- **`lib/contract.ts`**: Maps SC data to frontend types (e.g., `UserInfo`, `PendingTransfer`)
- **`lib/enums.ts`**: Enum mappings (`UserStatus.Approved`, `TransferStatus.Pending`)
- **`lib/web3.ts`**: `web3Service` for network operations (getCurrentNetwork, switchNetwork)

## Common Pitfalls

1. **Anvil restarts**: Frontend cached block height causes errors → always use `JsonRpcProvider` for reads
2. **Contract address sync**: After redeploy, MUST run `regen:contracts` or frontend uses stale address
3. **Role capitalization**: SC expects exact strings (`"Producer"` not `"producer"`)
4. **Pagination off-by-one**: SC uses index+1 in position maps (0 = absent)
5. **LocalStorage persistence**: `Web3Provider` saves/restores `web3:address`; handle MetaMask events (`accountsChanged`, `chainChanged`)

## Documentation Patterns

- **Architecture Decisions**: `docs/adr/` with status badges (✅ Implemented, ⚠️ Not Selected)
- **Progress Tracking**: deprecate `docs/progress/STATUS_*.md` (numbered chronologically), `ROADMAP.md` (checklists). Only use `docs/DELIVERY.md` for final delivery tracking. `docs/DELIVERY.md` document supersedes previous delivery tracking files. Old progress docs are kept for historical reference only. Update `docs/DELIVERY.md` as new milestones are reached or priorities shift. The milestones section at the end of `docs/DELIVERY.md` should be updated accordingly as we define a new milestone, with the incremental number of the milestone starting from 1 as title, together with a brief description of the main features or changes included in that milestone. We don't need to track every small change and/or implementation details, but a good level of description to understand what was delivered in that milestonea aligned with the overall project goals.
- **Feature Analysis**: `docs/features/*_ANALYSIS.md` for complex features before implementation following `docs/guides/PROMPT_TEMPLATE.md` guide

## Key Files to Understand First

1. `supply-chain-tracker/sc/src/SupplyChain.sol` (lines 1-150: structs/enums/state)
2. `supply-chain-tracker/web/src/contexts/Web3Provider.tsx` (global provider setup)
3. `supply-chain-tracker/web/src/lib/contract.ts` (SC interaction layer)
4. `docs/adr/002-pending-transfers-migration-to-c2.md` (pagination strategy)
5. `docs/guides/METODOLOGY_PROMPT.md` (TDD workflow)

## When Stuck

- Ask me for help!
- Check `docs/DELIVERY.md` for feature status
