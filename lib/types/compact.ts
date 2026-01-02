import { Address } from 'viem';

// ============ Enums ============

/**
 * Reset period options for resource locks
 */
export enum ResetPeriod {
  OneSecond = 0,
  FifteenSeconds = 1,
  OneMinute = 2,
  TenMinutes = 3,
  OneHourAndFiveMinutes = 4,
  OneDay = 5,
  SevenDaysAndOneHour = 6,
  ThirtyDays = 7
}

/**
 * Scope options for resource locks
 */
export enum Scope {
  Multichain = 0,
  ChainSpecific = 1
}

/**
 * Reset period with label for UI
 */
export interface ResetPeriodOption {
  value: ResetPeriod;
  label: string;
  duration: number;
  description?: string;
}

/**
 * Scope with label for UI
 */
export interface ScopeOption {
  value: Scope;
  label: string;
  description?: string;
}

// ============ Lock Tag Types ============

/**
 * Encoded lock tag parameters
 */
export interface LockTagParams {
  allocatorId: bigint;
  resetPeriod: ResetPeriod;
  scope: Scope;
}

// ============ ERC-6909 Types ============

/**
 * ERC-6909 Token information
 */
export interface ERC6909Token {
  id: bigint;
  token: Address;        // Token address (address(0) for native)
  allocator: Address;
  resetPeriod: ResetPeriod;
  scope: Scope;
  lockTag: `0x${string}`;
}

/**
 * User's balance for a specific ERC-6909 token ID
 */
export interface ERC6909Balance {
  id: bigint;
  balance: bigint;
  token: {
    address: Address;
    symbol: string;
    decimals: number;
  };
  lockDetails?: LockDetails;
}

/**
 * Lock details from getLockDetails()
 */
export interface LockDetails {
  token: Address;           // address(0) for native ETH
  allocator: Address;
  resetPeriod: ResetPeriod;
  scope: Scope;
  lockTag: `0x${string}`;
}

// ============ Deposit Types ============

/**
 * Deposit parameters for native or ERC-20
 */
export interface DepositParams {
  amount: bigint;
  lockTag: `0x${string}`;
  recipient: Address;
}

/**
 * ERC-20 deposit parameters
 */
export interface ERC20DepositParams extends DepositParams {
  token: Address;
}

// ============ Claim Types ============

/**
 * Component in a claim/transfer (claimant encoded with lockTag)
 */
export interface ClaimComponent {
  claimant: bigint;  // (lockTag << 160) | recipient
  amount: bigint;
}

/**
 * Simplified claim component for UI (unencoded)
 */
export interface SimplifiedClaimComponent {
  lockTag: `0x${string}`;
  recipient: Address;
  amount: bigint;
}

/**
 * Full Claim struct as used in the contract
 */
export interface Claim {
  allocatorData: `0x${string}`;        // Allocator authorization
  sponsorSignature: `0x${string}`;     // Sponsor's EIP-712 signature
  sponsor: Address;                     // Original depositor
  nonce: bigint;                        // Anti-replay
  expires: bigint;                      // Expiration timestamp
  witness: `0x${string}`;               // Witness data
  witnessTypestring: string;            // EIP-712 type string
  id: bigint;                           // ERC-6909 token ID
  allocatedAmount: bigint;              // Total allocated amount
  claimants: ClaimComponent[];          // Recipients and amounts
}

/**
 * Simplified claim for demo mode
 */
export interface SimplifiedClaim {
  id: bigint;
  lockTag: `0x${string}`;       // Leave empty to withdraw underlying
  amount: bigint;
  recipient: Address;
}

/**
 * AllocatedTransfer struct (simpler than full Claim)
 */
export interface AllocatedTransfer {
  allocatorData: `0x${string}`;
  nonce: bigint;
  expires: bigint;
  id: bigint;
  recipients: ClaimComponent[];
}

// ============ UI State Types ============

/**
 * Deposit form state
 */
export interface DepositFormState {
  amount: string;
  recipient: Address;
  resetPeriod: ResetPeriod;
  scope: Scope;
  allocator: Address;
  tokenAddress?: Address;  // undefined for native ETH
}

/**
 * Claim form state (simplified demo mode)
 */
export interface ClaimFormState {
  id: string;
  lockTag: `0x${string}`;
  amount: string;
  recipient: Address;
}

// ============ Token Types ============

/**
 * ERC-20 token with metadata
 */
export interface Token {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  logo?: string;
}

// ============ Transaction Types ============

/**
 * Transaction result with status
 */
export interface TransactionResult {
  hash: `0x${string}` | undefined;
  isPending: boolean;
  isConfirmed: boolean;
  error: string | null;
}

// ============ Constant Arrays ============

export const RESET_PERIODS: readonly ResetPeriodOption[] = [
  { value: ResetPeriod.OneSecond, label: '1 second', duration: 1, description: 'Fastest reset' },
  { value: ResetPeriod.FifteenSeconds, label: '15 seconds', duration: 15 },
  { value: ResetPeriod.OneMinute, label: '1 minute', duration: 60 },
  { value: ResetPeriod.TenMinutes, label: '10 minutes', duration: 600, description: 'Default' },
  { value: ResetPeriod.OneHourAndFiveMinutes, label: '1 hour 5 min', duration: 3900 },
  { value: ResetPeriod.OneDay, label: '1 day', duration: 86400 },
  { value: ResetPeriod.SevenDaysAndOneHour, label: '7 days 1 hour', duration: 604800 },
  { value: ResetPeriod.ThirtyDays, label: '30 days', duration: 2592000, description: 'Slowest reset' }
] as const;

export const SCOPES: readonly ScopeOption[] = [
  { value: Scope.Multichain, label: 'Multichain', description: 'Valid across multiple chains' },
  { value: Scope.ChainSpecific, label: 'Chain-specific', description: 'Valid only on current chain' }
] as const;
