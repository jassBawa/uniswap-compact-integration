import { formatEther } from "viem";

/**
 * Truncate an Ethereum address for display
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address) return "";
  if (address.length < chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format a balance with configurable decimals
 */
export function formatBalance(
  balance: bigint,
  decimals = 18,
  displayDecimals = 4
): string {
  if (balance === 0n) return "0.0000";

  const divisor = 10n ** BigInt(decimals);
  const whole = balance / divisor;
  const remainder = balance % divisor;

  let decimalStr = remainder.toString().padStart(decimals, "0");
  if (displayDecimals < decimals) {
    decimalStr = decimalStr.slice(0, displayDecimals);
  }

  const trimmedDecimal = decimalStr.replace(/0+$/, "");
  if (trimmedDecimal === "") {
    return whole.toString();
  }

  return `${whole.toString()}.${trimmedDecimal}`;
}

/**
 * Format ether balance for display (convenience wrapper)
 */
export function formatEtherCompact(balance: bigint): string {
  return formatEther(balance);
}

/**
 * Format a Unix timestamp to a readable date string
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Format a Unix timestamp to a relative time string (e.g., "5 minutes ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const date = new Date(timestamp * 1000);
  const diffMs = now - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
