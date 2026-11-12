import { useAccount, useReadContract } from 'wagmi';
import { erc20Abi, formatUnits } from 'viem';

export const USDC_SEPOLIA_ADDRESS = '0x01C5C0122039549AD1493B8220cABEdD739BC44E' as const;
const CELO_SEPOLIA_CHAIN_ID = 11142220;

export function useUsdcBalance() {
  const { address, isConnected, chainId } = useAccount();
  const enabled = isConnected && chainId === CELO_SEPOLIA_CHAIN_ID && Boolean(address);
  const balance = useReadContract({
    address: USDC_SEPOLIA_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: CELO_SEPOLIA_CHAIN_ID,
    query: { enabled, refetchInterval: 15_000 },
  });
  const decimals = useReadContract({
    address: USDC_SEPOLIA_ADDRESS,
    abi: erc20Abi,
    functionName: 'decimals',
    chainId: CELO_SEPOLIA_CHAIN_ID,
    query: { enabled },
  });
  const formattedBalance = balance.data !== undefined && decimals.data !== undefined
    ? formatUnits(balance.data, decimals.data)
    : null;
  return {
    balance: balance.data,
    decimals: decimals.data,
    formattedBalance,
    isLoading: enabled && (balance.isPending || decimals.isPending),
    error: balance.error ?? decimals.error,
    refetchBalance: balance.refetch,
  };
}
