# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js frontend demo application for **The Compact protocol** - Uniswap Labs' ownerless ERC6909 contract for cross-chain token commitments. The UI demonstrates deposit functionality and protocol parameter configuration.

## Commands

```bash
npm run dev      # Start development server on http://localhost:3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture

### Tech Stack
- **Next.js 16.1.1** with App Router
- **React 19.2.3** with TypeScript 5
- **Tailwind CSS 4** for styling (zinc-950 dark theme)
- **wagmi 3** + **viem 2** for Ethereum interaction
- **TanStack Query 5** for async state

### Directory Structure
- `app/` - Next.js App Router pages and layouts
- `components/` - React components (WalletConnect, ProtocolTabs, DepositTab, atomic UI components)
- `lib/` - Configuration (wagmi.ts, constants.ts) and utilities (utils.ts)
- `the-compact/` - Submodule with Solidity smart contracts

### Key Constants (lib/constants.ts)
- `CHAIN_ID`: 11155111 (Sepolia testnet)
- `PROTOCOL_ADDRESS`: `0x00000000000000171ede64904551eedf3c6c9788`
- `RPC_URL`: `https://rpc.sepolia.org`
- `DEFAULT_LOCK_TAG`: `0x000000000000000000000000`

### Web3 Configuration (lib/wagmi.ts)
- Uses wagmi `createConfig` with Sepolia chain only
- HTTP transport via public Sepolia RPC
- QueryClient configured with 30s staleTime, no refetchOnWindowFocus

### Component Patterns
- Client components marked with `'use client'` directive
- Atomic UI components in `components/ui/` (Button, Card, Input, Badge, Tabs)
- Format utilities in `lib/utils.ts` (formatAddress, formatBalance)

## Network

The app is configured for **Sepolia testnet only** (11155111). All protocol interactions require a wallet connection on Sepolia.
