import { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import {
  formatEther,
  formatUnits,
  isAddress,
  parseUnits,
  type Address,
  type Hash,
} from 'viem';
import { useUsdMBalance } from '../../hooks/useUsdMBalance';
import { useCeloBalance } from '../../hooks/useCeloBalance';
import { useUsdMFeeEstimate } from '../../hooks/useUsdMFeeEstimate';
import { useUsdMSendTransaction } from '../../hooks/useUsdMSendTransaction';

const TESTNET_CHAIN_ID = 11142220;

interface TransferSnapshot {
  sender: Address;
  recipient: Address;
  amountUnits: bigint;
}

function isRejected(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as {
    code?: number;
    shortMessage?: string;
    message?: string;
    cause?: { code?: number; shortMessage?: string; message?: string };
  };
  return (
    e.code === 4001 ||
    e.cause?.code === 4001 ||
    /user rejected|user denied|rejected the request|user cancelled/i.test(
      `${e.shortMessage ?? ''} ${e.message ?? ''} ${e.cause?.message ?? ''}`
    )
  );
}

function errorDescription(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Unknown wallet error';
  const e = error as {
    code?: number | string;
    message?: string;
    shortMessage?: string;
    cause?: {
      code?: number | string;
      message?: string;
      shortMessage?: string;
    };
  };
  const code = e.code ?? e.cause?.code ?? 'unknown';
  const reason =
    e.cause?.shortMessage ?? e.shortMessage ??
    e.cause?.message ?? e.message ?? 'Unknown wallet error';
  return `${code}: ${reason}`;
}

export default function UsdMSendPanel() {
  const { address, chainId, isConnected } = useAccount();
  const {
    balance: usdmBalance,
    decimals,
    formattedBalance,
    isLoading: usdmLoading,
    error: usdmError,
    refetchBalance: refetchUsdM,
  } = useUsdMBalance();
  const {
    balance: celoBalance,
    isLoading: celoLoading,
    error: celoError,
    refetchBalance: refetchCelo,
  } = useCeloBalance();
  const {
    submitUsdMTransfer,
    transactionHash,
    isAwaitingWallet,
    isConfirming,
    isConfirmed,
    isReverted,
    receipt,
    error: transactionError,
  } = useUsdMSendTransaction();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState<TransferSnapshot | null>(null);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionLocked, setSubmissionLocked] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [submissionError, setSubmissionError] = useState('');
  const [submittedHash, setSubmittedHash] = useState<Hash | undefined>();

  const verificationLock = useRef(false);
  const submissionLock = useRef(false);
  const latest = useRef({ address, chainId, recipient, amount });
  useEffect(() => {
    latest.current = { address, chainId, recipient, amount };
  }, [address, chainId, recipient, amount]);

  const onTestnet = chainId === TESTNET_CHAIN_ID;
  const recipientValid = isAddress(recipient.trim());
  const destination = recipientValid ? recipient.trim() as Address : undefined;
  const isOwnAddress = Boolean(
    destination && address && destination.toLowerCase() === address.toLowerCase()
  );

  let amountUnits = 0n;
  let amountValid = false;
  const enteredAmount = amount.trim();
  if (
    decimals !== undefined &&
    /^\d+(?:\.\d+)?$/.test(enteredAmount) &&
    (enteredAmount.split('.')[1]?.length ?? 0) <= decimals
  ) {
    try {
      amountUnits = parseUnits(enteredAmount, decimals);
      amountValid = amountUnits > 0n;
    } catch {
      amountValid = false;
    }
  }

  const enoughUsdM =
    amountValid && usdmBalance !== undefined && amountUnits <= usdmBalance;
  const estimateEnabled = Boolean(
    isConnected && address && onTestnet && destination &&
    !isOwnAddress && amountValid && enoughUsdM
  );
  const {
    estimatedFeeWei,
    isLoading: feeLoading,
    isError: feeError,
    refetchGas,
    refetchFees,
  } = useUsdMFeeEstimate({
    from: address,
    recipient: destination,
    amountUnits,
    enabled: estimateEnabled,
  });

  const feeReady = estimateEnabled && !feeLoading && !feeError &&
    estimatedFeeWei !== undefined;
  const enoughCeloForFee = feeReady && celoBalance !== undefined &&
    estimatedFeeWei !== undefined && celoBalance.value >= estimatedFeeWei;
  const formValid = Boolean(
    estimateEnabled && !usdmLoading && !usdmError &&
    !celoLoading && !celoError && feeReady && enoughCeloForFee
  );

  const verificationPassed = Boolean(
    verified && address && onTestnet && formValid && destination &&
    verified.sender.toLowerCase() === address.toLowerCase() &&
    verified.recipient.toLowerCase() === destination.toLowerCase() &&
    verified.amountUnits === amountUnits
  );

  const activeHash = transactionHash ?? submittedHash;
  const transactionInProgress = Boolean(activeHash) || submitting || isAwaitingWallet;

  function assertUnchanged(snapshot: TransferSnapshot) {
    const now = latest.current;
    if (
      now.chainId !== TESTNET_CHAIN_ID ||
      now.address?.toLowerCase() !== snapshot.sender.toLowerCase() ||
      now.recipient.trim().toLowerCase() !== snapshot.recipient.toLowerCase() ||
      !/^\d+(?:\.\d+)?$/.test(now.amount.trim())
    ) {
      throw new Error('Wallet or transfer details changed. Review again.');
    }
    try {
      if (
        decimals === undefined ||
        parseUnits(now.amount.trim(), decimals) !== snapshot.amountUnits
      ) {
        throw new Error('Transfer amount changed. Review again.');
      }
    } catch {
      throw new Error('Transfer amount changed. Review again.');
    }
  }

  async function checkFreshTransfer(): Promise<TransferSnapshot> {
    if (
      !isConnected || !address || !onTestnet || !destination ||
      isOwnAddress || !amountValid || amountUnits <= 0n
    ) {
      throw new Error('Invalid transfer details or unsupported network.');
    }

    const snapshot: TransferSnapshot = {
      sender: address,
      recipient: destination,
      amountUnits,
    };
    assertUnchanged(snapshot);

    const [usdResult, celoResult, gasResult, feesResult] = await Promise.all([
      refetchUsdM(),
      refetchCelo(),
      refetchGas(),
      refetchFees(),
    ]);
    assertUnchanged(snapshot);

    if (
      usdResult.isError || celoResult.isError ||
      gasResult.isError || feesResult.isError
    ) {
      throw new Error('Could not refresh token balances or network fee.');
    }

    const freshUsdM = usdResult.data;
    const freshCelo = celoResult.data;
    const freshGas = gasResult.data;
    const feePerGas = feesResult.data?.maxFeePerGas ?? feesResult.data?.gasPrice;

    if (
      freshUsdM === undefined || !freshCelo ||
      freshGas === undefined || feePerGas === undefined
    ) {
      throw new Error('Fresh balance or network fee is unavailable.');
    }
    if (snapshot.amountUnits > freshUsdM) {
      throw new Error('Insufficient USDm balance.');
    }
    if (freshGas * feePerGas > freshCelo.value) {
      throw new Error('Insufficient CELO for the estimated default network fee.');
    }
    return snapshot;
  }

  async function verifyTransfer() {
    if (verificationLock.current || submissionLock.current || activeHash) return;
    verificationLock.current = true;
    setVerifying(true);
    setVerified(null);
    setVerificationMessage('');
    try {
      const snapshot = await checkFreshTransfer();
      setVerified(snapshot);
      setVerificationMessage('Latest USDm balance and default network-fee checks passed. No tokens have been sent.');
    } catch (error) {
      setVerificationMessage(error instanceof Error ? error.message : 'Verification failed.');
    } finally {
      verificationLock.current = false;
      setVerifying(false);
    }
  }

  async function confirmInMiniPay() {
    if (
      submissionLock.current || verificationLock.current ||
      transactionInProgress || !verificationPassed || !verified
    ) return;

    submissionLock.current = true;
    setSubmissionLocked(true);
    setSubmitting(true);
    setSubmissionError('');
    setSubmissionMessage('Refreshing USDm balance and network fee...');
    let walletRequestStarted = false;
    try {
      const fresh = await checkFreshTransfer();
      if (
        fresh.sender.toLowerCase() !== verified.sender.toLowerCase() ||
        fresh.recipient.toLowerCase() !== verified.recipient.toLowerCase() ||
        fresh.amountUnits !== verified.amountUnits
      ) throw new Error('Transfer details changed. Verify again.');

      setSubmissionMessage('Approve or reject this testnet USDm transfer in MiniPay.');
      walletRequestStarted = true;
      const hash = await submitUsdMTransfer(fresh.recipient, fresh.amountUnits);
      setSubmittedHash(hash);
      setSubmissionMessage('USDm transaction submitted. Waiting for confirmation.');
      // Keep locked once broadcast to prevent a duplicate transfer.
    } catch (error) {
      console.error('RAVOXA USDm wallet request:', error);
      setSubmissionMessage('');
      const rejected = isRejected(error);
      if (!walletRequestStarted || rejected) {
        submissionLock.current = false;
        setSubmissionLocked(false);
      }
      setSubmissionError(
        rejected
          ? 'Wallet approval was cancelled or rejected.'
          : walletRequestStarted
            ? `Wallet request error (${errorDescription(error)}). Check Celo Sepolia Explorer before retrying; this screen will not resubmit.`
            : `Transfer verification error: ${errorDescription(error)}`
      );
    } finally {
      setSubmitting(false);
    }
  }

  function editTransfer() {
    if (submissionLock.current || activeHash) return;
    setReviewOpen(false);
    setVerified(null);
    setVerificationMessage('');
    setSubmissionError('');
    setSubmissionMessage('');
  }

  return (
    <>
      <p className="send-intro">
        Send USDm from your connected wallet on Celo Sepolia Testnet.
      </p>
      {activeHash ? (
        <section className="send-card">
          <h2>USDm Transaction Status</h2>
          {isConfirmed ? (
            <div className="send-validation-success" role="status">Testnet USDm transfer confirmed.</div>
          ) : isReverted ? (
            <small className="send-error" role="alert">Transaction reverted on-chain. Check the explorer.</small>
          ) : transactionError ? (
            <small className="send-error" role="alert">Confirmation could not be checked. Check the explorer before retrying.</small>
          ) : (
            <p role="status">{isConfirming ? 'Waiting for confirmation...' : 'Transaction submitted. Checking confirmation...'}</p>
          )}
          <p><strong>Amount:</strong> {amount.trim()} USDm</p>
          <p style={{ overflowWrap: 'anywhere' }}><strong>Recipient:</strong> {recipient.trim()}</p>
          {isConfirmed && receipt && <p><strong>Block:</strong> {receipt.blockNumber.toString()}</p>}
          <p style={{ overflowWrap: 'anywhere' }}><strong>Hash:</strong> {activeHash}</p>
          <a href={`https://celo-sepolia.blockscout.com/tx/${activeHash}`} target="_blank" rel="noopener noreferrer">
            View on Celo Sepolia Blockscout
          </a>
          <p>Celo Sepolia Testnet · No real-money value</p>
        </section>
      ) : !isConnected || !address ? (
        <section className="send-card"><h2>Wallet not connected</h2><p>Connect through MiniPay to continue.</p></section>
      ) : !onTestnet ? (
        <section className="send-card"><h2>Unsupported network</h2><p>Switch to Celo Sepolia Testnet.</p></section>
      ) : reviewOpen ? (
        <section className="send-card">
          <h2>Review USDm Transfer</h2>
          <div className="send-review-details">
            <p><strong>You're sending</strong></p>
            <h2>{amount.trim()} USDm</h2>
            <p><strong>Recipient</strong></p>
            <p style={{ overflowWrap: 'anywhere' }}>{recipient.trim()}</p>
            <p><strong>Network</strong></p>
            <p>Celo Sepolia Testnet</p>
            <p><strong>Estimated default network-fee budget</strong></p>
            <p>{estimatedFeeWei === undefined ? 'Unavailable' : `Up to ${formatEther(estimatedFeeWei)} CELO`}</p>
            <p><strong>Available USDm</strong></p>
            <p>{formattedBalance ?? 'Unavailable'} USDm</p>
            <p><strong>Available CELO</strong></p>
            <p>{celoBalance ? formatUnits(celoBalance.value, celoBalance.decimals) : 'Unavailable'} CELO</p>
          </div>
          <p>Testnet only. The fee estimate assumes default CELO gas payment; MiniPay may use a different fee currency. No transfer starts until you confirm and approve it in MiniPay.</p>
          <button type="button" className="receive-copy-button"
            disabled={verifying || submitting || isAwaitingWallet || submissionLocked}
            onClick={verifyTransfer}>
            {verifying ? 'Refreshing balances and fee...' : 'Verify Transfer'}
          </button>
          {verificationMessage && (
            <p role="status" className={verificationPassed ? 'send-validation-success' : 'send-error'}>
              {verificationMessage}
            </p>
          )}
          {submissionMessage && <p role="status">{submissionMessage}</p>}
          {submissionError && <small className="send-error" role="alert">{submissionError}</small>}
          {verificationPassed && (
            <button type="button" className="receive-copy-button"
              disabled={verifying || submitting || isAwaitingWallet || submissionLocked}
              onClick={confirmInMiniPay}>
              {submitting || isAwaitingWallet ? 'Waiting for MiniPay...' : 'Confirm in MiniPay'}
            </button>
          )}
          <button type="button" className="receive-copy-button"
            disabled={submitting || isAwaitingWallet || submissionLocked} onClick={editTransfer}>
            Edit Transfer
          </button>
        </section>
      ) : (
        <section className="send-card">
          <h2>USDm Transfer Details</h2>
          <label htmlFor="usdm-send-recipient">Recipient wallet address</label>
          <input id="usdm-send-recipient" type="text" placeholder="0x..." value={recipient}
            autoComplete="off" spellCheck={false} onChange={e => {
              setRecipient(e.target.value);
              setVerified(null);
              setVerificationMessage('');
            }} />
          {recipient.trim() && !recipientValid && <small className="send-error">Enter a valid EVM wallet address.</small>}
          {isOwnAddress && <small className="send-error">Cannot transfer to your own wallet.</small>}
          <label htmlFor="usdm-send-amount">Amount (USDm)</label>
          <input id="usdm-send-amount" type="text" inputMode="decimal" placeholder="0.00" value={amount}
            autoComplete="off" onChange={e => {
              setAmount(e.target.value);
              setVerified(null);
              setVerificationMessage('');
            }} />
          {enteredAmount && !amountValid && <small className="send-error">Enter a USDm amount greater than zero, with no more than {decimals ?? 18} decimal places.</small>}
          <div className="send-balance-info">
            <span>Available USDm</span>
            <strong>{usdmLoading ? 'Loading...' : usdmError ? 'Unavailable' : `${formattedBalance ?? 'Unavailable'} USDm`}</strong>
          </div>
          <div className="send-balance-info">
            <span>Available CELO (default fee asset)</span>
            <strong>{celoLoading ? 'Loading...' : celoError ? 'Unavailable' : celoBalance ? `${formatUnits(celoBalance.value, celoBalance.decimals)} CELO` : 'Unavailable'}</strong>
          </div>
          <div className="send-balance-info">
            <span>Estimated default network fee</span>
            <strong>{!estimateEnabled ? 'Enter valid details with sufficient USDm' : feeLoading ? 'Estimating...' : feeError ? 'Estimate failed' : estimatedFeeWei !== undefined ? `Up to ${formatEther(estimatedFeeWei)} CELO` : 'Unavailable'}</strong>
          </div>
          {amountValid && usdmBalance !== undefined && !enoughUsdM &&
            <small className="send-error">Insufficient USDm balance. Obtain testnet USDm before sending.</small>}
          {feeReady && !enoughCeloForFee &&
            <small className="send-error">Insufficient CELO for the estimated default network fee.</small>}
          {estimateEnabled && feeError &&
            <small className="send-error">Unable to estimate the token transfer gas. Check your USDm balance and network connection.</small>}
          <p>Celo Sepolia Testnet · No real-money value</p>
          {formValid && <div className="send-validation-success">Balance, address, and estimated-fee checks passed. Review before authorizing.</div>}
          <button type="button" className="receive-copy-button" disabled={!formValid}
            onClick={() => {
              setVerified(null);
              setVerificationMessage('');
              setReviewOpen(true);
            }} style={{ opacity: formValid ? 1 : 0.5, cursor: formValid ? 'pointer' : 'not-allowed' }}>
            Review USDm Transfer
          </button>
        </section>
      )}
    </>
  );
}
