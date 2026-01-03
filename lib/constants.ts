export const CHAIN_ID = 11155111;
export const CHAIN_NAME = 'Sepolia';
export const EXPLORER_URL = 'https://sepolia.etherscan.io';

export const PROTOCOL_ADDRESS = '0x5c64fC2846B35F950B653a3135E646B942A9dE55' as const;

export const RPC_URL = 'https://sepolia.infura.io/v3/b53c82a581df425dab81bd14950033b9';

export const DEFAULT_LOCK_TAG = '0x000000000000000000000000' as const;

export const PROTOCOL_ABI_PATH = './lib/abis/protocol.json';

export const DEFAULT_ALLOCATOR_HEX = "13f18f079b52276faad179";

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
    scope: number,
    resetPeriod: number,
    allocatorHex: string = DEFAULT_ALLOCATOR_HEX
): `0x${string}` {
    const firstByte =
        ((resetPeriod & 0x7) << 4) | ((scope & 0x1) << 7);
    const firstByteHex = firstByte.toString(16).padStart(2, "0");
    const allocatorClean = allocatorHex.replace(/^0x/, "").toLowerCase();
    const allocHex = allocatorClean.slice(-22).padStart(22, "0");
    const hexOnly = `${firstByteHex}${allocHex}`;
    return `0x${hexOnly}` as `0x${string}`;
}