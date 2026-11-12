import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Check, Copy, ExternalLink, ShieldCheck, Wallet } from 'lucide-react';

export default function ProfilePage() {
  const { address, chainId, isConnected } = useAccount();
  const [copied, setCopied] = useState(false);
  const network = chainId === 11142220 ? 'Celo Sepolia Testnet'
    : chainId === 42220 ? 'Celo Mainnet' : chainId ? 'Unsupported (' + chainId + ')' : 'Not connected';

  async function copy() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="rv-page">
      <div className="rv-eyebrow">RAVOXA PROFILE</div>
      <h1>My wallet</h1>
      <p className="rv-muted">Manage the wallet you connected through MiniPay. RAVOXA never needs your recovery phrase.</p>
      <section className="rv-card">
        <h2><Wallet size={19} /> Connection</h2>
        <p className="rv-status">{isConnected ? 'Wallet connected' : 'Wallet not connected'}</p>
        <div className="rv-field"><span>Network</span><strong>{network}</strong></div>
        {address ? (
          <>
            <div className="rv-field"><span>Public wallet address</span><code className="rv-address">{address}</code></div>
            <button type="button" className="rv-primary" onClick={copy}>{copied ? <Check size={17} /> : <Copy size={17}/>} {copied ? 'Copied' : 'Copy address'}</button>
            {chainId === 11142220 && (
              <a className="rv-link" target="_blank" rel="noreferrer" href={'https://celo-sepolia.blockscout.com/address/' + address}>View on testnet explorer <ExternalLink size={15}/></a>
            )}
          </>
        ) : <p className="rv-muted">Connect through MiniPay to view your public wallet information.</p>}
      </section>
      <section className="rv-card">
        <h2><ShieldCheck size={19} /> Security</h2>
        <p className="rv-muted">MiniPay controls wallet access and approval prompts. Check the destination, token, amount and network before every transfer.</p>
        <p className="rv-muted">Never disclose your recovery phrase or private keys. RAVOXA does not store them.</p>
      </section>
      <p className="rv-disclaimer">This build is a Celo Sepolia prototype. Real-money functionality, identity verification, and account settings have not been enabled.</p>
    </div>
  );
}
