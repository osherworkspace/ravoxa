
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { isAddress, type Address } from 'viem';

const CELO_SEPOLIA_CHAIN_ID = 11142220;

export function useCeloSendTransaction() {
  const { address, chainId, isConnected } = useAccount();

  const {
    data: transactionHash,
    sendTransactionAsync,
    isPending: isAwaitingWallet,
    error: sendError,
    reset,
  } = useSendTransaction();

  const receipt = useWaitForTransactionReceipt({
    hash: transactionHash,
    chainId: CELO_SEPOLIA_CHAIN_ID,
    query: {
      enabled: Boolean(transactionHash),
    },
  });

  async function submitTestTransfer(
    recipient: string,
    amountWei: bigint
  ) {
    if (
      !isConnected ||
      !address ||
      chainId !== CELO_SEPOLIA_CHAIN_ID
    ) {
      throw new Error('Connect to Celo Sepolia first.');
    }

    const to = recipient.trim();

    if (!isAddress(to)) {
      throw new Error('Invalid recipient address.');
    }

    if (to.toLowerCase() === address.toLowerCase()) {
      throw new Error('Cannot send to your own wallet.');
    }

    if (amountWei <= 0n) {
      throw new Error('Transfer amount must be positive.');
    }

    // Must only be called after explicit user approval
    // in the RAVOXA review screen.
    return sendTransactionAsync({
      to: to as Address,
      value: amountWei,
      chainId: CELO_SEPOLIA_CHAIN_ID,
    });
  }

  return {
    submitTestTransfer,
    transactionHash,
    isAwaitingWallet,
    isConfirming: receipt.isPending &&
      Boolean(transactionHash),
    isConfirmed:
      receipt.isSuccess &&
      receipt.data?.status === 'success',
    isReverted:
      receipt.isSuccess &&
      receipt.data?.status === 'reverted',
    receipt: receipt.data,
    error: sendError ?? receipt.error,
    reset,
  };
}
