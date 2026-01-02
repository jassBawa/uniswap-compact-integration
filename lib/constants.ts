export const CHAIN_ID = 11155111;
export const CHAIN_NAME = 'Sepolia';
export const EXPLORER_URL = 'https://sepolia.etherscan.io';

export const PROTOCOL_ADDRESS = '0x5c64fC2846B35F950B653a3135E646B942A9dE55' as const;

export const RPC_URL = 'https://sepolia.infura.io/v3/b53c82a581df425dab81bd14950033b9';

export const DEFAULT_LOCK_TAG = '0x000000000000000000000000' as const;

export const PROTOCOL_ABI_PATH = './lib/abis/protocol.json';



export const DEFAULT_ALLOCATOR_HEX = "13f18f079b52276faad179";

export function buildLockTag(
    scope: number,
    resetPeriod: number,
    allocatorHex: string = DEFAULT_ALLOCATOR_HEX
): `0x${string}` {
    // Solidity computes: lockTag = shl(255, scope) | shl(252, resetPeriod) | shl(160, allocatorId)
    // lockTag is bytes12 = 96 bits = 24 hex chars
    // First byte: bit 255 (scope) + bits 252-254 (resetPeriod) + bits 248-251 (unused)
    const firstByte = 
    ((resetPeriod & 0x7) << 4) | ((scope & 0x1) << 7);
    const firstByteHex = firstByte.toString(16).padStart(2, "0");
    // Allocator portion: full 40 hex chars (20 bytes) of address
    const allocatorClean = allocatorHex.replace(/^0x/, "").toLowerCase();
    // Total should be 24 hex chars = 12 bytes
    // 2 (firstByte) + 22 (allocator = last 11 bytes of address) = 24 hex chars
    const allocHex = allocatorClean.slice(-22).padStart(22, "0");
    const hexOnly = `${firstByteHex}${allocHex}`;
    return `0x${hexOnly}` as `0x${string}`;
}