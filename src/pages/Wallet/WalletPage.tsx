import { useState } from 'react';
import { formatUnits } from 'viem';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronRight,
  Filter,
  QrCode,
  Search,
  WalletCards,
} from 'lucide-react';

import WalletConnection from '../../components/WalletConnection';
import { useCeloBalance } from '../../hooks/useCeloBalance';
import { useUsdMBalance } from '../../hooks/useUsdMBalance';

type Asset = {
  symbol: string;
  name: string;
  balance: string;
  valueNgn: string;
  icon: string;
};

type WalletPageProps = {
  onReceive: () => void;
  onSend: () => void;
};

function WalletPage({ onReceive, onSend }: WalletPageProps) {
  const [balanceVisible, setBalanceVisible] = useState(true);

  const {
    isConnected,
    isCeloSepolia,
    balance,
    isLoading,
    error,
  } = useCeloBalance();

  const {
    formattedBalance: usdmBalance,
    isLoading: usdmLoading,
    error: usdmError,
  } = useUsdMBalance();

  const celoAmount = balance
    ? Number(formatUnits(balance.value, balance.decimals))
    : 0;
  const celoDisplay = celoAmount.toLocaleString('en-US', {
    maximumFractionDigits: 6,
  });

  const showAssets = isConnected && isCeloSepolia;

  return (
    <div className="wallet-page">
      {/* HEADER */}
      <header className="wallet-header">
        <div>
          <p className="wallet-eyebrow">RAVOXA WALLET</p>
          <h1>Wallet</h1>
        </div>

        <button
          type="button"
          className="wallet-qr-button"
          aria-label="Wallet QR code"
        >
          <QrCode size={20} />
        </button>
      </header>

      <WalletConnection />

      {/* PORTFOLIO: EXISTING CELO DISPLAY */}
      <section className="wallet-portfolio-card">
        <div className="wallet-portfolio-top">
          <span>Total portfolio</span>
          <button
            type="button"
            className="wallet-visibility"
            onClick={() => setBalanceVisible((visible) => !visible)}
            aria-label="Toggle balance visibility"
          >
            {balanceVisible ? 'Hide' : 'Show'}
          </button>
        </div>

        <h2>
          {!isConnected
            ? 'Connect wallet'
            : !isCeloSepolia
              ? 'Switch to Celo Sepolia'
              : isLoading
                ? 'Loading…'
                : error
                  ? 'Balance unavailable'
                  : `${celoDisplay} CELO`}
        </h2>

        <p>
          {balanceVisible
            ? isCeloSepolia
              ? 'Celo Sepolia testnet · Not real-money value'
              : 'Testnet balance shown only on Celo Sepolia'
            : '••••'}
        </p>

        <div className="wallet-portfolio-footer">
          <span>Across your assets</span>
          <span>{showAssets ? '2 assets · Testnet' : 'Testnet balance'}</span>
        </div>
      </section>

      {/* ACTIONS */}
      <section className="wallet-actions">
        <WalletAction
          icon={<ArrowUpFromLine size={19} />}
          label="Send"
          onClick={onSend}
        />
        <WalletAction
          icon={<ArrowDownToLine size={19} />}
          label="Receive"
          onClick={onReceive}
        />
        <WalletAction icon={<QrCode size={19} />} label="My QR" />
      </section>

      {/* ASSETS */}
      <section className="wallet-section">
        <div className="wallet-section-header">
          <h2>Your assets</h2>
          <span>{showAssets ? '2 assets' : '0 assets'}</span>
        </div>

        <div className="asset-list">
          {showAssets && (
            <>
              <AssetCard
                asset={{
                  symbol: 'USDm',
                  name: 'Mento Dollar (Celo Sepolia)',
                  balance: usdmLoading
                    ? 'Loading…'
                    : usdmError || usdmBalance === null
                      ? 'Unavailable'
                      : `${usdmBalance} USDm`,
                  valueNgn: 'Testnet stablecoin · No real-money value',
                  icon: '$',
                }}
                balanceVisible={balanceVisible}
              />

              <AssetCard
                asset={{
                  symbol: 'CELO',
                  name: 'Celo Sepolia (Testnet)',
                  balance: isLoading
                    ? 'Loading…'
                    : error
                      ? 'Unavailable'
                      : `${celoDisplay} CELO`,
                  valueNgn: 'Testnet token · No real-money value',
                  icon: 'C',
                }}
                balanceVisible={balanceVisible}
              />
            </>
          )}
        </div>
      </section>

      {/* TRANSACTIONS */}
      <section className="wallet-section">
        <div className="wallet-section-header">
          <h2>Transactions</h2>
          <button type="button" className="wallet-filter-button">
            <Filter size={15} />
            Filter
          </button>
        </div>

        <div className="wallet-search">
          <Search size={17} />
          <input
            type="search"
            placeholder="Search transactions"
            aria-label="Search transactions"
          />
        </div>

        <div className="wallet-empty-state">
          <div className="wallet-empty-icon">
            <WalletCards size={21} />
          </div>
          <h3>No transactions yet</h3>
          <p>
            Your transactions will appear here
            once you start using RAVOXA.
          </p>
        </div>
      </section>
    </div>
  );
}

type WalletActionProps = {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
};

function WalletAction({ icon, label, onClick }: WalletActionProps) {
  return (
    <button type="button" className="wallet-action" onClick={onClick}>
      <span className="wallet-action-icon">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function AssetCard({
  asset,
  balanceVisible,
}: {
  asset: Asset;
  balanceVisible: boolean;
}) {
  return (
    <button type="button" className="asset-card">
      <div className="asset-icon">{asset.icon}</div>
      <div className="asset-main">
        <strong>{asset.symbol}</strong>
        <span>{asset.name}</span>
      </div>
      <div className="asset-balance">
        <strong>{balanceVisible ? asset.balance : '••••'}</strong>
        <span>{balanceVisible ? asset.valueNgn : '••••'}</span>
      </div>
      <ChevronRight size={17} className="asset-chevron" />
    </button>
  );
}

export default WalletPage;
