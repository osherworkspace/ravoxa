import { useEffect, useState } from 'react';
import { AppShell, type NavigationTab } from './layouts/AppShell';
import HomePage from './pages/Home/HomePage';
import WalletPage from './pages/Wallet/WalletPage';
import ReceivePage from './pages/Receive/ReceivePage';
import SendPage from './pages/Send/SendPage';
import SwapPage from './pages/Swap/SwapPage';
import RequestPage from './pages/Request/RequestPage';
import PlanPage from './pages/Plan/PlanPage';
import ProfilePage from './pages/Profile/ProfilePage';
import './pages/Mvp.css';

type Overlay = 'send' | 'receive' | 'request' | null;
type Navigation = { tab: NavigationTab; overlay: Overlay };
const NAV_KEY = 'ravoxa.navigation.v1';

function loadNavigation(): Navigation {
  const fallback: Navigation = { tab: 'home', overlay: null };
  try {
    const raw = window.sessionStorage.getItem(NAV_KEY);
    if (!raw) return fallback;
    const saved: unknown = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return fallback;
    const state = saved as Record<string, unknown>;
    const tabs: NavigationTab[] = ['home', 'wallet', 'plan', 'services', 'profile'];
    const overlays: Overlay[] = [null, 'send', 'receive', 'request'];
    if (tabs.includes(state.tab as NavigationTab) && overlays.includes(state.overlay as Overlay)) {
      return { tab: state.tab as NavigationTab, overlay: state.overlay as Overlay };
    }
  } catch {
    // A browser or MiniPay WebView can disable session storage.
  }
  return fallback;
}

export default function App() {
  const [{ tab, overlay }, setNavigation] = useState<Navigation>(loadNavigation);

  useEffect(() => {
    try { window.sessionStorage.setItem(NAV_KEY, JSON.stringify({ tab, overlay })); }
    catch { /* Navigation still functions when storage is blocked. */ }
  }, [tab, overlay]);

  function navigate(nextTab: NavigationTab) {
    setNavigation({ tab: nextTab, overlay: null });
  }
  function open(nextOverlay: Exclude<Overlay, null>) {
    setNavigation((current) => ({ ...current, overlay: nextOverlay }));
  }
  function close() {
    setNavigation((current) => ({ ...current, overlay: null }));
  }

  function renderTab() {
    switch (tab) {
      case 'home':
        return <HomePage onSend={() => open('send')} onReceive={() => open('receive')}
          onRequest={() => open('request')} onSwap={() => navigate('services')} onPlan={() => navigate('plan')} />;
      case 'wallet':
        return <WalletPage onSend={() => open('send')} onReceive={() => open('receive')} />;
      case 'plan':
        return <PlanPage />;
      case 'services':
        return <SwapPage onBack={() => navigate('home')} />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <HomePage onSend={() => open('send')} onReceive={() => open('receive')}
          onRequest={() => open('request')} onSwap={() => navigate('services')} onPlan={() => navigate('plan')} />;
    }
  }

  return (
    <AppShell activeTab={tab} onNavigate={navigate}>
      {overlay === 'receive' ? <ReceivePage onBack={close} />
        : overlay === 'send' ? <SendPage onBack={close} />
        : overlay === 'request' ? <RequestPage onBack={close} />
        : renderTab()}
    </AppShell>
  );
}
