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
