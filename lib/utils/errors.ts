type ErrorPattern = {
  test: (message: string) => boolean;
  message: string;
};

const COMPACT_ERRORS: readonly ErrorPattern[] = [
  { test: (m) => m.includes("Expired()"), message: "The signature has expired." },
  { test: (m) => m.includes("InvalidSignature()"), message: "The provided signature is invalid." },
  { test: (m) => m.includes("NonceAlreadyUsed()"), message: "This transaction nonce has already been used." },
  { test: (m) => m.includes("InsufficientBalance()"), message: "Your balance in lock is insufficient." },
  { test: (m) => m.includes("ResetPeriodNotOver()"), message: "The reset period has not finished yet." },
  { test: (m) => m.includes("Unauthorized()"), message: "You are not authorized to perform this action." },
];

const WEB3_ERRORS: readonly ErrorPattern[] = [
  { test: (m) => m.includes("user rejected action"), message: "Transaction was rejected in your wallet." },
  { test: (m) => m.includes("insufficient funds for gas"), message: "You do not have enough ETH for gas fees." },
  { test: (m) => m.includes("execution reverted"), message: "Transaction failed. Check your inputs and try again." },
];

function findErrorMessage(patterns: readonly ErrorPattern[], message: string): string | null {
  return patterns.find(({ test }) => test(message))?.message ?? null;
}

export function mapContractError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  const compactError = findErrorMessage(COMPACT_ERRORS, message);
  if (compactError) return compactError;

  const web3Error = findErrorMessage(WEB3_ERRORS, message);
  if (web3Error) return web3Error;

  return message.split("\n")[0];
}
