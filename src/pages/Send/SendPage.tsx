import { useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import {
  formatEther,
  formatUnits,
  isAddress,
  parseEther,
  type Address,
  type Hash,
} from 'viem';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { useCeloBalance } from '../../hooks/useCeloBalance';
import { useSendFeeEstimate } from '../../hooks/useSendFeeEstimate';
import { useCeloSendTransaction } from '../../hooks/useCeloSendTransaction';
import './SendPage.css';

const TESTNET_CHAIN_ID = 11142220;

interface SendPageProps {
  onBack: () => void;
}

interface VerifiedTransfer {
  sender: Address;
  recipient: string;
  amountWei: bigint;
}

function isWalletRejection(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as {
    code?: number;
    shortMessage?: string;
    message?: string;
    cause?: { code?: number };
  };
  return (
    e.code === 4001 ||
    e.cause?.code === 4001 ||
    /user rejected|user denied|rejected the request|user cancelled/i.test(
      `${e.shortMessage ?? ''} ${e.message ?? ''}`
    )
  );
}

export default function SendPage({ onBack }: SendPageProps) {
  const { address, isConnected, chainId } = useAccount();
  const {
    balance: celoBalance,
    isLoading: balanceLoading,
    error: balanceError,
    refetchBalance,
  } = useCeloBalance();
  const {
    submitTestTransfer,
    transactionHash,
    isAwaitingWallet,
    isConfirming,
    isConfirmed,
    isReverted,
    receipt,
    error: transactionError,
  } = useCeloSendTransaction();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [checkingTransfer, setCheckingTransfer] = useState(false);
  const [verified, setVerified] = useState<VerifiedTransfer | null>(null);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [submissionError, setSubmissionError] = useState('');
  const [submittedHash, setSubmittedHash] = useState<Hash | undefined>();

  // Locks operate immediately, before React has time to rerender.
  const checkingLockRef = useRef(false);
  const submissionLockRef = useRef(false);
  const latestDetailsRef = useRef({ address, chainId, recipient, amount });
  latestDetailsRef.current = { address, chainId, recipient, amount };

  const isTestnet = chainId === TESTNET_CHAIN_ID;
  const recipientValid = isAddress(recipient.trim());
  const isOwnAddress =
    recipientValid &&
    recipient.trim().toLowerCase() === address?.toLowerCase();

  const amountValid =
    /^\d+(?:\.\d{1,18})?$/.test(amount.trim()) &&
    Number(amount.trim()) > 0;
  const requestedAmountWei = amountValid ? parseEther(amount.trim()) : 0n;

  const recipientAddress: Address | undefined = recipientValid
    ? (recipient.trim() as Address)
    : undefined;
  const canEstimateFee =
    isConnected && isTestnet && Boolean(address) &&
    recipientValid && !isOwnAddress && amountValid;

  const {
    estimatedFeeWei,
    isLoading: feeLoading,
    isError: feeError,
    isReady: feeQueryReady,
    refetchGas,
    refetchFees,
  } = useSendFeeEstimate({
    from: address,
    to: recipientAddress,
    value: requestedAmountWei,
    enabled: canEstimateFee,
  });

  const feeAvailable =
    feeQueryReady && !feeLoading && !feeError &&
    estimatedFeeWei !== undefined;
  const estimatedFeeCelo = feeAvailable && estimatedFeeWei !== undefined
    ? formatEther(estimatedFeeWei)
    : null;
  const totalDeductionWei = feeAvailable && estimatedFeeWei !== undefined
    ? requestedAmountWei + estimatedFeeWei
    : undefined;
  const totalDeductionCelo = totalDeductionWei !== undefined
    ? formatEther(totalDeductionWei)
    : null;
  const availableBalance = celoBalance
    ? formatUnits(celoBalance.value, celoBalance.decimals)
    : null;
  const insufficientBalance =
    amountValid && celoBalance !== undefined &&
    requestedAmountWei > celoBalance.value;
  const insufficientBalanceWithFee =
    totalDeductionWei !== undefined && celoBalance !== undefined &&
    totalDeductionWei > celoBalance.value;

  const formValid =
    isConnected && isTestnet && recipientValid && !isOwnAddress &&
    amountValid && !balanceLoading && !balanceError &&
    celoBalance !== undefined && !insufficientBalance &&
    feeAvailable && !insufficientBalanceWithFee;

  // A verification applies only to these exact transfer details.
  const verificationPassed = Boolean(
    verified && address &&
    verified.sender.toLowerCase() === address.toLowerCase() &&
    isTestnet &&
    verified.recipient.toLowerCase() === recipient.trim().toLowerCase() &&
    verified.amountWei === requestedAmountWei &&
    formValid
  );

  const activeHash = transactionHash ?? submittedHash;
  const transactionInProgress =
    Boolean(activeHash) || isSubmitting || isAwaitingWallet;

  function assertUnchanged(
    sender: Address,
    destination: string,
    value: bigint
  ) {
    const latest = latestDetailsRef.current;
    if (
      latest.chainId !== TESTNET_CHAIN_ID ||
      latest.address?.toLowerCase() !== sender.toLowerCase() ||
      latest.recipient.trim().toLowerCase() !== destination.toLowerCase() ||
      !/^\d+(?:\.\d{1,18})?$/.test(latest.amount.trim()) ||
      parseEther(latest.amount.trim()) !== value
    ) {
      throw new Error('Wallet or transfer details changed. Review again.');
    }
  }

  async function checkFreshTransfer() {
    if (
      !isConnected || !address || !isTestnet ||
      !recipientValid || isOwnAddress || !amountValid ||
      requestedAmountWei <= 0n
    ) {
      throw new Error('Invalid transfer details or network.');
    }
    const sender = address;
    const destination = recipient.trim();
    const value = requestedAmountWei;
    assertUnchanged(sender, destination, value);

    const [balanceResult, gasResult, feesResult] = await Promise.all([
      refetchBalance(),
      refetchGas(),
      refetchFees(),
    ]);
    assertUnchanged(sender, destination, value);

    if (balanceResult.isError || gasResult.isError || feesResult.isError) {
      throw new Error('Could not refresh the balance and network fee.');
    }
    const freshBalance = balanceResult.data;
    const freshGas = gasResult.data;
    const freshFees = feesResult.data;
    const feePerGas = freshFees?.maxFeePerGas ?? freshFees?.gasPrice;

    if (!freshBalance || freshGas === undefined || feePerGas === undefined) {
      throw new Error('Fresh balance or network fee is unavailable.');
    }
    if (value + freshGas * feePerGas > freshBalance.value) {
      throw new Error('Insufficient CELO for the transfer and network fee.');
    }
    return { sender, destination, value };
  }

  async function verifyTransfer() {
    if (checkingLockRef.current || submissionLockRef.current || activeHash) {
      return;
    }
    checkingLockRef.current = true;
    setCheckingTransfer(true);
    setVerified(null);
    setVerificationMessage('');
    try {
      const fresh = await checkFreshTransfer();
      setVerified({
        sender: fresh.sender,
        recipient: fresh.destination,
        amountWei: fresh.value,
      });
      setVerificationMessage(
        'Latest balance and network fee checks passed. No CELO has been sent.'
      );
    } catch (error) {
      setVerificationMessage(
        error instanceof Error ? error.message : 'Verification failed.'
      );
    } finally {
      checkingLockRef.current = false;
      setCheckingTransfer(false);
    }
  }

  async function confirmInMiniPay() {
    if (
      submissionLockRef.current || checkingLockRef.current ||
      transactionInProgress || !verificationPassed || !formValid
    ) {
      return;
    }
    submissionLockRef.current = true;
    setIsSubmitting(true);
    setSubmissionError('');
    setSubmissionMessage('Refreshing balance and network fee...');
    let walletRequestStarted = false;

    try {
      // Reverify immediately before requesting wallet authorization.
      const fresh = await checkFreshTransfer();
      if (
        !verified ||
        verified.sender.toLowerCase() !== fresh.sender.toLowerCase() ||
        verified.recipient.toLowerCase() !== fresh.destination.toLowerCase() ||
        verified.amountWei !== fresh.value
      ) {
        throw new Error('Transfer details changed. Verify again.');
      }
      setSubmissionMessage('Approve or reject the request in MiniPay.');
      walletRequestStarted = true;
      const hash = await submitTestTransfer(fresh.destination, fresh.value);
      setSubmittedHash(hash);
      setSubmissionMessage('Transaction submitted. Waiting for confirmation.');
      // Do not unlock after broadcast: a second click could double-send.
    } catch (error) {
      const rejected = isWalletRejection(error);
      const walletError = error as {
        code?: number | string;
        shortMessage?: string;
        message?: string;
        cause?: {
          code?: number | string;
          shortMessage?: string;
          message?: string;
        };
      };
      const errorCode = walletError?.code ?? walletError?.cause?.code;
      const errorReason =
        walletError?.cause?.shortMessage ??
        walletError?.shortMessage ??
        walletError?.cause?.message ??
        walletError?.message ??
        'Unknown wallet error';

      console.error('RAVOXA MiniPay transaction error:', error);
      setSubmissionMessage('');

      // Preserve the lock after an uncertain wallet request to prevent
      // duplicate submissions. Only unlock for pre-request errors or rejection.
      if (!walletRequestStarted || rejected) {
        submissionLockRef.current = false;
      }

      setSubmissionError(
        rejected
          ? 'Wallet approval was cancelled or rejected.'
          : walletRequestStarted
            ? `Wallet request error (${errorCode ?? 'unknown'}): ${errorReason}. Check Celo Sepolia Explorer before retrying; RAVOXA will not resubmit on this screen.`
            : `Transfer verification error: ${errorReason}`
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function editTransfer() {
    if (submissionLockRef.current || activeHash) return;
    setReviewOpen(false);
    setVerified(null);
    setVerificationMessage('');
    setSubmissionError('');
    setSubmissionMessage('');
  }

  return (
    <div className="send-page">
      <header className="send-header">
        <button
          type="button"
          className="send-back"
          onClick={onBack}
          aria-label="Go back"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="send-header-title">
          <span>RAVOXA WALLET</span>
          <h1>Send Money</h1>
        </div>
        <div className="send-header-icon">
          <ArrowUpRight size={22} />
        </div>
      </header>

      <p className="send-intro">
        Send CELO securely from your connected wallet.
      </p>

      {activeHash ? (
        <section className="send-card">
          <h2>Transaction Status</h2>
          {isConfirmed ? (
            <div className="send-validation-success" role="status">
              Testnet transaction confirmed successfully.
            </div>
          ) : isReverted ? (
            <small className="send-error" role="alert">
              The blockchain reverted this transaction. Check the explorer.
            </small>
          ) : transactionError ? (
            <small className="send-error" role="alert">
              Confirmation could not be checked. Check the explorer before
              attempting another transfer.
            </small>
          ) : (
            <p role="status">
              {isConfirming
                ? 'Waiting for blockchain confirmation...'
                : 'Transaction submitted. Checking confirmation...'}
            </p>
          )}
          <p><strong>Amount:</strong> {amount.trim()} CELO</p>
          <p style={{ overflowWrap: 'anywhere' }}>
            <strong>Recipient:</strong> {recipient.trim()}
          </p>
          {isConfirmed && receipt && (
            <p><strong>Confirmed in block:</strong> {receipt.blockNumber.toString()}</p>
          )}
          <p style={{ overflowWrap: 'anywhere' }}>
            <strong>Transaction hash:</strong> {activeHash}
          </p>
          <a
            href={`https://celo-sepolia.blockscout.com/tx/${activeHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View transaction on Celo Sepolia Blockscout
          </a>
          <p>Celo Sepolia Testnet · No real-money value</p>
        </section>
      ) : !isConnected || !address ? (
        <section className="send-card">
          <h2>Wallet not connected</h2>
          <p>Connect your wallet in MiniPay to continue.</p>
        </section>
      ) : !isTestnet ? (
        <section className="send-card">
          <h2>Unsupported network</h2>
          <p>Switch to Celo Sepolia Testnet to send test CELO.</p>
        </section>
      ) : reviewOpen ? (
        <section className="send-card">
          <h2>Review Transfer</h2>
          <div className="send-review-details">
            <p><strong>You're sending</strong></p>
            <h2>{amount.trim()} CELO</h2>
            <p><strong>Recipient address</strong></p>
            <p style={{ overflowWrap: 'anywhere' }}>{recipient.trim()}</p>
            <p><strong>Network</strong></p>
            <p>Celo Sepolia Testnet</p>
            <p><strong>Estimated network fee budget</strong></p>
            <p>{estimatedFeeCelo !== null ? `Up to ${estimatedFeeCelo} CELO` : 'Unavailable'}</p>
            <p><strong>Estimated maximum total deduction</strong></p>
            <h2>{totalDeductionCelo !== null
              ? `${totalDeductionCelo} CELO`
              : 'Unavailable'}</h2>
            <p><strong>Available balance</strong></p>
            <p>{availableBalance !== null
              ? `${availableBalance} CELO`
              : 'Unavailable'}</p>
          </div>
          <p>
            Celo Sepolia testnet only. Fees can change. Nothing will be sent
            until you tap Confirm in MiniPay and approve the wallet request.
          </p>

          <button
            type="button"
            className="receive-copy-button"
            disabled={checkingTransfer || isSubmitting || isAwaitingWallet}
            onClick={verifyTransfer}
          >
            {checkingTransfer ? 'Checking Balance & Fee...' : 'Verify Transfer'}
          </button>

          {verificationMessage && (
            <div
              role="status"
              style={{
                marginTop: '14px',
                padding: '12px',
                borderRadius: '12px',
                background: verificationPassed ? '#ECFDF5' : '#FEF2F2',
                color: verificationPassed ? '#166534' : '#DC2626',
                fontSize: '13px',
                lineHeight: 1.6,
              }}
            >
              {verificationPassed
                ? verificationMessage
                : 'Verification required: ' + verificationMessage}
            </div>
          )}

          {submissionMessage && <p role="status">{submissionMessage}</p>}
          {submissionError && (
            <small className="send-error" role="alert">{submissionError}</small>
          )}

          {verificationPassed && (
            <button
              type="button"
              className="receive-copy-button"
              disabled={checkingTransfer || isSubmitting || isAwaitingWallet || submissionLockRef.current}
              onClick={confirmInMiniPay}
            >
              {isSubmitting || isAwaitingWallet
                ? 'Waiting for MiniPay...'
                : 'Confirm in MiniPay'}
            </button>
          )}

          <button
            type="button"
            className="receive-copy-button"
            disabled={isSubmitting || isAwaitingWallet || submissionLockRef.current}
            onClick={editTransfer}
          >
            Edit Transfer
          </button>
        </section>
      ) : (
        <section className="send-card">
          <h2>Transfer details</h2>
          <label htmlFor="send-recipient">Recipient wallet address</label>
          <input
            id="send-recipient"
            type="text"
            placeholder="0x..."
            value={recipient}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => {
              setRecipient(e.target.value);
              setVerified(null);
              setVerificationMessage('');
            }}
          />
          {recipient.trim() && !recipientValid && (
            <small className="send-error">Please enter a valid wallet address.</small>
          )}
          {isOwnAddress && (
            <small className="send-error">You cannot send CELO to your own wallet.</small>
          )}

          <label htmlFor="send-amount">Amount (CELO)</label>
          <input
            id="send-amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            autoComplete="off"
            onChange={(e) => {
              setAmount(e.target.value);
              setVerified(null);
              setVerificationMessage('');
            }}
          />
          {amount.trim() && !amountValid && (
            <small className="send-error">
              Enter a valid CELO amount greater than zero, with no more than
              18 decimal places.
            </small>
          )}

          <div className="send-balance-info">
            <span>Available balance</span>
            <strong>
              {balanceLoading ? 'Loading...' : balanceError ? 'Unavailable'
                : availableBalance !== null ? `${availableBalance} CELO` : 'Balance unavailable'}
            </strong>
          </div>
          <div className="send-balance-info">
            <span>Network fee budget</span>
            <strong>
              {!canEstimateFee ? 'Enter transfer details' : feeLoading ? 'Estimating...'
                : feeError ? 'Estimation failed'
                : estimatedFeeCelo !== null ? `Up to ${estimatedFeeCelo} CELO` : 'Unavailable'}
            </strong>
          </div>
          <div className="send-balance-info">
            <span>Estimated maximum deduction</span>
            <strong>{totalDeductionCelo !== null ? `${totalDeductionCelo} CELO` : 'Not available'}</strong>
          </div>
          {insufficientBalance && (
            <small className="send-error">Insufficient CELO balance for this amount.</small>
          )}
          {!insufficientBalance && insufficientBalanceWithFee && (
            <small className="send-error">
              Insufficient CELO balance after including the estimated network fee.
            </small>
          )}
          {canEstimateFee && feeError && (
            <small className="send-error">
              Unable to estimate the network fee. Check your connection.
            </small>
          )}
          <p>Celo Sepolia Testnet · No real-money value</p>
          {formValid && (
            <div className="send-validation-success">
              Recipient, amount, estimated fee, and balance checks passed.
              Review your transfer before wallet authorization.
            </div>
          )}
          <button
            type="button"
            className="receive-copy-button"
            disabled={!formValid}
            onClick={() => {
              setVerified(null);
              setVerificationMessage('');
              setReviewOpen(true);
            }}
            style={{
              opacity: formValid ? 1 : 0.5,
              cursor: formValid ? 'pointer' : 'not-allowed',
            }}
          >
            Review Transfer
          </button>
        </section>
      )}
    </div>
  );
}
