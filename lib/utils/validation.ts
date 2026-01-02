import { isAddress } from "viem";

/**
 * Validate an Ethereum address
 */
export function validateAddress(address: string): boolean {
  return isAddress(address);
}

/**
 * Validate an amount string
 */
export function validateAmount(amount: string, maxDecimals = 18): boolean {
  // Check for valid number format
  const regex = new RegExp(`^\\d+(\\.\\d{1,${maxDecimals}})?$`);
  if (!regex.test(amount)) return false;

  // Check for valid numeric value
  const num = parseFloat(amount);
  return !isNaN(num) && isFinite(num) && num > 0;
}

/**
 * Validate a lock ID string
 */
export function validateLockId(lockId: string): boolean {
  // Lock ID should be a non-empty string of digits
  if (!lockId || lockId.trim() === "") return false;
  return /^\d+$/.test(lockId.trim());
}

/**
 * Validate if a value is a valid amount for deposit (not exceeding balance)
 */
export function isValidDepositAmount(
  amount: string,
  balance: bigint,
  decimals = 18
): boolean {
  if (!validateAmount(amount, decimals)) return false;

  try {
    const parsedAmount = BigInt(Math.floor(parseFloat(amount) * 10 ** decimals));
    return parsedAmount <= balance;
  } catch {
    return false;
  }
}
