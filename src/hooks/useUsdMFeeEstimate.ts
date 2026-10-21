
import {
  useEstimateGas,
  useEstimateFeesPerGas,
} from 'wagmi';
import {
  encodeFunctionData,
  erc20Abi,
  type Address,
} from 'viem';

const CELO_SEPOLIA_CHAIN_ID = 11142220;

const USDM_CONTRACT: Address =
  '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b';

interface UsdMFeeEstimateParams {
  from?: Address;
  recipient?: Address;
  amountUnits: bigint;
  enabled: boolean;
}

export function useUsdMFeeEstimate({
  from,
  recipient,
  amountUnits,
  enabled,
}: UsdMFeeEstimateParams) {
  const ready =
    enabled &&
    Boolean(from) &&
    Boolean(recipient) &&
    amountUnits > 0n;

  const transferData =
    ready && recipient
      ? encodeFunctionData({
          abi: erc20Abi,
          functionName: 'transfer',
          args: [recipient, amountUnits],
        })
      : undefined;

  const gas = useEstimateGas({
    account: from,
    to: USDM_CONTRACT,
    data: transferData,
    value: 0n,
    chainId: CELO_SEPOLIA_CHAIN_ID,
    query: {
      enabled: ready,
      refetchInterval: 15_000,
    },
  });

  const fees = useEstimateFeesPerGas({
    chainId: CELO_SEPOLIA_CHAIN_ID,
    query: {
      enabled: ready,
      refetchInterval: 15_000,
    },
  });

  const maxFeePerGas =
    fees.data?.maxFeePerGas ??
    fees.data?.gasPrice;

  const estimatedFeeWei =
    gas.data !== undefined &&
    maxFeePerGas !== undefined
      ? gas.data * maxFeePerGas
      : undefined;

  return {
    estimatedFeeWei,
    gasLimit: gas.data,
    refetchGas: gas.refetch,
    refetchFees: fees.refetch,
    isLoading:
      ready &&
      (gas.isPending || fees.isPending),
    isError:
      ready &&
      (gas.isError || fees.isError),
    isReady: ready,
  };
}
