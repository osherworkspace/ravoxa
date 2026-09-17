import { type ReactNode } from 'react';
import {
  Home,
  Wallet,
  Target,
  Grid2X2,
  User,
} from 'lucide-react';

export type NavigationTab =
  | 'home'
  | 'wallet'
  | 'plan'
  | 'services'
  | 'profile';

interface AppShellProps {
  activeTab: NavigationTab;
  onNavigate: (tab: NavigationTab) => void;
  children: ReactNode;
}

const navigation = [
  {
    id: 'home' as const,
    label: 'Home',
    icon: Home,
  },
  {
    id: 'wallet' as const,
    label: 'Wallet',
    icon: Wallet,
  },
  {
    id: 'plan' as const,
    label: 'Plan',
    icon: Target,
  },
  {
    id: 'services' as const,
    label: 'Services',
    icon: Grid2X2,
  },
  {
    id: 'profile' as const,
    label: 'Profile',
    icon: User,
  },
];

export function AppShell({
  activeTab,
  onNavigate,
  children,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <main className="app-content">
        {children}
      </main>

      <nav className="bottom-navigation">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${active ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={21} strokeWidth={active ? 2.4 : 2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}