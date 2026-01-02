'use client';

import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, parseUnits, Address, isAddress } from 'viem';
import { COMPACT_ABI, ERC20_ABI } from '@/lib/abis/protocol';
import { buildLockTag, DEFAULT_ALLOCATOR_HEX, PROTOCOL_ADDRESS } from '@/lib/constants';
import { useCallback, useState, useEffect } from 'react';

// ============ Hook: Use ERC-6909 Balance ============

export function useERC6909Balance(id: bigint | undefined) {
  const { address } = useAccount();

  return useReadContract({
    address: PROTOCOL_ADDRESS,
    abi: COMPACT_ABI,
    functionName: 'balanceOf',
    args: address && id ? [address, id] : undefined,
    query: {
      enabled: !!address && !!id,
      refetchInterval: 10000, // Refresh every 10 seconds
    }
  } as any);
}

// ============ Hook: Use Lock Details ============

export function useLockDetails(id: bigint | undefined) {
  return useReadContract({
    address: PROTOCOL_ADDRESS,
    abi: COMPACT_ABI,
    functionName: 'getLockDetails',
    args: id ? [id] : undefined,
    query: { enabled: !!id }
  } as any);
}

// ============ Hook: Use ERC-20 Balance ============

export function useERC20Balance(tokenAddress: Address | undefined) {
  const { address } = useAccount();

  return useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address && !!tokenAddress && isAddress(tokenAddress) }
  } as any);
}

// ============ Hook: Use ERC-20 Allowance ============

export function useERC20Allowance(
  tokenAddress: Address | undefined,
  spender: Address | undefined
) {
  const { address } = useAccount();

  return useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address && spender ? [address, spender] : undefined,
    query: { enabled: !!address && !!tokenAddress && !!spender }
  } as any);
}

// ============ Hook: Use Deposit Native ============


export function useDepositNative() {
  const { data: hash, isPending: isWriting, writeContract, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const depositNative = useCallback(
    async (scope:number, resetPeriod:number, recipient: `0x${string}`, amount: bigint) => {
      console.log('useDepositNative: calling writeContract', { PROTOCOL_ADDRESS, recipient, amount });
      const lockTag = buildLockTag(scope, resetPeriod, DEFAULT_ALLOCATOR_HEX);
      writeContract({
        address: PROTOCOL_ADDRESS,
        abi: COMPACT_ABI,
        functionName: 'depositNative',
        args: [lockTag, recipient],
        value: amount
      });
    },
    [writeContract]
  );

  return {
    depositNative,
    hash,
    isWriting,
    isConfirming,
    isConfirmed,
    writeError
  };
}

// ============ Hook: Use Deposit ERC-20 ============

export function useDepositERC20() {
  const { data: hash, isPending: isWriting, writeContract, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const depositERC20 = useCallback(
    async (
      scope: number,
      resetPeriod: number,
      token: `0x${string}`,
      amount: bigint,
      recipient: `0x${string}`
    ) => {
      const lockTag = buildLockTag(scope, resetPeriod, DEFAULT_ALLOCATOR_HEX);
      console.log('useDepositERC20: calling writeContract', { PROTOCOL_ADDRESS, token, lockTag, amount, recipient });
      writeContract({
        address: PROTOCOL_ADDRESS,
        abi: COMPACT_ABI,
        functionName: 'depositERC20',
        args: [token, lockTag, amount, recipient]
      });
    },
    [writeContract]
  );

  return {
    depositERC20,
    hash,
    isWriting,
    isConfirming,
    isConfirmed,
    writeError
  };
}

// ============ Hook: Use ERC-20 Approval ============

export function useERC20Approve() {
  const { data: hash, isPending: isWriting, writeContract, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const approve = useCallback(
    async (token: `0x${string}`, spender: `0x${string}`, amount: bigint) => {
      writeContract({
        address: token,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [spender, amount]
      });
    },
    [writeContract]
  );

  return {
    approve,
    hash,
    isWriting,
    isConfirming,
    isConfirmed,
    writeError
  };
}

// ============ Hook: Use Claim (Simplified Demo Mode) ============

export function useClaim() {
  const { data: hash, isPending: isWriting, writeContract, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const claim = useCallback(
    async (claimData: {
      id: bigint;
      amount: bigint;
      lockTag: `0x${string}`;
      recipient: `0x${string}`;
      allocatorData?: `0x${string}`;
      sponsorSignature?: `0x${string}`;
      sponsor?: `0x${string}`;
      nonce?: bigint;
      expires?: bigint;
    }) => {
      // For demo mode, construct a simplified claim
      // In production, you'd need proper signatures from sponsor and allocator

      const { id, amount, lockTag, recipient, allocatorData, sponsorSignature, sponsor, nonce, expires } = claimData;

      // Encode claimant: (lockTag << 160) | recipient
      const lockTagBig = BigInt(lockTag);
      const recipientNum = BigInt(recipient);
      const claimant = (lockTagBig << 160n) | recipientNum;

      // Build simplified claim payload (demo mode - signatures are placeholders)
      const claimPayload = {
        allocatorData: allocatorData || '0x' as `0x${string}`,
        sponsorSignature: sponsorSignature || '0x' as `0x${string}`,
        sponsor: sponsor || recipient, // Default to recipient as sponsor
        nonce: nonce || 0n,
        expires: expires || (BigInt(Math.floor(Date.now() / 1000)) + 3600n), // 1 hour from now
        witness: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
        witnessTypestring: '',
        id,
        allocatedAmount: amount,
        claimants: [{ claimant, amount }]
      };

      writeContract({
        address: PROTOCOL_ADDRESS,
        abi: COMPACT_ABI,
        functionName: 'claim',
        args: [claimPayload]
      });
    },
    [writeContract]
  );

  return {
    claim,
    hash,
    isWriting,
    isConfirming,
    isConfirmed,
    writeError
  };
}

// ============ Hook: Use Force Withdrawal ============

export function useForcedWithdrawal() {
  const { data: hash, isPending: isWriting, writeContract, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const enableForcedWithdrawal = useCallback(
    async (id: bigint) => {
      writeContract({
        address: PROTOCOL_ADDRESS,
        abi: COMPACT_ABI,
        functionName: 'enableForcedWithdrawal',
        args: [id]
      });
    },
    [writeContract]
  );

  const forcedWithdrawal = useCallback(
    async (id: bigint, recipient: `0x${string}`, amount: bigint) => {
      writeContract({
        address: PROTOCOL_ADDRESS,
        abi: COMPACT_ABI,
        functionName: 'forcedWithdrawal',
        args: [id, recipient, amount]
      });
    },
    [writeContract]
  );

  return {
    enableForcedWithdrawal,
    forcedWithdrawal,
    hash,
    isWriting,
    isConfirming,
    isConfirmed,
    writeError
  };
}

// ============ Hook: Use Forced Withdrawal Status ============

export function useForcedWithdrawalStatus(account: Address | undefined, id: bigint | undefined) {
  return useReadContract({
    address: PROTOCOL_ADDRESS,
    abi: COMPACT_ABI,
    functionName: 'getForcedWithdrawalStatus',
    args: account && id ? [account, id] : undefined,
    query: { enabled: !!account && !!id }
  });
}

// ============ Hook: Use Registration Check ============

export function useIsRegistered(
  sponsor: Address | undefined,
  claimHash: `0x${string}` | undefined,
  typehash: `0x${string}` | undefined
) {
  return useReadContract({
    address: PROTOCOL_ADDRESS,
    abi: COMPACT_ABI,
    functionName: 'isRegistered',
    args: sponsor && claimHash && typehash ? [sponsor, claimHash, typehash] : undefined,
    query: { enabled: !!sponsor && !!claimHash && !!typehash }
  });
}

// ============ Hook: Extract LockId from Deposit Transaction ============

export function useLockIdFromTransaction(hash: `0x${string}` | undefined) {
  const { data: receipt, isLoading, error } = useWaitForTransactionReceipt({ hash });

  const lockId = receipt
    ? (() => {
        const depositLog = receipt.logs.find((log) => {
          // Transfer event from address(0) indicates a deposit/mint
          return (
            log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' &&
            log.topics[1] === '0x0000000000000000000000000000000000000000000000000000000000000000'
          );
        });
        const idHex = depositLog?.topics[3];
        return idHex ? BigInt(idHex) : undefined;
      })()
    : undefined;

  return { lockId, isLoading, error, receipt };
}

// ============ Hook: Get User's Deposited IDs ============

export function useUserDepositIds(address: Address | undefined) {
  // This queries the latest ID by checking balanceOf - if balance > 0, we can find IDs
  // Note: This is a simplified approach. In production, you'd index events server-side.

  const { data: latestId, isLoading, error } = useReadContract({
    address: PROTOCOL_ADDRESS,
    abi: COMPACT_ABI,
    functionName: 'totalSupply',
    // totalSupply doesn't exist in the ABI, but if it did we could use it
    // For now, we'll need to query events or track deposits differently
    query: { enabled: false } // Disabled by default - requires a working query function
  });

  // Alternative: Query balance for a known ID range
  const checkIdBalance = useCallback(
    async (id: bigint) => {
      if (!address) return 0n;
      const balance = await fetchBalanceForId(address, id);
      return balance;
    },
    [address]
  );

  return {
    checkIdBalance,
    isLoading,
    error,
    // For a real implementation, you'd need to query Transfer events server-side
    // to get all IDs where the user received a deposit
  };
}

// Helper function to fetch balance for a specific ID
async function fetchBalanceForId(address: Address, id: bigint): Promise<bigint> {
  // This would need to be called from a useEffect or similar
  const response = await fetch(`/api/balance?address=${address}&id=${id}`);
  if (!response.ok) return 0n;
  const data = await response.json();
  return BigInt(data.balance);
}

// ============ Hook: Track Deposits by Recipient ============

export function useDepositsByRecipient(recipient: Address | undefined) {
  const [depositIds, setDepositIds] = useState<bigint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!recipient) {
      setDepositIds([]);
      return;
    }

    const fetchDeposits = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Query the contract for Transfer events where recipient received tokens
        // This requires an indexer or subgraph in production
        // For demo purposes, we simulate by checking common ID patterns

        // In a real app, you'd use:
        // const logs = await client.getLogs({
        //   address: PROTOCOL_ADDRESS,
        //   event: TRANSFER_EVENT,
        //   fromBlock: 0,
        //   toBlock: 'latest'
        // })

        // For now, return empty array - user must provide the ID
        setDepositIds([]);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch deposits'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeposits();
  }, [recipient]);

  return { depositIds, isLoading, error };
}
