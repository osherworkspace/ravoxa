import { useState } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { ArrowLeft, ArrowLeftRight, RefreshCcw } from 'lucide-react';
import { useUsdcBalance, USDC_SEPOLIA_ADDRESS } from '../../hooks/useUsdcBalance';
import { useUsdMBalance } from '../../hooks/useUsdMBalance';

const TEST_CHAIN_ID = 11142220;
const USDM = '0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b';
const ONE_USDC = parseUnits('1', 6);
type Quote = { output: string; checkedAt: string; wallet: string };

export default function SwapPage({ onBack }: { onBack: () => void }) {
  const { address, chainId, isConnected } = useAccount();
  const usdc = useUsdcBalance();
  const usdm = useUsdMBalance();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const onTestnet = isConnected && Boolean(address) && chainId === TEST_CHAIN_ID;
  const canQuote = onTestnet && !busy && !usdc.isLoading && !usdc.error
    && usdc.balance !== undefined && usdc.balance >= ONE_USDC;
  const currentQuote = quote?.wallet === address?.toLowerCase() && onTestnet ? quote : null;

  async function getQuote() {
    if (!canQuote || !address) return;
    const wallet = address.toLowerCase();
    setBusy(true);
    setQuote(null);
    setError('');
    try {
      const { Mento, ChainId } = await import('@mento-protocol/mento-sdk');
      const mento = await Mento.create(ChainId.CELO_SEPOLIA);
      if (!(await mento.trading.isPairTradable(USDC_SEPOLIA_ADDRESS, USDM))) {
        throw new Error('Trading is currently disabled for this pair.');
      }
      const amountOut = await mento.quotes.getAmountOut(USDC_SEPOLIA_ADDRESS, USDM, ONE_USDC);
      if (amountOut <= 0n) throw new Error('No USDm output is available.');
      setQuote({ output: formatUnits(amountOut, 18), checkedAt: new Date().toLocaleTimeString(), wallet });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to fetch a quote.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rv-page">
      <button className="rv-back" onClick={onBack} type="button"><ArrowLeft size={18} /> Back</button>
      <div className="rv-eyebrow">RAVOXA WALLET</div>
      <h1>Swap</h1>
      <p className="rv-muted">Preview a USDC to USDm exchange on Celo Sepolia.</p>
      <section className="rv-card">
        <span className="rv-muted">You pay</span>
        <h2>1 USDC</h2>
        <p className="rv-muted">Available: {usdc.isLoading ? 'Loading...' : usdc.error ? 'Unavailable' : (usdc.formattedBalance ?? 'Unavailable') + ' USDC'}</p>
      </section>
      <div className="rv-swap-arrow"><ArrowLeftRight size={24}/></div>
      <section className="rv-card">
        <span className="rv-muted">You receive (indicative)</span>
        <h2 className="rv-break">{currentQuote ? currentQuote.output + ' USDm' : 'Get quote'}</h2>
        <p className="rv-muted">Available: {usdm.isLoading ? 'Loading...' : usdm.error ? 'Unavailable' : (usdm.formattedBalance ?? 'Unavailable') + ' USDm'}</p>
      </section>
      {!isConnected ? <p role="alert" className="rv-error">Connect your wallet in MiniPay first.</p>
        : !onTestnet ? <p role="alert" className="rv-error">This test swap is limited to Celo Sepolia.</p>
        : !canQuote && !busy && !usdc.isLoading && usdc.balance !== undefined && usdc.balance < ONE_USDC
          ? <p role="alert" className="rv-error">You need at least 1 testnet USDC to get a quote.</p> : null}
      <button type="button" className="rv-primary rv-full" disabled={!canQuote} onClick={getQuote}>
        <RefreshCcw size={17}/> {busy ? 'Checking quote...' : currentQuote ? 'Refresh quote' : 'Get live quote'}
      </button>
      {error && <p role="alert" className="rv-error">{error}</p>}
      {currentQuote && <p className="rv-muted" style={{textAlign:'center'}}>Quote checked at {currentQuote.checkedAt}. It may change before execution.</p>}
      <p className="rv-disclaimer"><strong>Preview only:</strong> No approval or swap functionality is enabled. A future transaction will require two explicit MiniPay authorizations and a fresh quote. These tokens are on a testnet with no real-money value.</p>
    </div>
  );
}
