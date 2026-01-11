import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import {
  Address,
  Hex,
  encodeAbiParameters,
  hashStruct,
  keccak256,
  toBytes,
} from "viem";
import {
  useConnection,
  useSignTypedData,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { COMPACT_ABI } from "@/lib/abis/protocol";
import { CHAIN_ID, PROTOCOL_ADDRESS } from "@/lib/constants";
import { copyToClipboard, mapContractError } from "@/lib/utils";
import { useToast } from "./useToast";

const COMPACT_TYPEHASH = keccak256(
  toBytes(
    "Compact(address arbiter,address sponsor,uint256 nonce,uint256 expires,bytes12 lockTag,address token,uint256 amount)"
  )
);

const COMPACT_DOMAIN = {
  name: "The Compact",
  version: "1",
  chainId: BigInt(CHAIN_ID),
  verifyingContract: PROTOCOL_ADDRESS,
} as const;

const COMPACT_TYPES = {
  Compact: [
    { name: "arbiter", type: "address" },
    { name: "sponsor", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "expires", type: "uint256" },
    { name: "lockTag", type: "bytes12" },
    { name: "token", type: "address" },
    { name: "amount", type: "uint256" },
  ],
} as const;

const ZERO_HASH =
  "0x0000000000000000000000000000000000000000000000000000000000000000" as const;

export function getClaimant(lockTag: bigint, receiver: Address): bigint {
  return (lockTag << 96n) | BigInt(receiver);
}

export function getSimpleWitnessHash(witnessArgument: bigint): `0x${string}` {
  const typeHash = keccak256(toBytes("Mandate(uint256 witnessArgument)"));
  const encodedData = encodeAbiParameters(
    [{ type: "bytes32" }, { type: "uint256" }],
    [typeHash, witnessArgument]
  );
  return keccak256(encodedData);
}

export function getClaimHash(
  message: CompactData,
  types: typeof COMPACT_TYPES = COMPACT_TYPES
): `0x${string}` {
  const messageWithFormattedData = {
    ...message,
    lockTag: `0x${message.lockTag.toString(16).padStart(24, "0")}` as Hex,
    token:
      typeof message.token === "bigint"
        ? `0x${message.token.toString(16).padStart(40, "0")}` as Address
        : message.token,
  };

  return hashStruct({
    types,
    primaryType: "Compact",
    data: messageWithFormattedData,
  });
}

export function computeLockTag(
  allocatorId: bigint,
  scope: bigint,
  resetPeriod: bigint
): bigint {
  return (scope << 95n) | (resetPeriod << 92n) | allocatorId;
}

interface CompactData {
  arbiter: Address;
  sponsor: Address;
  nonce: bigint;
  expires: bigint;
  id: bigint;
  lockTag: bigint;
  token: Address | bigint;
  amount: bigint;
  mandate?: {
    witnessArgument: bigint;
  };
}

interface ClaimParams {
  id: bigint;
  amount: bigint;
  allocatorId: bigint;
  resetPeriod: bigint;
  scope: bigint;
  arbiter: Address;
  sponsor: Address;
  nonce: bigint;
  expires: bigint;
  witnessArgument?: bigint;
  claimant: Address;
  claimantAmount: bigint;
}

export function useProtocolClaim() {
  const { address } = useConnection();
  const { showToast, dismissAll } = useToast();
  const queryClient = useQueryClient();

  const { mutateAsync: signTypedDataAsync } = useSignTypedData();
  const { data: hash, mutate, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } =
    useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isPending) {
      dismissAll();
      showToast("loading", "Sign transaction in wallet...");
    }
  }, [isPending, dismissAll, showToast]);

  useEffect(() => {
    if (isConfirming && hash) {
      dismissAll();
      showToast("loading", "Transaction pending...", hash);
    }
  }, [isConfirming, hash, dismissAll, showToast]);

  useEffect(() => {
    if (error) {
      dismissAll();
      showToast("error", mapContractError(error));
    }
  }, [error, dismissAll, showToast]);

  useEffect(() => {
    if (!isSuccess || !receipt || !hash) return;

    dismissAll();
    showToast("success", "Claim successful!", hash);
    copyToClipboard(hash);
    reset();
  }, [isSuccess, receipt, hash, dismissAll, showToast, reset]);

  const claim = useCallback(
    async ({
      id,
      amount,
      allocatorId,
      resetPeriod,
      scope,
      arbiter,
      sponsor,
      nonce,
      expires,
      witnessArgument,
      claimant,
      claimantAmount,
    }: ClaimParams) => {
      if (!address || !sponsor) return;

      const lockTag = computeLockTag(allocatorId, scope, resetPeriod);
      const token = 0n; // native token

      // Build compact data
      const compactData: CompactData = {
        arbiter,
        sponsor,
        nonce,
        expires,
        id,
        lockTag,
        token,
        amount,
        mandate: witnessArgument
          ? { witnessArgument }
          : undefined,
      };

      // Get claim hash
      const claimHash = getClaimHash(compactData);

      // Sign as sponsor
      const sponsorSignature = await signTypedDataAsync({
        domain: COMPACT_DOMAIN,
        types: COMPACT_TYPES,
        primaryType: "Compact",
        message: {
          arbiter,
          sponsor,
          nonce,
          expires,
          lockTag: `0x${lockTag.toString(16).padStart(24, "0")}` as Hex,
          token: `0x${token.toString(16).padStart(40, "0")}` as Address,
          amount,
        },
      });

      // Build claimants array
      const claimants = [
        {
          lockTag: witnessArgument ? lockTag : 0n,
          claimant,
          amount: claimantAmount,
        },
      ];

      // Build claim payload
      const claimPayload = {
        allocatorData: ZERO_HASH,
        sponsorSignature: sponsorSignature as Hex,
        sponsor,
        nonce,
        expires,
        witness: witnessArgument
          ? getSimpleWitnessHash(witnessArgument)
          : ZERO_HASH,
        witnessTypestring: witnessArgument ? "uint256 witnessArgument" : "",
        id,
        allocatedAmount: amount,
        claimants: claimants.map(({ lockTag: lt, claimant: c, amount: a }) => ({
          claimant: getClaimant(lt, c),
          amount: a,
        })),
      };

      mutate({
        address: PROTOCOL_ADDRESS,
        abi: COMPACT_ABI,
        functionName: "claim",
        args: [claimPayload],
      });
    },
    [address, signTypedDataAsync, mutate]
  );

  return {
    claim,
    isPending: isPending || isConfirming,
    hash,
    isSuccess,
  };
}
