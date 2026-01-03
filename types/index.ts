const COMPACT_DOMAIN = {
  name: "The Compact",
  version: "1",
  chainId: 1, // Ethereum Mainnet
  verifyingContract: "0x00000000000018DF021F3400757c9151d62c990b", // Official Compact Address
} as const;

const COMPACT_TYPES = {
  Compact: [
    { name: 'arbiter', type: 'address' },
    { name: 'sponsor', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'expires', type: 'uint256' },
    { name: 'id', type: 'uint256' },
    { name: 'amount', type: 'uint256' },
  ]
} as const;