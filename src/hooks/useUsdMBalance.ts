
import { useAccount, useReadContract } from 'wagmi';
import { erc20Abi, formatUnits } from 'viem';

const USDM_SEPOLIA_ADDRESS =
  '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b' as const;

const CELO_SEPOLIA_CHAIN_ID = 11142220;

export function useUsdMBalance() {
  const { address, isConnected, chainId } = useAccount();

  const enabled =
    isConnected &&
    chainId === CELO_SEPOLIA_CHAIN_ID &&
    Boolean(address);

  const balance = useReadContract({
    address: USDM_SEPOLIA_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: CELO_SEPOLIA_CHAIN_ID,
    query: {
      enabled,
      refetchInterval: 15_000,
    },
  });

  const decimals = useReadContract({
    address: USDM_SEPOLIA_ADDRESS,
    abi: erc20Abi,
    functionName: 'decimals',
    chainId: CELO_SEPOLIA_CHAIN_ID,
    query: {
      enabled,
    },
  });

  const formattedBalance =
    balance.data !== undefined &&
    decimals.data !== undefined
      ? formatUnits(balance.data, decimals.data)
      : null;

  return {
    isConnected,
    isCeloSepolia: chainId === CELO_SEPOLIA_CHAIN_ID,
    balance: balance.data,
    decimals: decimals.data,
    formattedBalance,
    isLoading: enabled && (balance.isPending || decimals.isPending),
    error: balance.error ?? decimals.error,
    refetchBalance: balance.refetch,
  };
}
