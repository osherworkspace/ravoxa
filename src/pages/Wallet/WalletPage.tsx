import { useState, type ReactNode } from 'react';
import { formatUnits } from 'viem';
import { ArrowDownToLine, ArrowUpFromLine, QrCode, Search, WalletCards } from 'lucide-react';
import WalletConnection from '../../components/WalletConnection';
import { useCeloBalance } from '../../hooks/useCeloBalance';
import { useUsdMBalance } from '../../hooks/useUsdMBalance';
import { useUsdcBalance } from '../../hooks/useUsdcBalance';

type WalletPageProps = { onReceive: () => void; onSend: () => void };
type Asset = { symbol: string; name: string; balance: string; note: string; icon: string };

function AssetCard({ asset, visible }: { asset: Asset; visible: boolean }) {
  return (
    <div className="asset-card">
      <div className="asset-icon">{asset.icon}</div>
      <div className="asset-main">
        <strong>{asset.symbol}</strong>
        <span>{asset.name}</span>
      </div>
      <div className="asset-balance">
        <strong>{visible ? asset.balance : '••••'}</strong>
        <span>{visible ? asset.note : '••••'}</span>
      </div>
    </div>
  );
}

function WalletAction({ icon, label, onClick }: {icon: ReactNode;label: string;onClick: () => void}) {
  return <button type="button" className="wallet-action" onClick={onClick}>
    <span className="wallet-action-icon">{icon}</span><span>{label}</span>
  </button>;
}

export default function WalletPage({ onReceive, onSend }: WalletPageProps) {
  const [visible, setVisible] = useState(true);
  const celo = useCeloBalance();
  const usdm = useUsdMBalance();
  const usdc = useUsdcBalance();
  const onTestnet = celo.isConnected && celo.isCeloSepolia;
  const celoText = celo.balance
    ? formatUnits(celo.balance.value, celo.balance.decimals) + ' CELO' : 'Unavailable';
  const celoDisplay = celo.isLoading ? 'Loading…' : celo.error ? 'Unavailable' : celoText;
  const usdmDisplay = usdm.isLoading ? 'Loading…' : usdm.error || usdm.formattedBalance === null
    ? 'Unavailable' : usdm.formattedBalance + ' USDm';
  const usdcDisplay = usdc.isLoading ? 'Loading…' : usdc.error || usdc.formattedBalance === null
    ? 'Unavailable' : usdc.formattedBalance + ' USDC';
  const note = 'Celo Sepolia testnet · No real-money value';

  return (
    <div className="wallet-page">
      <header className="wallet-header">
        <div><p className="wallet-eyebrow">RAVOXA WALLET</p><h1>Wallet</h1></div>
        <button type="button" className="wallet-qr-button" aria-label="Show wallet QR" onClick={onReceive}>
          <QrCode size={20} />
        </button>
      </header>
      <WalletConnection />
      <section className="wallet-portfolio-card">
        <div className="wallet-portfolio-top">
          <span>CELO balance</span>
          <button type="button" className="wallet-visibility" onClick={() => setVisible((x) => !x)}
            aria-label={visible ? 'Hide wallet balances' : 'Show wallet balances'}>
            {visible ? 'Hide' : 'Show'}
          </button>
        </div>
        <h2>{!visible ? '••••••' : !celo.isConnected ? 'Connect wallet'
          : !celo.isCeloSepolia ? 'Switch to Celo Sepolia' : celoDisplay}</h2>
        <p>{visible ? note : '••••'}</p>
        <div className="wallet-portfolio-footer"><span>View assets below</span><span>{onTestnet ? '3 assets · Testnet' : 'Testnet only'}</span></div>
      </section>
      <section className="wallet-actions">
        <WalletAction icon={<ArrowUpFromLine size={19}/>} label="Send" onClick={onSend}/>
        <WalletAction icon={<ArrowDownToLine size={19}/>} label="Receive" onClick={onReceive}/>
        <WalletAction icon={<QrCode size={19}/>} label="My QR" onClick={onReceive}/>
      </section>
      <section className="wallet-section">
        <div className="wallet-section-header"><h2>Your assets</h2><span>{onTestnet ? '3 assets' : '0 assets'}</span></div>
        <div className="asset-list">
          {onTestnet && <>
            <AssetCard visible={visible} asset={{symbol:'USDm',name:'Mento Dollar (Celo Sepolia)',balance:usdmDisplay,note,icon:'$'}}/>
            <AssetCard visible={visible} asset={{symbol:'USDC',name:'Circle USDC (Celo Sepolia)',balance:usdcDisplay,note,icon:'$'}}/>
            <AssetCard visible={visible} asset={{symbol:'CELO',name:'Celo Sepolia (Testnet)',balance:celoDisplay,note,icon:'C'}}/>
          </>}
        </div>
      </section>
      <section className="wallet-section">
        <div className="wallet-section-header"><h2>Transaction history</h2></div>
        <div className="wallet-search"><Search size={17}/><input type="search" disabled aria-label="Transaction search"
          placeholder="Transaction search coming soon"/></div>
        <div className="wallet-empty-state">
          <div className="wallet-empty-icon"><WalletCards size={21}/></div>
          <h3>Activity history not connected yet</h3>
          <p>View verified testnet transactions by opening your public address in the explorer from Profile.</p>
        </div>
      </section>
    </div>
  );
}
