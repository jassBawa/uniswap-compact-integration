import { hashTypedData, keccak256, concat } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { COMPACT_ABI } from '@/lib/abis/protocol';
import { CHAIN_ID, PROTOCOL_ADDRESS } from '@/lib/constants';
import { useSignTypedData, useWriteContract } from 'wagmi';

// EIP-712 domain for Sepolia
const COMPACT_DOMAIN = {
  name: "The Compact",
  version: "1",
  chainId: BigInt(CHAIN_ID),
  verifyingContract: PROTOCOL_ADDRESS,
} as const;

// EIP-712 types matching the contract's hash computation
const COMPACT_TYPES = {
  Compact: [
    { name: 'arbiter', type: 'address' },
    { name: 'sponsor', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'expires', type: 'uint256' },
    { name: 'lockTag', type: 'bytes12' },
    { name: 'token', type: 'address' },
    { name: 'amount', type: 'uint256' },
  ]
} as const;

/**
 * Compute the claim hash exactly as the contract does.
 * The contract's HashLib.sol reads lockTag and token separately from calldata.
 */
function computeClaimHash(
  arbiter: `0x${string}`,
  sponsor: `0x${string}`,
  nonce: bigint,
  expires: bigint,
  lockId: bigint,
  amount: bigint
): `0x${string}` {
  const lockTag = (lockId >> 160n) & ((1n << 96n) - 1n);
  const token = lockId & ((1n << 160n) - 1n);

  const lockTagHex = '0x' + lockTag.toString(16).padStart(24, '0');
  const tokenHex = '0x' + token.toString(16).padStart(40, '0');

  return hashTypedData({
    domain: COMPACT_DOMAIN,
    types: COMPACT_TYPES,
    primaryType: 'Compact',
    message: {
      arbiter,
      sponsor,
      nonce,
      expires,
      lockTag: lockTagHex as `0x${string}`,
      token: tokenHex as `0x${string}`,
      amount,
    },
  });
}

/**
 * Generate the EIP-712 digest that SimpleAllocator verifies.
 * The allocator expects: keccak256(0x1901 || DOMAIN_SEPARATOR || claimHash)
 */
function computeAllocatorDigest(claimHash: `0x${string}`): `0x${string}` {
  const domainSeparator = hashTypedData({
    domain: COMPACT_DOMAIN,
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' }
      ]
    },
    primaryType: 'EIP712Domain',
  });

  return keccak256(concat(['0x1901', domainSeparator, claimHash]));
}

// Helper to generate allocator signature using private key
async function generateAllocatorSignature(
  arbiter: `0x${string}`,
  sponsor: `0x${string}`,
  nonce: bigint,
  expires: bigint,
  lockId: bigint,
  amount: bigint
): Promise<`0x${string}`> {
  const privateKey = process.env.NEXT_PUBLIC_ALLOCATOR_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('NEXT_PUBLIC_ALLOCATOR_PRIVATE_KEY not set in environment');
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const claimHash = computeClaimHash(arbiter, sponsor, nonce, expires, lockId, amount);
  const digest = computeAllocatorDigest(claimHash);

  return account.sign({ hash: digest });
}

export function useCompactClaim() {
  const { signTypedDataAsync } = useSignTypedData();
  const { writeContract, data: hash, error: writeError } = useWriteContract();

  const handleClaim = async ({
    lockId,
    amount,
    sponsorAddr,
    recipient,
    lockTag = '0x000000000000000000000000' as `0x${string}`,
  }: {
    lockId: string;
    amount: bigint;
    sponsorAddr: `0x${string}`;
    recipient: `0x${string}`;
    lockTag?: `0x${string}`;
  }) => {
    const expires = BigInt(Math.floor(Date.now() / 1000) + 3600);
    const nonce = 0n;
    const lockIdBigInt = BigInt(lockId);

    const extractedLockTag = (lockIdBigInt >> 160n) & ((1n << 96n) - 1n);
    const extractedToken = lockIdBigInt & ((1n << 160n) - 1n);

    const lockTagHex = '0x' + extractedLockTag.toString(16).padStart(24, '0');
    const tokenHex = '0x' + extractedToken.toString(16).padStart(40, '0');

    const sponsorSignature = await signTypedDataAsync({
      domain: COMPACT_DOMAIN,
      types: COMPACT_TYPES,
      primaryType: 'Compact',
      message: {
        arbiter: sponsorAddr,
        sponsor: sponsorAddr,
        nonce,
        expires,
        lockTag: lockTagHex as `0x${string}`,
        token: tokenHex as `0x${string}`,
        amount,
      },
    });

    const allocatorSignature = await generateAllocatorSignature(
      sponsorAddr,
      sponsorAddr,
      nonce,
      expires,
      lockIdBigInt,
      amount
    );

    const claimant = (BigInt(lockTag) << 160n) | BigInt(recipient);

    writeContract({
      address: PROTOCOL_ADDRESS,
      abi: COMPACT_ABI,
      functionName: 'claim',
      args: [{
        allocatorData: allocatorSignature,
        sponsorSignature,
        sponsor: sponsorAddr,
        nonce,
        expires,
        witness: '0x0000000000000000000000000000000000000000000000000000000000000000',
        witnessTypestring: '',
        id: lockIdBigInt,
        allocatedAmount: amount,
        claimants: [{ claimant, amount }]
      }]
    });

    if (writeError) {
      throw writeError;
    }

    return hash;
  };

  return { handleClaim, hash, writeError };
}
