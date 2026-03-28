import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Dumbbell, Utensils, Droplets, Moon, Camera, Settings, ChevronRight, Activity
} from 'lucide-react';

export type Page = 'overview' | 'workout' | 'nutrition' | 'hydration' | 'sleep' | 'posture' | 'healthkit' | 'settings';

interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const tabs: { label: string; page: Page; icon: React.ElementType; activeColor: string }[] = [
  { label: 'Overview', page: 'overview', icon: LayoutDashboard, activeColor: 'var(--color-blue)' },
  { label: 'Workout', page: 'workout', icon: Dumbbell, activeColor: 'var(--color-green)' },
  { label: 'Nutrition', page: 'nutrition', icon: Utensils, activeColor: 'var(--color-orange)' },
  { label: 'Hydration', page: 'hydration', icon: Droplets, activeColor: 'var(--color-teal)' },
  { label: 'Posture AI', page: 'posture', icon: Camera, activeColor: 'var(--color-indigo)' },
  { label: 'Apple Health', page: 'healthkit', icon: Activity, activeColor: 'var(--color-red)' },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return isMobile;
}

/* ── Desktop Sidebar ───────────────────────────────────────── */
function DesktopSidebar({ currentPage, onNavigate }: { currentPage: Page; onNavigate: (p: Page) => void }) {
  const [expanded, setExpanded] = useState(false);

  const sidebarWidth = expanded ? '220px' : '72px';

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      style={{
        width: sidebarWidth,
        minWidth: sidebarWidth,
        height: '100dvh',
        position: 'sticky',
        top: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-secondary)',
        borderRight: '0.5px solid var(--separator)',
        transition: 'width 280ms cubic-bezier(0.25, 0, 0, 1)',
        overflow: 'hidden',
        zIndex: 40,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '24px 16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg, var(--color-blue), var(--color-indigo))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)',
        }}>
          <Dumbbell size={20} color="white" />
        </div>
        <div style={{ opacity: expanded ? 1 : 0, transition: 'opacity 200ms', whiteSpace: 'nowrap' }}>
          <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px', color: 'var(--label-primary)' }}>Antigravity</div>
          <div style={{ fontSize: 11, color: 'var(--label-secondary)', fontWeight: 500 }}>AI Fitness Coach</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '4px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {tabs.map(({ label, page, icon: Icon, activeColor }) => {
          const isActive = currentPage === page;
          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 10px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                background: isActive ? activeColor + '18' : 'transparent',
                color: isActive ? activeColor : 'var(--label-secondary)',
                transition: 'all 150ms cubic-bezier(0.25, 0, 0, 1)',
                whiteSpace: 'nowrap',
                WebkitTapHighlightColor: 'transparent',
                fontFamily: 'var(--font-sans)',
                minHeight: 44,
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'var(--fill-tertiary)'; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} style={{ flexShrink: 0 }} />
              <span style={{
                fontSize: 15, fontWeight: isActive ? 600 : 400,
                opacity: expanded ? 1 : 0,
                transition: 'opacity 180ms',
              }}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Settings */}
      <div style={{ padding: '12px 10px', borderTop: '0.5px solid var(--separator)' }}>
        <button 
          onClick={() => onNavigate('settings')}
          style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 10px', borderRadius: 10, border: 'none',
          cursor: 'pointer', background: 'transparent',
          color: 'var(--label-secondary)', whiteSpace: 'nowrap',
          transition: 'all 150ms', fontFamily: 'var(--font-sans)',
          minHeight: 44, width: '100%',
          WebkitTapHighlightColor: 'transparent',
        }}>
          <Settings size={21} strokeWidth={1.8} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 15, opacity: expanded ? 1 : 0, transition: 'opacity 180ms' }}>Settings</span>
        </button>
      </div>
    </aside>
  );
}

/* ── iOS Bottom Tab Bar ───────────────────────────────────── */
function BottomTabBar({ currentPage, onNavigate }: { currentPage: Page; onNavigate: (p: Page) => void }) {
  return (
    <nav className="apple-tabbar" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      display: 'flex',
      justifyContent: 'space-around',
      padding: '8px 0',
      zIndex: 50,
    }}>
      {tabs.map(({ label, page, icon: Icon, activeColor }) => {
        const isActive = currentPage === page;
        return (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              flex: 1,
              padding: '4px 0',
              border: 'none',
              background: 'transparent',
              color: isActive ? activeColor : 'var(--label-tertiary)',
              cursor: 'pointer',
              transition: 'all 150ms var(--ease-out)',
              WebkitTapHighlightColor: 'transparent',
              fontFamily: 'var(--font-sans)',
            }}
          >
            <div style={{
              padding: '4px 16px',
              borderRadius: 14,
              background: isActive ? activeColor + '15' : 'transparent',
              transition: 'all 200ms var(--spring)',
              transform: isActive ? 'scale(1)' : 'scale(0.9)',
            }}>
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.6} />
            </div>
            <span style={{
              fontSize: 10, fontWeight: isActive ? 600 : 400,
              letterSpacing: '-0.1px',
              color: isActive ? activeColor : 'var(--label-tertiary)',
            }}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

/* ── Top Navigation Bar (mobile only) ───────────────────────── */
function TopNavBar({ title, onNavigate }: { title: string; onNavigate: (p: Page) => void }) {
  return (
    <header className="apple-navbar" style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      padding: 'env(safe-area-inset-top, 0px) 20px 0',
      display: 'flex',
      alignItems: 'flex-end',
      minHeight: 'calc(44px + env(safe-area-inset-top, 0px))',
    }}>
      <div style={{ padding: '10px 0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.41px', color: 'var(--label-primary)' }}>
          {title}
        </span>
        <div 
          onClick={() => onNavigate('settings')}
          style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #a855f7, #ec4899)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>A</span>
        </div>
      </div>
    </header>
  );
}

/* ── Main Layout ─────────────────────────────────────────────── */
export function DashboardLayout({ children, currentPage, onNavigate }: DashboardLayoutProps) {
  const isMobile = useIsMobile();
  const currentTab = tabs.find(t => t.page === currentPage);

  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--bg-primary)' }}>
      {/* Desktop sidebar */}
      {!isMobile && <DesktopSidebar currentPage={currentPage} onNavigate={onNavigate} />}

      {/* Main content area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        minHeight: '100dvh',
        overflowX: 'hidden',
      }}>
        {/* Desktop top bar */}
        {!isMobile && (
          <header className="apple-navbar" style={{
            padding: '0 32px',
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--label-secondary)', fontSize: 13 }}>
              <span>Antigravity</span>
              <ChevronRight size={12} />
              <span style={{ color: 'var(--label-primary)', fontWeight: 500 }}>{currentTab?.label}</span>
            </div>
            {/* User pill */}
            <div 
              onClick={() => onNavigate('settings')}
              style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--fill-tertiary)',
              padding: '6px 12px 6px 6px',
              borderRadius: 20,
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>A</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--label-primary)' }}>Abhishek</span>
            </div>
          </header>
        )}

        {/* Mobile nav bar */}
        {isMobile && <TopNavBar title={currentTab?.label ?? 'Settings'} onNavigate={onNavigate} />}

        {/* Page content */}
        <main
          className="animate-fade-in"
          key={currentPage}
          style={{
            flex: 1,
            padding: isMobile ? '20px 16px' : '28px 32px',
            paddingBottom: isMobile ? 'calc(90px + env(safe-area-inset-bottom, 0px))' : '32px',
            overflowX: 'hidden',
            maxWidth: 1200,
            width: '100%',
            margin: '0 auto',
          }}
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      {isMobile && <BottomTabBar currentPage={currentPage} onNavigate={onNavigate} />}
    </div>
  );
}
