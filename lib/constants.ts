export const CHAIN_ID = 11155111;
export const CHAIN_NAME = 'Sepolia';
export const EXPLORER_URL = 'https://sepolia.etherscan.io';

export const PROTOCOL_ADDRESS = '0x5c64fC2846B35F950B653a3135E646B942A9dE55' as const;

export const RPC_URL = 'https://sepolia.infura.io/v3/b53c82a581df425dab81bd14950033b9';

export const DEFAULT_LOCK_TAG = '0x000000000000000000000000' as const;

export const PROTOCOL_ABI_PATH = './lib/abis/protocol.json';

export const ALLOCATOR_ID = 24110319327574188268114297n;

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
    0: { label: "15 Seconds", seconds: 15 },
    1: { label: "30 Seconds", seconds: 30 },
    2: { label: "10 Minutes", seconds: 600 },
    3: { label: "1 Hour", seconds: 3600 },
    4: { label: "1 Day", seconds: 86400 },
    5: { label: "5 Days", seconds: 432000 },
    6: { label: "10 Days", seconds: 864000 },
    7: { label: "30 Days", seconds: 2592000 },
} as const;

export type ResetPeriodKey = keyof typeof RESET_PERIODS;
export type ScopeKey = keyof typeof SCOPES;
export type ForcedWithdrawalStatusKey = keyof typeof FORCED_WITHDRAWAL_STATUS;

export function buildLockTag(
  allocatorId: number | bigint,
  scope: number,
  resetPeriod: number
): `0x${string}` {
  if (scope !== 0 && scope !== 1) {
    throw new Error("scope must be 0 or 1");
  }

  if (resetPeriod < 0 || resetPeriod > 7) {
    throw new Error("resetPeriod must be between 0 and 7");
  }

  const allocatorBigInt = BigInt(allocatorId);

  if (allocatorBigInt >= (1n << 92n)) {
    throw new Error("allocatorId exceeds 92 bits");
  }

  // --- Bit packing ---
  const lockTagBigInt =
    (BigInt(scope) << 95n) |
    (BigInt(resetPeriod) << 92n) |
    allocatorBigInt;

  // --- Convert to bytes12 (24 hex chars) ---
  return `0x${lockTagBigInt.toString(16).padStart(24, "0")}` as `0x${string}`;
}