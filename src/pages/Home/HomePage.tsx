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

function HomePage() {
  const [balanceVisible, setBalanceVisible] = useState(true);

  const balance = balanceVisible ? '₦0.00' : '₦••••••';
  const usdBalance = balanceVisible ? '≈ $0.00' : '≈ $••••';

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
            aria-label="Notifications"
          >
            <Bell size={19} strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* BALANCE */}
      <section className="balance-card">
        <div className="balance-top">
          <p className="balance-label">Total balance</p>

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
            Available balance
          </span>

          <span>
            {balanceVisible ? '₦0.00' : '••••'}
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
              Safe to spend
            </p>

            <p className="safe-spend-value">
              {balanceVisible ? '₦0.00' : '₦••••••'}
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
          />

          <QuickAction
            icon={<ArrowDownToLine size={20} />}
            label="Receive"
          />

          <QuickAction
            icon={<Plus size={20} />}
            label="Request"
          />

          <QuickAction
            icon={<Repeat2 size={20} />}
            label="Swap"
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
              {balanceVisible ? '₦0' : '₦•••'}
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
              {balanceVisible ? '₦0' : '₦•••'}
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
            No transactions yet
          </h3>

          <p className="empty-activity-text">
            Your financial story starts with
            your first transaction.
          </p>

        </div>
      </section>

    </div>
  );
}

interface QuickActionProps {
  icon: ReactNode;
  label: string;
}

function QuickAction({
  icon,
  label,
}: QuickActionProps) {
  return (
    <button
      type="button"
      className="quick-action"
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