/**
 * Map contract errors to user-friendly messages
 */
export function mapContractError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  // Common Compact Errors
  if (message.includes("Expired()")) return "The signature has expired.";
  if (message.includes("InvalidSignature()"))
    return "The provided signature is invalid.";
  if (message.includes("NonceAlreadyUsed()"))
    return "This transaction nonce has already been used.";
  if (message.includes("InsufficientBalance()"))
    return "Your balance in the lock is insufficient.";
  if (message.includes("ResetPeriodNotOver()"))
    return "The reset period has not finished yet.";
  if (message.includes("Unauthorized()"))
    return "You are not authorized to perform this action.";

  // Generic Web3 Errors
  if (message.includes("user rejected action"))
    return "Transaction was rejected in your wallet.";
  if (message.includes("insufficient funds for gas"))
    return "You do not have enough ETH for gas fees.";
  if (message.includes("execution reverted"))
    return "Transaction failed. Check your inputs and try again.";

  // Return first line of the error message
  return message.split("\n")[0];
}
