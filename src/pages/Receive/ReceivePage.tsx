import './ReceivePage.css';
import { useState } from 'react';
import { useAccount } from 'wagmi';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft,
  Copy,
  Check,
  Wallet,
  ShieldCheck,
  QrCode,
} from 'lucide-react';

interface ReceivePageProps {
  onBack: () => void;
}

export default function ReceivePage({ onBack }: ReceivePageProps) {
  const { address, isConnected, chainId } = useAccount();
  const [copied, setCopied] = useState(false);

  const network =
    chainId === 11142220
      ? 'Celo Sepolia Testnet'
      : chainId === 42220
        ? 'Celo Mainnet'
        : 'Unsupported network';

  const supportedNetwork =
    chainId === 11142220 || chainId === 42220;

  const copyAddress = async () => {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
    } catch {
      setCopied(false);
      alert('Unable to copy address.');
    }
  };

  return (
    <div className="receive-page">
      <header className="receive-header">
        <button
          type="button"
          className="receive-back"
          onClick={onBack}
          aria-label="Go back"
        >
          <ArrowLeft size={22} />
        </button>

        <div className="receive-header-title">
          <span>RAVOXA WALLET</span>
          <h1>Receive</h1>
        </div>

        <div className="receive-header-icon">
          <QrCode size={22} />
        </div>
      </header>

      <p className="receive-intro">
        Share your wallet address to receive supported assets.
      </p>

      {!isConnected || !address ? (
        <section className="receive-empty">
          <Wallet size={42} />
          <h2>Wallet not connected</h2>
          <p>
            Connect your wallet in MiniPay to display
            your receiving address.
          </p>
        </section>
      ) : (
        <>
          <section className="receive-card">
            <div className="receive-network">
              <span className="receive-network-dot" />
              {network}
            </div>

            <div className="receive-qr-container">
              <QRCodeSVG
                value={address}
                size={210}
                marginSize={2}
                bgColor="#FFFFFF"
                fgColor="#111827"
                title="Wallet receiving address"
              />
            </div>

            <h2>Scan to receive</h2>

            <p className="receive-scan-description">
              Scan this QR code to get your wallet address.
            </p>

            <div className="receive-address-box">
              <span>Your wallet address</span>
              <strong>{address}</strong>
            </div>

            <button
              type="button"
              className="receive-copy-button"
              onClick={copyAddress}
            >
              {copied ? <Check size={19} /> : <Copy size={19} />}
              {copied ? 'Address Copied!' : 'Copy Address'}
            </button>
          </section>

          <div className="receive-security">
            <ShieldCheck size={23} />
            <p>
              {supportedNetwork
                ? chainId === 11142220
                  ? 'You are using Celo Sepolia Testnet. Test tokens have no real-money value. Never send real funds here.'
                  : 'Only send supported assets using the Celo network. Always verify the network before transferring.'
                : 'Unsupported network. Switch to a supported Celo network before receiving assets.'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
