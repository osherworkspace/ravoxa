
import {
  useEstimateGas,
  useEstimateFeesPerGas,
} from 'wagmi';
import type { Address } from 'viem';

interface FeeEstimateParams {
  from?: Address;
  to?: Address;
  value: bigint;
  enabled: boolean;
}

export function useSendFeeEstimate({
  from,
  to,
  value,
  enabled,
}: FeeEstimateParams) {
  const ready =
    enabled &&
    Boolean(from) &&
    Boolean(to) &&
    value > 0n;

  const gas = useEstimateGas({
    account: from,
    to,
    value,
    chainId: 11142220,
    query: {
      enabled: ready,
      refetchInterval: 15_000,
    },
  });

  const fees = useEstimateFeesPerGas({
    chainId: 11142220,
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
    isLoading:
      ready &&
      (gas.isPending || fees.isPending),
    isError:
      ready &&
      (gas.isError || fees.isError),
    isReady: ready,
  };
}
