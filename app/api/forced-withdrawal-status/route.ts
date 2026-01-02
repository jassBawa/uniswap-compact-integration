import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { CHAIN_ID, RPC_URL, PROTOCOL_ADDRESS } from '@/lib/constants';
import { COMPACT_ABI } from '@/lib/abis/protocol';

const client = createPublicClient({
  chain: {
    id: CHAIN_ID,
    name: 'Sepolia',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [RPC_URL] } },
  },
  transport: http(RPC_URL),
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const account = searchParams.get('account') as `0x${string}` | null;
  const id = searchParams.get('id');

  if (!account || !id) {
    return NextResponse.json({ error: 'Missing account or id' }, { status: 400 });
  }

  try {
    const idBigInt = BigInt(id);
    const status = await client.readContract({
      address: PROTOCOL_ADDRESS,
      abi: COMPACT_ABI,
      functionName: 'getForcedWithdrawalStatus',
      args: [account, idBigInt],
    });

    // status is [status: ForcedWithdrawalStatus, withdrawableAt: uint256]
    const [statusEnum, withdrawableAt] = status as [bigint, bigint];

    return NextResponse.json({
      activating: statusEnum === 1n, // 1 = Activating ( ForcedWithdrawalStatus.Activating )
      withdrawableAt: withdrawableAt.toString(),
    });
  } catch (error) {
    console.error('Failed to fetch forced withdrawal status:', error);
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
