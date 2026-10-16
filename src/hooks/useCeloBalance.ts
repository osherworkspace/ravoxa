import { useAccount, useBalance } from 'wagmi';

export function useCeloBalance() {
  const { address, isConnected, chainId } = useAccount();

  const balance = useBalance({
    address,
    query: {
      enabled: Boolean(address && isConnected && chainId === 11142220),
      refetchInterval: 15_000,
    },
  });

  return {
    isConnected,
    isCeloSepolia: chainId === 11142220,
    balance: balance.data,
    isLoading: balance.isLoading,
    error: balance.error,
    refetchBalance: balance.refetch,
  };
}
