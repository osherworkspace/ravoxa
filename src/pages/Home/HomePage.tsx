import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  Eye,
  EyeOff,
  Plus,
  Repeat2,
  Target,
  WalletCards,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { formatUnits } from 'viem';
import { useCeloBalance } from '../../hooks/useCeloBalance';
import { useUsdMBalance } from '../../hooks/useUsdMBalance';
import { useUsdcBalance } from '../../hooks/useUsdcBalance';

function HomePage({ onReceive, onSend, onRequest, onSwap, onPlan }: { onReceive: () => void; onSend: () => void; onRequest: () => void; onSwap: () => void; onPlan: () => void }) {
  const [balanceVisible, setBalanceVisible] = useState(true);

  const { balance: celoBalance, isConnected, isCeloSepolia } = useCeloBalance();
  const usdm = useUsdMBalance();
  const usdc = useUsdcBalance();
  const supported = isConnected && isCeloSepolia;
  const usdMText = !supported ? 'Connect testnet wallet' : usdm.isLoading ? 'Loading USDm…' : usdm.error || usdm.formattedBalance === null ? 'USDm unavailable' : usdm.formattedBalance + ' USDm';
  const usdcText = !supported ? 'Celo Sepolia only' : usdc.isLoading ? 'Loading USDC…' : usdc.error || usdc.formattedBalance === null ? 'USDC unavailable' : usdc.formattedBalance + ' USDC';
  const celoText = supported && celoBalance ? formatUnits(celoBalance.value, celoBalance.decimals) + ' CELO' : '—';
  const balance = balanceVisible ? usdMText : '••••••';
  const usdBalance = balanceVisible ? usdcText : '••••••';

  return (
    <div className="home-page">

      {/* HEADER */}
      <header className="home-header">
        <div className="brand-block">
          <h1 className="brand-name">RAVOXA</h1>
          <p className="brand-tagline">
            See your money differently.
          </p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="icon-button"
            aria-label="Notifications not yet enabled"
            disabled
            title="Notifications coming soon"
          >
            <Bell size={19} strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* BALANCE */}
      <section className="balance-card">
        <div className="balance-top">
          <p className="balance-label">USDm testnet balance</p>

          <button
            type="button"
            className="balance-visibility"
            onClick={() => setBalanceVisible((value) => !value)}
            aria-label={
              balanceVisible ? 'Hide balance' : 'Show balance'
            }
          >
            {balanceVisible ? (
              <Eye size={18} />
            ) : (
              <EyeOff size={18} />
            )}
          </button>
        </div>

        <h2 className="balance-value">{balance}</h2>

        <p className="balance-secondary">
          {usdBalance}
        </p>

        <div className="balance-footer">
          <span className="balance-status">
            <span className="status-dot" />
            Celo Sepolia · Testnet
          </span>

          <span>
            {balanceVisible ? celoText : '••••'}
          </span>
        </div>
      </section>

      {/* SAFE TO SPEND */}
      <section className="safe-spend-card">
        <div className="safe-spend-left">
          <div className="safe-spend-icon">
            <WalletCards size={20} />
          </div>

          <div>
            <p className="safe-spend-label">
              USDm available
            </p>

            <p className="safe-spend-value">
              {balanceVisible ? usdMText : '••••••'}
            </p>
          </div>
        </div>

        <ChevronRight
          size={19}
          className="safe-spend-arrow"
        />
      </section>

      {/* QUICK ACTIONS */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">
            Quick actions
          </h2>
        </div>

        <div className="quick-actions">
          <QuickAction
            icon={<ArrowUpFromLine size={20} />}
            label="Send"
            onClick={onSend}
          />

          <QuickAction
            icon={<ArrowDownToLine size={20} />}
            label="Receive"
            onClick={onReceive}
          />

          <QuickAction
            icon={<Plus size={20} />}
            label="Request"
            onClick={onRequest}
          />

          <QuickAction
            icon={<Repeat2 size={20} />}
            label="Swap"
            onClick={onSwap}
          />
        </div>
      </section>

      {/* FINANCIAL SNAPSHOT */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">
            Financial snapshot
          </h2>

          <span className="section-link">
            This month
          </span>
        </div>

        <div className="snapshot-grid">

          <div className="snapshot-card">
            <div className="snapshot-icon">
              <TrendingUp size={17} />
            </div>

            <p className="snapshot-label">
              Spending
            </p>

            <p className="snapshot-value">
              {balanceVisible ? 'Not tracked' : '••••'}
            </p>
          </div>

          <div className="snapshot-card">
            <div className="snapshot-icon">
              <Target size={17} />
            </div>

            <p className="snapshot-label">
              Saved
            </p>

            <p className="snapshot-value">
              {balanceVisible ? 'Not tracked' : '••••'}
            </p>
          </div>

        </div>
      </section>

      {/* SAVINGS GOALS */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">
            Savings goals
          </h2>

          <Target
            size={18}
            color="var(--ravoxa-violet)"
          />
        </div>

        <div className="goal-card">
          <div className="goal-icon">
            <Target size={22} />
          </div>

          <h3 className="goal-title">
            What are you saving for?
          </h3>

          <p className="goal-description">
            Create a goal and give your money
            a clear direction.
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={onPlan}
          >
            Create a goal
          </button>
        </div>
      </section>

      {/* INSIGHT */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">
            RAVOXA Insight
          </h2>
        </div>

        <div className="insight-card">

          <div className="insight-header">
            <div className="insight-icon">
              <Sparkles size={17} />
            </div>

            <h3 className="insight-title">
              Your financial story starts here.
            </h3>
          </div>

          <p className="insight-text">
            Once you start using RAVOXA, we'll help
            you understand spending, savings and
            your financial progress.
          </p>

        </div>
      </section>

      {/* RECENT ACTIVITY */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">
            Recent activity
          </h2>

          <span className="section-link">
            View all
          </span>
        </div>

        <div className="empty-activity">

          <div className="empty-activity-icon">
            <WalletCards size={20} />
          </div>

          <h3 className="empty-activity-title">
            Activity history not connected yet
          </h3>

          <p className="empty-activity-text">
            To see your actual testnet transactions, open your public
            wallet address in the Celo Sepolia explorer via Profile.
          </p>

        </div>
      </section>

    </div>
  );
}

interface QuickActionProps {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}

function QuickAction({
  icon,
  label,
  onClick,
}: QuickActionProps) {
  return (
    <button
      type="button"
      className="quick-action"
      onClick={onClick}
    >
      <span className="quick-action-icon">
        {icon}
      </span>

      <span className="quick-action-label">
        {label}
      </span>
    </button>
  );
}

export default HomePage;