
import { useState } from 'react';
import { useAccount } from 'wagmi';
import {
  isAddress,
  formatEther,
  formatUnits,
  parseEther,
  type Address,
} from 'viem';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';

import { useCeloBalance } from '../../hooks/useCeloBalance';
import { useSendFeeEstimate } from '../../hooks/useSendFeeEstimate';

import './SendPage.css';

interface SendPageProps {
  onBack: () => void;
}

export default function SendPage({ onBack }: SendPageProps) {
  const { address, isConnected, chainId } = useAccount();

  const {
    balance: celoBalance,
    isLoading: balanceLoading,
    error: balanceError,
  } = useCeloBalance();

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);

  // NETWORK VALIDATION
  const isTestnet = chainId === 11142220;

  // RECIPIENT VALIDATION
  const recipientValid = isAddress(recipient.trim());

  const isOwnAddress =
    recipientValid &&
    recipient.trim().toLowerCase() ===
      address?.toLowerCase();

  // AMOUNT VALIDATION
  const amountValid =
    /^\d+(?:\.\d{1,18})?$/.test(amount.trim()) &&
    Number(amount.trim()) > 0;

  // CONVERT AMOUNT TO WEI
  const requestedAmountWei = amountValid
    ? parseEther(amount.trim())
    : 0n;

  // AVAILABLE BALANCE
  const availableBalance = celoBalance
    ? formatUnits(
        celoBalance.value,
        celoBalance.decimals
      )
    : null;

  // PREPARE RECIPIENT FOR GAS ESTIMATION
  const recipientAddress: Address | undefined =
    recipientValid
      ? (recipient.trim() as Address)
      : undefined;

  const canEstimateFee =
    isConnected &&
    isTestnet &&
    Boolean(address) &&
    recipientValid &&
    !isOwnAddress &&
    amountValid;

  // NETWORK FEE ESTIMATION
  const {
    estimatedFeeWei,
    isLoading: feeLoading,
    isError: feeError,
    isReady: feeQueryReady,
  } = useSendFeeEstimate({
    from: address,
    to: recipientAddress,
    value: requestedAmountWei,
    enabled: canEstimateFee,
  });

  const feeAvailable =
    feeQueryReady &&
    !feeLoading &&
    !feeError &&
    estimatedFeeWei !== undefined;

  // ESTIMATED FEE IN CELO
  const estimatedFeeCelo =
    feeAvailable && estimatedFeeWei !== undefined
      ? formatEther(estimatedFeeWei)
      : null;

  // ESTIMATED TOTAL DEDUCTION
  const totalDeductionWei =
    feeAvailable && estimatedFeeWei !== undefined
      ? requestedAmountWei + estimatedFeeWei
      : undefined;

  const totalDeductionCelo =
    totalDeductionWei !== undefined
      ? formatEther(totalDeductionWei)
      : null;

  // BALANCE VALIDATION
  const insufficientBalance =
    isTestnet &&
    amountValid &&
    celoBalance !== undefined &&
    requestedAmountWei > celoBalance.value;

  // BALANCE INCLUDING ESTIMATED FEE
  const insufficientBalanceWithFee =
    feeAvailable &&
    totalDeductionWei !== undefined &&
    celoBalance !== undefined &&
    totalDeductionWei > celoBalance.value;

  // FINAL FORM VALIDATION
  const formValid =
    isConnected &&
    isTestnet &&
    recipientValid &&
    !isOwnAddress &&
    amountValid &&
    !balanceLoading &&
    !balanceError &&
    celoBalance !== undefined &&
    !insufficientBalance &&
    feeAvailable &&
    !insufficientBalanceWithFee;

  return (
    <div className="send-page">

      {/* HEADER */}
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

      {/* WALLET CONNECTION */}
      {!isConnected || !address ? (
        <section className="send-card">
          <h2>Wallet not connected</h2>
          <p>
            Connect your wallet in MiniPay to continue.
          </p>
        </section>

      ) : !isTestnet ? (
        <section className="send-card">
          <h2>Unsupported network</h2>
          <p>
            Switch to Celo Sepolia Testnet
            to send test CELO.
          </p>
        </section>

      ) : reviewOpen && formValid ? (

        /* REVIEW TRANSFER SCREEN */
        <section className="send-card">
          <h2>Review Transfer</h2>

          <div className="send-review-details">

            <p>
              <strong>You're sending</strong>
            </p>

            <h2>{amount.trim()} CELO</h2>

            <p>
              <strong>Recipient address</strong>
            </p>

            <p style={{ overflowWrap: 'anywhere' }}>
              {recipient.trim()}
            </p>

            <p>
              <strong>Network</strong>
            </p>

            <p>Celo Sepolia Testnet</p>

            <p>
              <strong>Estimated network fee budget</strong>
            </p>

            <p>
              Up to {estimatedFeeCelo} CELO
            </p>

            <p>
              <strong>
                Estimated maximum total deduction
              </strong>
            </p>

            <h2>
              {totalDeductionCelo} CELO
            </h2>

            <p>
              <strong>Available balance</strong>
            </p>

            <p>{availableBalance} CELO</p>

          </div>

          <p>
            This is a Celo Sepolia testnet
            transfer preview. Network fees can
            change before confirmation.
            No CELO has been sent.
          </p>

          <button
            type="button"
            className="receive-copy-button"
            onClick={() => setReviewOpen(false)}
          >
            Edit Transfer
          </button>

        </section>

      ) : (

        /* SEND FORM */
        <section className="send-card">
          <h2>Transfer details</h2>

          {/* RECIPIENT */}
          <label htmlFor="send-recipient">
            Recipient wallet address
          </label>

          <input
            id="send-recipient"
            type="text"
            placeholder="0x..."
            value={recipient}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setRecipient(e.target.value)}
          />

          {recipient.trim() && !recipientValid && (
            <small className="send-error">
              Please enter a valid wallet address.
            </small>
          )}

          {isOwnAddress && (
            <small className="send-error">
              You cannot send CELO to your own wallet.
            </small>
          )}

          {/* AMOUNT */}
          <label htmlFor="send-amount">
            Amount (CELO)
          </label>

          <input
            id="send-amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            autoComplete="off"
            onChange={(e) => setAmount(e.target.value)}
          />

          {amount.trim() && !amountValid && (
            <small className="send-error">
              Enter a valid CELO amount greater than zero,
              with no more than 18 decimal places.
            </small>
          )}

          {/* AVAILABLE BALANCE */}
          <div className="send-balance-info">
            <span>Available balance</span>

            <strong>
              {balanceLoading
                ? 'Loading...'
                : balanceError
                  ? 'Unavailable'
                  : availableBalance !== null
                    ? `${availableBalance} CELO`
                    : 'Balance unavailable'}
            </strong>
          </div>

          {/* NETWORK FEE */}
          <div className="send-balance-info">
            <span>Network fee budget</span>

            <strong>
              {!canEstimateFee
                ? 'Enter transfer details'
                : feeLoading
                  ? 'Estimating...'
                  : feeError
                    ? 'Estimation failed'
                    : estimatedFeeCelo !== null
                      ? `Up to ${estimatedFeeCelo} CELO`
                      : 'Unavailable'}
            </strong>
          </div>

          {/* TOTAL DEDUCTION */}
          <div className="send-balance-info">
            <span>Estimated maximum deduction</span>

            <strong>
              {totalDeductionCelo !== null
                ? `${totalDeductionCelo} CELO`
                : 'Not available'}
            </strong>
          </div>

          {/* VALIDATION ERRORS */}
          {insufficientBalance && (
            <small className="send-error">
              Insufficient CELO balance
              for the transfer amount.
            </small>
          )}

          {!insufficientBalance &&
            insufficientBalanceWithFee && (
              <small className="send-error">
                Insufficient CELO balance
                after including the estimated network fee.
              </small>
            )}

          {canEstimateFee && feeError && (
            <small className="send-error">
              Unable to estimate the network fee.
              Check your connection and transfer details.
            </small>
          )}

          {/* TESTNET NOTICE */}
          <p>
            Celo Sepolia Testnet · No real-money value
          </p>

          {/* VALIDATION SUCCESS */}
          {formValid && (
            <div className="send-validation-success">
              Recipient, amount, estimated network
              fee, and balance checks passed.
              You can review your transfer.
            </div>
          )}

          {/* REVIEW BUTTON */}
          <button
            type="button"
            className="receive-copy-button"
            disabled={!formValid}
            onClick={() => setReviewOpen(true)}
            style={{
              opacity: formValid ? 1 : 0.5,
              cursor: formValid
                ? 'pointer'
                : 'not-allowed',
            }}
          >
            Review Transfer
          </button>

        </section>
      )}
    </div>
  );
}
