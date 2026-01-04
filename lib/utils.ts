import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export utilities
export { formatAddress, formatBalance, formatEtherCompact, formatTimestamp, formatRelativeTime } from "./utils/format"
export { validateAddress, validateAmount, validateLockId } from "./utils/validation"
export { mapContractError } from "./utils/errors"
export { copyToClipboard } from "./utils/clipboard"



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
