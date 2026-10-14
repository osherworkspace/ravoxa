import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { celo, celoSepolia } from 'viem/chains';

export const wagmiConfig = createConfig({
  chains: [celoSepolia, celo],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
  transports: {
    [celoSepolia.id]: http(),
    [celo.id]: http(),
  },
});
