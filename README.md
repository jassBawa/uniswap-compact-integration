# Uniswap Compact Protocol Integration

A Next.js frontend integration for the Uniswap Compact Protocol - an ownerless ERC-6909 contract for cross-chain token commitments.

## Overview

This project implements a complete frontend interface for interacting with the Uniswap Compact smart contract on the Sepolia testnet. The Compact Protocol allows users to deposit assets (ETH or ERC-20 tokens) into time-locked positions that can be claimed using a dual-signature mechanism (sponsor + allocator).

### Assignment Context

This implementation was developed as part of an assignment to understand and integrate the [Uniswap Compact Protocol](https://github.com/Uniswap/the-compact). The goal was to create a basic but functional frontend that demonstrates understanding of the protocol's core concepts.

---

## Architecture

### Tech Stack

- **Next.js 16.1.1** - App Router framework
- **React 19.2.3** - UI library
- **TypeScript 5** - Type safety
- **wagmi 3** + **viem 2** - Ethereum interaction
- **TanStack Query 5** - Server state management
- **Tailwind CSS 4** - Styling

### Directory Structure

```
compact-integration/
├── app/                    # Next.js App Router pages
├── components/
│   ├── ui/                 # Atomic UI components (Button, Card, Input, etc.)
│   ├── DepositTab.tsx      # Deposit form component
│   ├── WithdrawTab.tsx     # Withdraw/forced withdrawal component
│   └── ClaimTab.tsx        # Claim form component (under development)
├── hooks/
│   ├── useDeposit.ts       # Deposit transaction hook
│   ├── useWithdraw.ts      # Withdraw/forced withdrawal hooks
│   ├── useCompactClaim.ts  # Claim signature generation & submission
│   └── ...                 # Utility hooks
├── lib/
│   ├── abis/protocol.ts    # Compact contract ABI
│   ├── constants.ts        # Protocol constants & helpers
│   └── wagmi.ts            # Wagmi configuration
└── types/                  # TypeScript type definitions
```

---

## Core Concepts

### ERC-6909 Multi-Token System

The Compact Protocol uses ERC-6909 to represent deposits as tokens. Each deposit gets a unique `lockId` that serves as the ERC-6909 token ID. The lockId is computed as:

```
lockId = (lockTag << 160) | tokenAddress
```

- **lockTag** (96 bits): Encodes scope (chain-specific vs multichain), reset period, and allocator
- **tokenAddress** (160 bits): The underlying asset token address (or zero address for ETH)

### Lock Parameters

| Parameter | Description |
|-----------|-------------|
| **Scope** | `Multichain` (0) or `Chain-Specific` (1) |
| **Reset Period** | Time delay before forced withdrawal can complete (15s to 30 days) |
| **LockTag** | 12-byte identifier encoding scope + reset period + allocator |

### Forced Withdrawal Flow

The protocol implements a **time-delayed forced withdrawal** mechanism:

```
1. Deposit → User has ERC-6909 tokens representing their deposit
2. Enable Forced Withdrawal → Status changes to "Pending", countdown begins
3. Wait Reset Period → Configurable delay (15s, 30s, 10min, 1h, 1d, etc.)
4. Execute Withdrawal → Status changes to "Enabled", user can withdraw
```

This protects against griefing while ensuring users can always access their funds.

---

## Implementation Details

### Deposit Flow

**File:** [hooks/useDeposit.ts](hooks/useDeposit.ts)

The deposit flow supports both native ETH and ERC-20 tokens:

```typescript
// Key steps:
1. User selects token type (native/erc20), amount, reset period, scope
2. Build lockTag using: buildLockTag(scope, resetPeriod, allocatorHex)
3. Call appropriate contract function:
   - Native: depositNative(lockTag, recipient) payable
   - ERC-20: depositERC20(tokenAddress, lockTag, amount, recipient)
4. Transaction triggers ERC-6909 minting with unique lockId
```

**Key Functions:**
- `buildLockTag()` in [lib/constants.ts](lib/constants.ts) - Encodes scope + reset period into 12-byte lockTag
- Handles ETH wrapping for native deposits
- Returns lockId for later reference

### Withdraw Flow

**File:** [components/WithdrawTab.tsx](components/WithdrawTab.tsx), [hooks/useWithdraw.ts](hooks/useWithdraw.ts)

The withdraw flow implements the forced withdrawal mechanism:

```
1. Query lock details (balance, lock parameters)
2. Query forced withdrawal status:
   - 0: Disabled (can enable)
   - 1: Pending (waiting for reset period)
   - 2: Enabled (can withdraw)
3. If status = 0: User clicks "Enable Forced Withdrawal"
4. Contract records timestamp, status changes to Pending
5. After reset period elapses: Status changes to Enabled
6. User can now execute forcedWithdrawal(lockId, recipient, amount)
```

**Contract Functions Used:**
- `getLockDetails(id)` - Returns token, resetPeriod, scope, lockTag
- `balanceOf(account, id)` - Returns user's ERC-6909 balance
- `getForcedWithdrawalStatus(account, id)` - Returns status and withdrawableAt timestamp
- `enableForcedWithdrawal(id)` - Initiates the countdown
- `forcedWithdrawal(id, recipient, amount)` - Executes withdrawal after delay

### Claim Flow (Under Development)

**File:** [hooks/useCompactClaim.ts](hooks/useCompactClaim.ts), [components/ClaimTab.tsx](components/ClaimTab.tsx)

**Status:** ⚠️ Not fully functional - signatures not being verified correctly by contract

The claim flow is intended for the allocator-based withdrawal mechanism, which bypasses the forced withdrawal delay by using dual EIP-712 signatures:

```
1. Sponsor signs the claim data (via wallet)
2. Allocator signs the claim data (via private key)
3. Both signatures submitted to claim() function
4. Contract verifies both signatures before executing transfer
```

**Current Implementation:**

```typescript
// EIP-712 Domain (matches contract's HashLib)
const COMPACT_DOMAIN = {
  name: "The Compact",
  version: "1",
  chainId: BigInt(CHAIN_ID),  // 11155111 (Sepolia)
  verifyingContract: PROTOCOL_ADDRESS,
};

// EIP-712 Types matching contract's hash computation
const COMPACT_TYPES = {
  Compact: [
    { name: 'arbiter', type: 'address' },
    { name: 'sponsor', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'expires', type: 'uint256' },
    { name: 'lockTag', type: 'bytes12' },
    { name: 'token', type: 'address' },
    { name: 'amount', type: 'uint256' },
  ]
};
```

**Steps to Complete:**

1. **Debug signature mismatch** - The contract's `HashLib.sol` reads `lockTag` and `token` separately from calldata at different offsets than standard ABI encoding. Current approach needs verification.

2. **Test with SimpleAllocator** - The `the-compact/src/SimpleAllocator.sol` can be used for local testing with predictable signatures.

3. **Consider alternative approaches**:
   - Use the allocator's `claim()` function directly with proper EIP-712 encoding
   - Implement the signature generation in a backend service for better key management
   - Use `eth_signTypedData` with the exact domain separator from the contract

**Current Issues:**
- `InvalidSignature` error from contract despite correct-looking signatures
- Domain separator mismatch between frontend and contract
- Possible mismatch in how `lockTag` and `token` are packed in the hash

---

## Configuration

### Environment Variables

Create a `.env.local` file:

```env
# Wallet connect project ID (get from https://cloud.walletconnect.com)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id

# Private key for allocator (for claim signatures - development only)
NEXT_PUBLIC_ALLOCATOR_PRIVATE_KEY=0x...
```

### Constants

**File:** [lib/constants.ts](lib/constants.ts)

```typescript
CHAIN_ID = 11155111           // Sepolia testnet
PROTOCOL_ADDRESS = 0x...      // Compact contract address
RPC_URL = 'https://...'       // Sepolia RPC endpoint

// Reset periods (indexed by enum value)
RESET_PERIODS = {
  0: { label: "15 Seconds", seconds: 15 },
  1: { label: "30 Seconds", seconds: 30 },
  2: { label: "10 Minutes", seconds: 600 },
  3: { label: "1 Hour", seconds: 3600 },
  4: { label: "1 Day", seconds: 86400 },
  5: { label: "5 Days", seconds: 432000 },
  6: { label: "10 Days", seconds: 864000 },
  7: { label: "30 Days", seconds: 2592000 },
}
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or compatible wallet
- Sepolia ETH for testing

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to use the application.

---

## Testing Guide

### Deposit & Withdraw (Working)

1. Connect wallet (make sure you're on Sepolia)
2. Go to Deposit tab, select amount and reset period
3. Click Deposit and confirm in wallet
4. Copy the generated Lock ID
5. Go to Withdraw tab, paste Lock ID
6. See "Enable Forced Withdrawal" button (status: Disabled)
7. Click to enable, wait for reset period
8. Execute withdrawal after countdown completes

### Claim (Not Working - Under Development)

1. Go to Claim tab
2. Enter Lock ID, amount, recipient
3. Click Submit Claim
4. **Issue:** Contract rejects signatures with "Invalid Sig"

---

## Contract Interaction Summary

| Function | Description | UI Component |
|----------|-------------|--------------|
| `depositNative` | Deposit ETH with lock parameters | DepositTab |
| `depositERC20` | Deposit ERC-20 with lock parameters | DepositTab |
| `getLockDetails` | Query lock metadata | WithdrawTab |
| `balanceOf` | Query ERC-6909 balance | WithdrawTab |
| `getForcedWithdrawalStatus` | Query withdrawal state | WithdrawTab |
| `enableForcedWithdrawal` | Start countdown | WithdrawTab |
| `forcedWithdrawal` | Execute after delay | WithdrawTab |
| `claim` | Dual-signature claim | ClaimTab ⚠️ |

---

## Resources

- [Uniswap Compact Repo](https://github.com/Uniswap/the-compact)
- [ERC-6909 Standard](https://eips.ethereum.org/EIPS/eip-6909)
- [EIP-712: Typed Data Signing](https://eips.ethereum.org/EIPS/eip-712)
- [Wagmi Documentation](https://wagmi.sh/)
- [Viem Documentation](https://viem.sh/)

---
