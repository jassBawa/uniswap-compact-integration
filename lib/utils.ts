export function formatAddress(address: string, chars = 4): string {
  if (!address) return '';
  if (address.length < chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatBalance(balance: bigint, decimals = 18, displayDecimals = 4): string {
  if (balance === 0n) return '0.0000';
  
  const divisor = 10n ** BigInt(decimals);
  const whole = balance / divisor;
  const remainder = balance % divisor;
  
  let decimalStr = remainder.toString().padStart(decimals, '0');
  if (displayDecimals < decimals) {
    decimalStr = decimalStr.slice(0, displayDecimals);
  }
  
  const trimmedDecimal = decimalStr.replace(/0+$/, '');
  if (trimmedDecimal === '') {
    return whole.toString();
  }
  
  return `${whole.toString()}.${trimmedDecimal}`;
}
