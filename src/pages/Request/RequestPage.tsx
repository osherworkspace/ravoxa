import { useState } from 'react';
import { useAccount } from 'wagmi';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Copy, Check } from 'lucide-react';

type Token = 'USDm' | 'USDC';
export default function RequestPage({ onBack }: {onBack: () => void}) {
  const { address, chainId, isConnected } = useAccount();
  const [token, setToken] = useState<Token>('USDm');
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const supported = isConnected && address && chainId === 11142220;
  const amountValid = /^(?:[1-9]\d*|0)\.\d+$|^[1-9]\d*$/.test(amount.trim()) && Number(amount) > 0
    && (amount.split('.')[1]?.length ?? 0) <= (token === 'USDC' ? 6 : 18);
  const message = supported ? 'Please send ' + (amountValid ? amount.trim() + ' ' : '') + token +
    ' on Celo Sepolia Testnet to this address: ' + address : '';

  async function copyRequest() {
    if (!supported) return;
    try { await navigator.clipboard.writeText(message); setCopied(true); }
    catch { setCopied(false); }
  }

  return (
    <div className="rv-page">
      <button type="button" className="rv-back" onClick={onBack}><ArrowLeft size={18}/> Back</button>
      <div className="rv-eyebrow">RAVOXA WALLET</div>
      <h1>Request payment</h1>
      <p className="rv-muted">Share your public address and requested testnet amount. This does not send a transaction.</p>
      {!supported ? <p className="rv-error">Connect a wallet on Celo Sepolia to make a testnet request.</p> : <>
        <section className="rv-card rv-form">
          <label htmlFor="request-token">Asset</label>
          <select id="request-token" value={token} onChange={(e) => setToken(e.target.value as Token)}>
            <option value="USDm">USDm (Mento Dollar)</option>
            <option value="USDC">USDC (Circle)</option>
          </select>
          <label htmlFor="request-amount">Requested amount (optional)</label>
          <input id="request-amount" type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 2.50"/>
          {amount.trim() && !amountValid && <p className="rv-error">Enter a positive amount with valid decimal precision.</p>}
        </section>
        <section className="rv-card" style={{textAlign:'center'}}>
          <QRCodeSVG value={address} size={188} marginSize={2} title="Wallet public address"/>
          <p className="rv-address">{address}</p>
          <button className="rv-primary" type="button" onClick={copyRequest}><>{copied ? <Check size={17}/> : <Copy size={17}/>}</> {copied ? 'Copied request' : 'Copy request text'}</button>
        </section>
        <p className="rv-disclaimer">The QR contains the public wallet address only. The sender must independently select the correct token and Celo Sepolia network. Do not use real funds.</p>
      </>}
    </div>
  );
}
