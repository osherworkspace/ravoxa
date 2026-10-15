import { useState } from 'react';
import { AppShell, type NavigationTab } from './layouts/AppShell';
import HomePage from './pages/Home/HomePage';
import WalletPage from './pages/Wallet/WalletPage';
import ReceivePage from './pages/Receive/ReceivePage';

function App() {
  const [activeTab, setActiveTab] =
    useState<NavigationTab>('home');
  const [receiveOpen, setReceiveOpen] = useState(false);

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage onReceive={() => setReceiveOpen(true)} />;

      case 'wallet':
          return <WalletPage onReceive={() => setReceiveOpen(true)} />;

      case 'plan':
        return <PlaceholderPage title="Plan" />;

      case 'services':
        return <PlaceholderPage title="Services" />;

      case 'profile':
        return <PlaceholderPage title="Profile" />;

      default:
        return <HomePage onReceive={() => setReceiveOpen(true)} />;
    }
  };

  return (
    <AppShell
      activeTab={activeTab}
      onNavigate={(tab) => {
        setActiveTab(tab);
        setReceiveOpen(false);
      }}
    >
      {receiveOpen ? (
        <ReceivePage onBack={() => setReceiveOpen(false)} />
      ) : (
        renderPage()
      )}
    </AppShell>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <section style={{ padding: '32px 20px' }}>
      <h1
        style={{
          margin: 0,
          fontSize: '28px',
          fontWeight: 800,
          letterSpacing: '-0.04em',
        }}
      >
        {title}
      </h1>

      <p style={{ color: 'var(--ravoxa-gray-dark)' }}>
        This section is coming next.
      </p>
    </section>
  );
}

export default App;