import { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Copy, Link2, Unplug } from 'lucide-react';
import { useMiniPay } from '../hooks/useMiniPay';

export default function WalletConnection() {
  const { address, isConnected, chain } = useAccount();
  const { connectors, connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { isMiniPay, hasInjectedWallet } = useMiniPay();
  const [copied, setCopied] = useState(false);

  const injectedConnector = connectors.find(
    (connector) => connector.type === 'injected',
  );

  const handleConnect = () => {
    if (injectedConnector) {
      connect({ connector: injectedConnector });
    }
  };

  const handleCopy = async () => {
    if (!address) return;

    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const networkName =
    chain?.id === 42220
      ? 'Celo Mainnet'
      : chain?.id === 11142220
        ? 'Celo Sepolia'
        : chain
          ? `Unsupported network (${chain.id})`
          : 'Network unavailable';

  return (
    <section
      className="wallet-section"
      aria-labelledby="wallet-connection-title"
    >
      <div className="wallet-section-header">
        <h2 id="wallet-connection-title">Wallet connection</h2>
      </div>

      <div
        style={{
          padding: 18,
          border: '1px solid var(--ravoxa-border)',
          borderRadius: 18,
          background: 'var(--ravoxa-white)',
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div
            style={{
              width: 44,
              height: 44,
              flexShrink: 0,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 14,
              background: 'rgba(109, 93, 251, 0.10)',
              color: 'var(--ravoxa-violet)',
            }}
          >
            <Link2 size={21} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ display: 'block', fontSize: 14 }}>
              {isConnected ? 'Wallet connected' : 'Connect your wallet'}
            </strong>
            <span
              style={{
                display: 'block',
                marginTop: 4,
                color: 'var(--ravoxa-gray-dark)',
                fontSize: 12,
              }}
            >
              {isConnected
                ? isMiniPay
                  ? 'MiniPay detected'
                  : 'Connected through an injected wallet'
                : isMiniPay
                  ? 'MiniPay detected. Connect to continue.'
                  : hasInjectedWallet
                    ? 'A compatible wallet provider is available.'
                    : 'Open RAVOXA in MiniPay or a compatible wallet browser.'}
            </span>
          </div>
        </div>

        {isConnected && address && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              borderRadius: 12,
              background: 'var(--ravoxa-gray)',
            }}
          >
            <span
              style={{
                display: 'block',
                marginBottom: 6,
                fontSize: 11,
                color: 'var(--ravoxa-gray-dark)',
              }}
            >
              Connected address
            </span>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <code
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflowWrap: 'anywhere',
                  fontSize: 12,
                }}
              >
                {address}
              </code>

              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy connected wallet address"
                title="Copy address"
                style={{
                  border: 0,
                  background: 'transparent',
                  color: 'var(--ravoxa-violet)',
                  padding: 6,
                }}
              >
                <Copy size={17} />
              </button>
            </div>

            {copied && (
              <span style={{ fontSize: 12, color: 'var(--ravoxa-success)' }}>
                Address copied
              </span>
            )}

            <p
              style={{
                margin: '10px 0 0',
                fontSize: 12,
                color: 'var(--ravoxa-gray-dark)',
              }}
            >
              Network: {networkName}
            </p>
          </div>
        )}

        {isConnected ? (
          <button
            type="button"
            onClick={() => disconnect()}
            style={{
              marginTop: 14,
              width: '100%',
              padding: '12px 14px',
              border: '1px solid var(--ravoxa-border)',
              borderRadius: 12,
              background: 'var(--ravoxa-white)',
              color: 'var(--ravoxa-midnight)',
              fontWeight: 600,
            }}
          >
            <Unplug size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Disconnect wallet
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            disabled={!injectedConnector || !hasInjectedWallet || isPending}
            style={{
              marginTop: 14,
              width: '100%',
              padding: '12px 14px',
              border: 0,
              borderRadius: 12,
              background: 'var(--ravoxa-violet)',
              color: 'white',
              fontWeight: 700,
              opacity: !injectedConnector || isPending ? 0.6 : 1,
            }}
          >
            {isPending ? 'Connecting…' : 'Connect Wallet'}
          </button>
        )}

        {error && (
          <p
            role="alert"
            style={{
              margin: '12px 0 0',
              color: 'var(--ravoxa-danger)',
              fontSize: 12,
            }}
          >
            Connection failed: {error.message}
          </p>
        )}
      </div>
    </section>
  );
}
