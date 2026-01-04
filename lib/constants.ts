export const CHAIN_ID = 11155111;
export const CHAIN_NAME = 'Sepolia';
export const EXPLORER_URL = 'https://sepolia.etherscan.io';

export const PROTOCOL_ADDRESS = '0x5c64fC2846B35F950B653a3135E646B942A9dE55' as const;

const INFURA_API_KEY = process.env.NEXT_PUBLIC_INFURA_API_KEY!;
export const RPC_URL = `https://sepolia.infura.io/v3/${INFURA_API_KEY}`;

export const DEFAULT_LOCK_TAG = '0x000000000000000000000000' as const;

export const PROTOCOL_ABI_PATH = './lib/abis/protocol.json';

export const ALLOCATOR_ID = 24110319327574188268114297n;
export const ALWAYS_OK_ALLOCATOR_ID = 116248715932857528787113358n;

export const ALLOCATORS = [
  { value: ALWAYS_OK_ALLOCATOR_ID, label: "Always OK Allocator" },
  { value: ALLOCATOR_ID, label: "Default Allocator" },
] as const;

export type AllocatorKey = number;

// Protocol enums
export const SCOPES = {
    0: "Multichain",
    1: "Chain-Specific",
} as const;

export const FORCED_WITHDRAWAL_STATUS = {
    0: "Disabled",
    1: "Pending",
    2: "Enabled",
} as const;

export const RESET_PERIODS = {
  0: { value: 0, name: "1 second", seconds: 1 },
  1: { value: 1, name: "15 seconds", seconds: 15 },
  2: { value: 2, name: "60 seconds", seconds: 60 },
  3: { value: 3, name: "10 minute", seconds: 600 },
  4: { value: 4, name: "1 hour", seconds: 3900 },
  5: { value: 5, name: "24 hours", seconds: 86400 },
  6: { value: 6, name: "7 days", seconds: 608400 },
  7: { value: 7, name: "30 days", seconds: 2592000 }
} as const;

export type ResetPeriodKey = keyof typeof RESET_PERIODS;
export type ScopeKey = keyof typeof SCOPES;
export type ForcedWithdrawalStatusKey = keyof typeof FORCED_WITHDRAWAL_STATUS;
