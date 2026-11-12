interface EthereumProvider {
  isMiniPay?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
}

declare global {
  interface Window { ethereum?: EthereumProvider }
}

export function useMiniPay() {
  const hasInjectedWallet = typeof window !== 'undefined' && Boolean(window.ethereum?.request);
  const isMiniPay = typeof window !== 'undefined' && Boolean(window.ethereum?.isMiniPay);
  return { isMiniPay, hasInjectedWallet };
}
