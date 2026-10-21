
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { erc20Abi, isAddress, type Address } from 'viem';

const CELO_SEPOLIA_CHAIN_ID = 11142220;

const USDM_CONTRACT: Address =
  '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b';

export function useUsdMSendTransaction() {
  const { address, chainId, isConnected } = useAccount();

  const {
    data: transactionHash,
    writeContractAsync,
    isPending: isAwaitingWallet,
    error: sendError,
    reset,
  } = useWriteContract();

  const receipt = useWaitForTransactionReceipt({
    hash: transactionHash,
    chainId: CELO_SEPOLIA_CHAIN_ID,
    query: {
      enabled: Boolean(transactionHash),
    },
  });

  async function submitUsdMTransfer(
    recipient: string,
    amountUnits: bigint
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
      throw new Error('Cannot send USDm to your own wallet.');
    }

    if (amountUnits <= 0n) {
      throw new Error('USDm amount must be positive.');
    }

    // Only call after the user confirms the
    // transaction on the RAVOXA review screen.
    return writeContractAsync({
      address: USDM_CONTRACT,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [to as Address, amountUnits],
      chainId: CELO_SEPOLIA_CHAIN_ID,
    });
  }

  return {
    submitUsdMTransfer,
    transactionHash,
    isAwaitingWallet,
    isConfirming:
      Boolean(transactionHash) && receipt.isPending,
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
